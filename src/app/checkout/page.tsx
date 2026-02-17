"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import OrderItemList, { type OrderItem } from "@/components/checkout/OrderItemList";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import OrderSummary from "@/components/checkout/OrderSummary";
import SavedAddresses from "@/components/checkout/SavedAddresses";

const mockOrderItems: OrderItem[] = [
  { id: "1", name: "오버핏 린넨 셔츠 5color", image: "/florida/uploads/look-1.jpg", option: "화이트 / M", quantity: 1, price: 29900 },
  { id: "2", name: "캔버스 숄더백", image: "/florida/uploads/look-2.jpg", option: "블랙", quantity: 1, price: 29000 },
];

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("kakaopay");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [deliveryMemo, setDeliveryMemo] = useState("문 앞에 두고 벨 눌러주세요");
  const [selectedCoupon, setSelectedCoupon] = useState("new3000");
  const [pointUsed, setPointUsed] = useState(0);

  const productTotal = useMemo(() => mockOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), []);
  const shippingFee = productTotal >= 50000 ? 0 : 3000;
  const couponDiscount = selectedCoupon === "new3000" ? 3000 : 0;

  return (
    <main className="max-w-md mx-auto p-4 pb-24 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black">주문/결제</h1>
        <Link href="/florida/cart" className="text-sm text-slate-500">장바구니</Link>
      </div>

      <OrderItemList items={mockOrderItems} />

      <SavedAddresses onSelect={(a) => {
        setName(a.name); setPhone(a.phone); setAddress(a.address); setAddressDetail(a.detail);
      }} />

      <section className="card">
        <h3 className="font-bold">🚚 배송지</h3>
        <div className="mt-2 space-y-2">
          <input value={name} onChange={(e)=>setName(e.target.value)} className="input-field w-full" placeholder="받는 분" />
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="input-field w-full" placeholder="연락처" />
          <input value={address} onChange={(e)=>setAddress(e.target.value)} className="input-field w-full" placeholder="주소" />
          <input value={addressDetail} onChange={(e)=>setAddressDetail(e.target.value)} className="input-field w-full" placeholder="상세주소" />
          <select value={deliveryMemo} onChange={(e)=>setDeliveryMemo(e.target.value)} className="input-field w-full">
            <option>문 앞에 두고 벨 눌러주세요</option>
            <option>경비실에 맡겨주세요</option>
            <option>배송 전 연락 부탁드려요</option>
          </select>
        </div>
      </section>

      <section className="card">
        <h3 className="font-bold">🎫 할인</h3>
        <select value={selectedCoupon} onChange={(e)=>setSelectedCoupon(e.target.value)} className="input-field w-full mt-2">
          <option value="new3000">신규 3,000원 할인</option>
          <option value="none">사용 안 함</option>
        </select>
        <div className="mt-2 flex gap-2">
          <input type="number" value={pointUsed} onChange={(e)=>setPointUsed(Number(e.target.value)||0)} className="input-field flex-1" placeholder="적립금" />
          <button className="btn-secondary" onClick={()=>setPointUsed(1000)}>전액사용</button>
        </div>
      </section>

      <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
      <OrderSummary
        productTotal={productTotal}
        shippingFee={shippingFee}
        couponDiscount={couponDiscount}
        pointUsed={pointUsed}
        isMockMode
        onSubmit={() => alert(`${paymentMethod} 결제 진행 (MOCK)`)}
      />
    </main>
  );
}
