import Link from "next/link";

export default function FloridaTermsPage() {
  return (
    <main className="max-w-md mx-auto p-4 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">이용약관</h1>
        <Link href="/florida/checkout" className="text-sm text-slate-500">
          결제로 돌아가기
        </Link>
      </div>

      <section className="mt-4 rounded-xl border bg-white p-4 text-sm space-y-3 leading-6 text-slate-700">
        <p>
          본 약관은 FLORIDA 쇼핑몰(이하 &quot;회사&quot;)이 제공하는 전자상거래 서비스 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정합니다.
        </p>
        <p>
          1) 이용자는 회원 가입 시 정확한 정보를 제공해야 하며, 타인의 정보를 도용할 수 없습니다.
        </p>
        <p>
          2) 상품 주문 후 결제가 완료되면 주문이 확정되며, 품절/재고 오류 등 불가피한 사유가 있을 경우 회사는 환불 조치할 수 있습니다.
        </p>
        <p>
          3) 교환·반품은 전자상거래법 및 회사 정책에 따르며, 단순 변심의 경우 배송비가 부과될 수 있습니다.
        </p>
        <p>
          4) 회사는 서비스 운영상 필요한 경우 사전 공지 후 약관을 개정할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
