import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getUserBySessionToken, readDB } from "@/lib/store";

export async function getCurrentUser(req: NextRequest) {
  const db = await readDB();

  const token = req.cookies.get("de_session")?.value;
  const byLegacySession = getUserBySessionToken(db, token);
  if (byLegacySession) return byLegacySession;

  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const byOAuth = db.users.find((u) => (u.email || "").toLowerCase() === email);
  return byOAuth || null;
}
