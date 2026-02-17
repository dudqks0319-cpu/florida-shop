"use client";

type PaymentMethod = { id: string; name: string; icon: string };

const methods: PaymentMethod[] = [
  { id: "kakaopay", name: "카카오페이", icon: "🟡" },
  { id: "naverpay", name: "네이버페이", icon: "🟢" },
  { id: "tosspay", name: "토스페이", icon: "🔵" },
  { id: "card", name: "신용/체크카드", icon: "💳" },
  { id: "transfer", name: "계좌이체", icon: "🏦" },
  { id: "virtual", name: "가상계좌", icon: "🧾" },
  { id: "phone", name: "휴대폰결제", icon: "📱" },
];

export default function PaymentMethodSelector({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <section className="card">
      <h3 className="font-bold">💳 결제수단</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`text-sm p-2.5 rounded-lg border ${selected === m.id ? "border-[#FF6B35] bg-orange-50 text-[#E55A2B] font-semibold" : "border-slate-200 bg-white"}`}
          >
            {m.icon} {m.name}
          </button>
        ))}
      </div>
    </section>
  );
}
