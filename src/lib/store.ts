import { promises as fs } from "fs";
import path from "path";

export type UserRole = "requester" | "helper" | "admin";

export type AuthProvider = "email" | "kakao" | "google" | "naver";

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  passwordHash?: string;
  provider?: AuthProvider;
  birthDate?: string; // YYYY-MM-DD
  address?: string;
  apartment?: string;
  dong?: string;
  neighborhoodVerifiedAt?: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type ErrandStatus = "open" | "matched" | "in_progress" | "done" | "cancelled";
export type PaymentMethod = "kakaopay" | "naverpay" | "tosspay" | "card";
export type PaymentStatus = "pending" | "ready" | "paid" | "failed";

export type Settlement = {
  platformFeeKrw: number;
  helperPayoutKrw: number;
  status: "pending" | "paid";
  settledAt?: string;
};

export type Cancellation = {
  reason: string;
  penaltyLevel: "none" | "medium";
  requesterPenaltyKrw: number;
  helperCompensationKrw: number;
  decidedAt: string;
};

export type PaymentInfo = {
  method: PaymentMethod;
  status: PaymentStatus;
  provider: "mock" | "live";
  orderId: string;
  paymentKey?: string;
  checkoutUrl?: string;
  paidAt?: string;
  failedReason?: string;
};

export type CompletionProof = {
  note?: string;
  imageUrl?: string;
  uploadedAt: string;
  helperId: string;
  helperName: string;
};

export type ErrandDispute = {
  status: "open" | "resolved";
  reason: string;
  reporterId: string;
  reporterName: string;
  createdAt: string;
  resolvedAt?: string;
  resolverId?: string;
  resolverName?: string;
  resolutionNote?: string;
  resolutionStatus?: "done" | "cancelled";
};

export type ErrandReview = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  targetRole: "requester" | "helper";
  rating: number;
  comment?: string;
  createdAt: string;
};

export type Errand = {
  id: string;
  title: string;
  detail: string;
  category: "convenience" | "delivery" | "bank" | "admin" | "etc";
  rewardKrw: number;
  requester: string;
  requesterId?: string;
  apartment: string;
  status: ErrandStatus;
  helper?: string;
  helperId?: string;
  payment: PaymentInfo;
  settlement?: Settlement;
  cancellation?: Cancellation;
  proof?: CompletionProof;
  dispute?: ErrandDispute;
  reviews?: ErrandReview[];
  approvedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  createdAt: string;
};

export type VerificationRequest = {
  id: string;
  requester: string;
  requesterId?: string;
  apartment: string;
  dong: string;
  code: string;
  expiresAt: string;
  verified: boolean;
  attempts: number;
  lastAttemptAt?: string;
  createdAt: string;
};

export type DB = {
  users: AppUser[];
  sessions: Session[];
  errands: Errand[];
  verifications: VerificationRequest[];
  meta?: { pilotApartment?: string };
};

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "errands.json");

const initial: DB = { users: [], sessions: [], errands: [], verifications: [], meta: {} };

export function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function normalizeRating(value: unknown) {
  const n = Number(value);
  if (!Number.isInteger(n)) return 5;
  return Math.min(5, Math.max(1, n));
}

export async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(dbFile, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DB>;

    const users = (parsed.users || []).map((u) => ({
      ...u,
      email: u.email ? String(u.email).toLowerCase() : undefined,
      provider: (u.provider as AuthProvider | undefined) || (u.passwordHash ? "email" : undefined),
    })) as AppUser[];

    const userIdByName = new Map<string, string>();
    for (const user of users) {
      if (!userIdByName.has(user.name)) {
        userIdByName.set(user.name, user.id);
      }
    }

    const errands = (parsed.errands || []).map((e) => {
      const requester = String(e.requester || "").trim();
      const helper = e.helper ? String(e.helper).trim() : undefined;
      const payment = e.payment || {
        method: "card",
        status: "pending",
        provider: "mock",
        orderId: `legacy-${e.id}`,
      };

      return {
        ...e,
        requester,
        requesterId: e.requesterId || (requester ? userIdByName.get(requester) : undefined),
        helper,
        helperId: e.helperId || (helper ? userIdByName.get(helper) : undefined),
        payment,
        proof: e.proof || undefined,
        dispute: e.dispute || undefined,
        reviews: (e.reviews || []).map((r) => ({
          ...r,
          rating: normalizeRating(r.rating),
        })),
      } as Errand;
    });

    const verifications = (parsed.verifications || []).map((v) => ({
      ...v,
      requesterId: v.requesterId || (v.requester ? userIdByName.get(v.requester) : undefined),
      attempts: typeof v.attempts === "number" ? v.attempts : 0,
    })) as VerificationRequest[];

    return {
      users,
      sessions: parsed.sessions || [],
      errands,
      verifications,
      meta: parsed.meta || {},
    };
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dbFile, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

export async function writeDB(db: DB) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbFile, JSON.stringify(db, null, 2), "utf-8");
}

export function pruneExpiredSessions(db: DB) {
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
}

export function getUserBySessionToken(db: DB, token?: string) {
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user || null;
}
