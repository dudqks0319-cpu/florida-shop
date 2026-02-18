import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, type UserRole, writeDB } from "@/lib/store";

const ALLOWED_ROLES: UserRole[] = ["requester", "helper"];

export async function PATCH(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (currentUser.role === "admin") {
    return NextResponse.json({ error: "관리자 역할은 변경할 수 없습니다." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const nextRole = String(body?.role || "").trim() as UserRole;

  if (!ALLOWED_ROLES.includes(nextRole)) {
    return NextResponse.json({ error: "role은 requester/helper 중 하나여야 합니다." }, { status: 400 });
  }

  if (nextRole === currentUser.role) {
    return NextResponse.json({ ok: true, user: { ...currentUser, role: currentUser.role } });
  }

  const db = await readDB();
  const userIndex = db.users.findIndex((u) => u.id === currentUser.id);
  if (userIndex < 0) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  db.users[userIndex] = {
    ...db.users[userIndex],
    role: nextRole,
  };

  await writeDB(db);

  const user = db.users[userIndex];
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      provider: user.provider,
      birthDate: user.birthDate,
      address: user.address,
      apartment: user.apartment,
      dong: user.dong,
      neighborhoodVerifiedAt: user.neighborhoodVerifiedAt,
    },
  });
}
