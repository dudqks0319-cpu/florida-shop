export type FloridaOrder = {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  size?: string;
  qty: number;
  amount: number;
  method: "kakaopay" | "naverpay" | "tosspay" | "card";
  buyerName: string;
  createdAt: string;
  status: "결제대기" | "주문완료";
};

const KEY_WISH = "florida:wish";
const KEY_CART = "florida:cart";
const KEY_RECENT = "florida:recent";
const KEY_ORDERS = "florida:orders";

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getWish() {
  return safeGet<Record<string, boolean>>(KEY_WISH, {});
}
export function setWish(v: Record<string, boolean>) {
  safeSet(KEY_WISH, v);
}

export function getCart() {
  return safeGet<Record<string, number>>(KEY_CART, {});
}
export function setCart(v: Record<string, number>) {
  safeSet(KEY_CART, v);
}

export function getRecent() {
  return safeGet<string[]>(KEY_RECENT, []);
}
export function pushRecent(productId: string) {
  const cur = getRecent();
  const next = [productId, ...cur.filter((id) => id !== productId)].slice(0, 20);
  safeSet(KEY_RECENT, next);
}

export function getOrders() {
  return safeGet<FloridaOrder[]>(KEY_ORDERS, []);
}
export function addOrder(order: FloridaOrder) {
  const cur = getOrders();
  safeSet(KEY_ORDERS, [order, ...cur]);
}
