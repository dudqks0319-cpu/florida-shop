import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
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
