import { promises as fs } from "fs";
import path from "path";

export type UserRole = "requester" | "helper" | "admin";

export type AppUser = {
  id: string;
  name: string;
  role: UserRole;
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

export type Errand = {
  id: string;
  title: string;
  detail: string;
  category: "convenience" | "delivery" | "bank" | "admin" | "etc";
  rewardKrw: number;
  requester: string;
  apartment: string;
  status: ErrandStatus;
  helper?: string;
  payment: PaymentInfo;
  settlement?: Settlement;
  cancellation?: Cancellation;
  createdAt: string;
};

export type VerificationRequest = {
  id: string;
  requester: string;
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

export async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(dbFile, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      users: parsed.users || [],
      sessions: parsed.sessions || [],
      errands: (parsed.errands || []).map((e) => ({
        ...e,
        payment: e.payment || {
          method: "card",
          status: "pending",
          provider: "mock",
          orderId: `legacy-${e.id}`,
        },
      })),
      verifications: (parsed.verifications || []).map((v) => ({
        ...v,
        attempts: typeof v.attempts === "number" ? v.attempts : 0,
      })),
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
