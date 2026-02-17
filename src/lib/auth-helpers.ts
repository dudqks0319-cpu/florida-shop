import crypto from "crypto";
import type { AppUser } from "@/lib/store";

export const ADULT_AGE = 19;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function isAdultFromBirthDate(birthDate: string, now = new Date()) {
  const birth = new Date(`${birthDate}T00:00:00+09:00`);
  if (Number.isNaN(birth.getTime())) return false;

  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= ADULT_AGE;
}

export function sanitizeText(input: string) {
  return String(input || "").trim();
}

export function assertProfileComplete(user: AppUser) {
  return Boolean(user.birthDate && user.address && user.apartment && user.dong);
}
