import { NextResponse } from "next/server";
import { listShopProducts } from "@/lib/repositories/shop-products";

export async function GET() {
  const products = await listShopProducts();
  return NextResponse.json({ ok: true, products, source: process.env.NEXT_PUBLIC_SUPABASE_URL ? "supabase_or_fallback" : "fallback" });
}
