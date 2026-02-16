import { NextRequest } from "next/server";
import { getUserBySessionToken, readDB } from "@/lib/store";

export async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get("de_session")?.value;
  const db = await readDB();
  const user = getUserBySessionToken(db, token);
  return user;
}
