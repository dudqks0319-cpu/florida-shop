import { promises as fs } from "fs";
import path from "path";

export type ErrandStatus = "open" | "matched" | "in_progress" | "done" | "cancelled";

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
  createdAt: string;
};

export type VerificationRequest = {
  id: string;
  apartment: string;
  dong: string;
  code: string;
  expiresAt: string;
  verified: boolean;
  createdAt: string;
};

type DB = { errands: Errand[]; verifications: VerificationRequest[] };

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "errands.json");

const initial: DB = { errands: [], verifications: [] };

export function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(dbFile, "utf-8");
    return JSON.parse(raw) as DB;
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
