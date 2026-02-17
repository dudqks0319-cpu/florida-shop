"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FLORIDA_PRODUCTS } from "@/lib/florida-products";
import { addOrders, clearCart, getCart, type FloridaOrder } from "@/lib/florida-store";

type AddressItem = {
  roadAddr: string;
  jibunAddr: string;
  zipNo: string;
  bdNm: string;
};

const COUPONS = [
  { code: "WELCOME3000", label: "신규 3,000원 할인", amount: 3000 },
  { code: "FLORIDA10", label: "10% 할인(최대 7,000원)", percent: 10, max: 7000 },
];

export default function FloridaCheckoutPage() {
  const [cart] = useState<Record<string, number>>(() => getCart());
  const [buyerName, setBuyerName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [addrKeyword, setAddrKeyword] = useState("");
  const [addrItems, setAddrItems] = useState<AddressItem[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<AddressItem | null>(null);
  const [detailAddress, setDetailAddress] = useState("");
  const [deliveryRequest, setDeliveryRequest] = useState("문 앞에 두고 벨 눌러주세요");
  const [couponCode, setCouponCode] = useState("WELCOME3000");
  const [method, setMethod] = useState<"kakaopay" | "naverpay" | "tosspay" | "card">("kakaopay");
  const [payMode, setPayMode] = useState<"mock" | "live">("mock");
  const [methodReady, setMethodReady] = useState<Record<string, boolean>>({});
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const p = FLORIDA_PRODUCTS.find((x) => x.id === id);
          if (!p) return null;
          return { product: p, qty };
        })
        .filter(Boolean) as { product: (typeof FLORIDA_PRODUCTS)[number]; qty: number }[],
    [cart],
  );

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.product.price * item.qty, 0), [items]);
  const shippingFee = subtotal >= 30000 ? 0 : 3000;
  const couponDiscount = useMemo(() => {
    const c = COUPONS.find((x) => x.code === couponCode);
    if (!c) return 0;
    if (c.amount) return c.amount;
    if (c.percent) return Math.min(Math.floor((subtotal * c.percent) / 100), c.max || 999999);
    return 0;
  }, [couponCode, subtotal]);
  const total = Math.max(subtotal + shippingFee - couponDiscount, 0);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/florida/payment/mode");
      const json = await res.json();
      setPayMode(json.mode || "mock");
      setMethodReady(json.methodReady || {});
    })();
  }, []);

  const searchAddress = async () => {
    if (!addrKeyword.trim()) return;
    const res = await fetch(`/api/address/lookup?keyword=${encodeURIComponent(addrKeyword.trim())}`);
    const json = await res.json();
    if (!res.ok) {
      setNotice(json.error || "주소 검색 실패");
      return;
    }
    setAddrItems(json.items || []);
  };

  const checkout = async () => {
    if (!items.length) return setNotice("장바구니가 비어 있습니다.");
    if (!buyerName.trim()) return setNotice("주문자 이름을 입력해주세요.");
    if (!receiverPhone.trim()) return setNotice("연락처를 입력해주세요.");
    if (!selectedAddr) return setNotice("도로명 주소를 선택해주세요.");
    if (!agree) return setNotice("약관 동의가 필요합니다.");
    if (payMode === "live" && !methodReady[method]) {
      return setNotice(`선택한 결제수단(${method})의 라이브 키 설정이 필요합니다.`);
    }

    setBusy(true);
    const ready = await fetch("/api/florida/payment/ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, amount: total, orderName: `${buyerName}님의 주문` }),
    });
    const readyJson = await ready.json();
    if (!ready.ok) {
      setNotice(readyJson.error || "결제 준비 실패");
      setBusy(false);
      return;
    }

    const group = `grp-${Date.now()}`;
    const orders: FloridaOrder[] = items.map((item, idx) => ({
      id: `${group}-${idx + 1}`,
      orderGroupId: group,
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.image,
      qty: item.qty,
      amount: item.product.price * item.qty,
      method,
      buyerName: buyerName.trim(),
      receiverName: buyerName.trim(),
      receiverPhone: receiverPhone.trim(),
      roadAddress: selectedAddr.roadAddr,
      detailAddress: detailAddress.trim(),
      zipNo: selectedAddr.zipNo,
      deliveryRequest,
      createdAt: new Date().toISOString(),
      status: "배송준비",
    }));

    addOrders(orders);
    clearCart();
    window.open(readyJson.checkoutUrl, "_blank", "noopener,noreferrer");
    setNotice("주문이 생성되었습니다. 마이페이지에서 확인하세요.");
    setBusy(false);
  };

  return (
    <main className="max-w-md mx-auto p-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">주문/결제</h1>
        <Link href="/florida/cart" className="text-sm text-slate-500">장바구니</Link>
      </div>

      <section className="mt-4 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold">배송지</h2>
        <input className="mt-2 w-full border rounded-lg px-3 py-2" placeholder="주문자 이름" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        <input className="mt-2 w-full border rounded-lg px-3 py-2" placeholder="연락처 (예: 01012345678)" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />

        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <input className="border rounded-lg px-3 py-2" placeholder="도로명 주소 검색" value={addrKeyword} onChange={(e) => setAddrKeyword(e.target.value)} />
          <button className="border rounded-lg px-3 py-2" onClick={searchAddress}>검색</button>
        </div>

        {addrItems.length > 0 && (
          <div className="mt-2 max-h-44 overflow-auto border rounded-lg">
            {addrItems.map((a, i) => (
              <button key={`${a.roadAddr}-${i}`} onClick={() => setSelectedAddr(a)} className={`w-full text-left p-2 text-sm border-b last:border-0 ${selectedAddr?.roadAddr === a.roadAddr ? "bg-blue-50" : "bg-white"}`}>
                {a.roadAddr} ({a.zipNo})
              </button>
            ))}
          </div>
        )}

        <input className="mt-2 w-full border rounded-lg px-3 py-2" placeholder="상세주소" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} />
        <input className="mt-2 w-full border rounded-lg px-3 py-2" placeholder="배송 요청사항" value={deliveryRequest} onChange={(e) => setDeliveryRequest(e.target.value)} />
      </section>

      <section className="mt-3 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold">할인/결제수단</h2>
        <select className="mt-2 w-full border rounded-lg px-3 py-2" value={couponCode} onChange={(e) => setCouponCode(e.target.value)}>
          {COUPONS.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <select className="mt-2 w-full border rounded-lg px-3 py-2" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
          <option value="kakaopay">카카오페이</option>
          <option value="naverpay">네이버페이</option>
          <option value="tosspay">토스페이</option>
          <option value="card">카드</option>
        </select>
      </section>

      <section className="mt-3 p-4 border rounded-xl bg-slate-50 text-sm">
        <p className="mb-2 text-xs text-slate-500">결제모드: <b>{payMode === "live" ? "LIVE" : "MOCK"}</b></p>
        <div className="flex justify-between"><span>상품금액</span><b>{subtotal.toLocaleString("ko-KR")}원</b></div>
        <div className="flex justify-between mt-1"><span>배송비</span><b>{shippingFee.toLocaleString("ko-KR")}원</b></div>
        <div className="flex justify-between mt-1"><span>쿠폰할인</span><b>-{couponDiscount.toLocaleString("ko-KR")}원</b></div>
        <div className="flex justify-between mt-2 text-lg"><span>최종 결제금액</span><b>{total.toLocaleString("ko-KR")}원</b></div>
        <label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> 주문 정보 및 결제에 동의합니다.</label>
      </section>

      <button onClick={checkout} disabled={busy} className="mt-3 w-full rounded-xl bg-blue-600 text-white py-3 font-semibold disabled:opacity-60">
        {busy ? "결제 준비중..." : "결제하기"}
      </button>

      {notice && <p className="mt-2 text-sm text-blue-600">{notice}</p>}
    </main>
  );
}
