export type FloridaOrderStatus = "결제대기" | "주문완료" | "배송준비" | "배송중" | "배송완료";

export type FloridaOrder = {
  id: string;
  orderGroupId?: string;
  productId: string;
  productName: string;
  productImage?: string;
  size?: string;
  qty: number;
  amount: number;
  method: "kakaopay" | "naverpay" | "tosspay" | "card";
  buyerName: string;
  receiverName?: string;
  receiverPhone?: string;
  roadAddress?: string;
  detailAddress?: string;
  zipNo?: string;
  deliveryRequest?: string;
  createdAt: string;
  status: FloridaOrderStatus;
  claimType?: "refund" | "exchange";
  claimReason?: string;
  claimStatus?: "요청접수" | "처리중" | "완료" | "반려";
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
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
export function clearCart() {
  safeSet(KEY_CART, {});
}
export function updateCartQty(productId: string, qty: number) {
  const cur = getCart();
  const next = { ...cur };
  if (qty <= 0) delete next[productId];
  else next[productId] = qty;
  setCart(next);
  return next;
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
export function addOrders(orders: FloridaOrder[]) {
  const cur = getOrders();
  safeSet(KEY_ORDERS, [...orders, ...cur]);
}

export function setOrderStatus(orderId: string, status: FloridaOrderStatus) {
  const cur = getOrders();
  const next = cur.map((o) => (o.id === orderId ? { ...o, status } : o));
  safeSet(KEY_ORDERS, next);
  return next;
}

export function requestOrderClaim(orderId: string, type: "refund" | "exchange", reason: string) {
  const cur = getOrders();
  const next = cur.map((o) =>
    o.id === orderId
      ? {
          ...o,
          claimType: type,
          claimReason: reason,
          claimStatus: "요청접수" as const,
        }
      : o,
  );
  safeSet(KEY_ORDERS, next);
  return next;
}

export function updateOrderAdmin(
  orderId: string,
  patch: Partial<Pick<FloridaOrder, "status" | "claimStatus" | "courier" | "trackingNumber" | "trackingUrl">>,
) {
  const cur = getOrders();
  const next = cur.map((o) => (o.id === orderId ? { ...o, ...patch } : o));
  safeSet(KEY_ORDERS, next);
  return next;
}
