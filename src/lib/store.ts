import { promises as fs } from "fs";
import path from "path";

export type ErrandStatus = "open" | "matched" | "in_progress" | "done" | "cancelled";

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
  createdAt: string;
};

type DB = {
  errands: Errand[];
  verifications: VerificationRequest[];
  meta?: { pilotApartment?: string };
};

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "errands.json");

const initial: DB = { errands: [], verifications: [], meta: {} };

export function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(dbFile, "utf-8");
    const parsed = JSON.parse(raw) as DB;
    return {
      errands: parsed.errands || [],
      verifications: parsed.verifications || [],
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
