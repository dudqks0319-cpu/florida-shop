import { NextResponse } from "next/server";

export async function GET() {
  const mode = process.env.PAYMENT_MODE === "live" ? "live" : "mock";

  const methodReady = {
    card: Boolean(process.env.TOSS_CLIENT_KEY),
    tosspay: Boolean(process.env.TOSS_CLIENT_KEY),
    kakaopay: Boolean(process.env.KAKAOPAY_ADMIN_KEY),
    naverpay: Boolean(process.env.NAVERPAY_CLIENT_ID && process.env.NAVERPAY_CLIENT_SECRET),
  };

  return NextResponse.json({ mode, methodReady });
}
