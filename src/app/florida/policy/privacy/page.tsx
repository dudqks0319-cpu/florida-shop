import Link from "next/link";

export default function FloridaPrivacyPage() {
  return (
    <main className="max-w-md mx-auto p-4 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">개인정보 처리방침</h1>
        <Link href="/florida/checkout" className="text-sm text-slate-500">
          결제로 돌아가기
        </Link>
      </div>

      <section className="mt-4 rounded-xl border bg-white p-4 text-sm space-y-3 leading-6 text-slate-700">
        <p>
          회사는 서비스 제공을 위해 필요한 최소한의 개인정보(이름, 연락처, 배송지, 결제 관련 식별정보)를 수집·이용합니다.
        </p>
        <p>
          1) 수집 목적: 주문 처리, 배송, 고객 문의 대응, 환불/교환 처리
        </p>
        <p>
          2) 보유 기간: 관련 법령 또는 분쟁 해결 목적상 필요한 기간 동안 보관 후 파기
        </p>
        <p>
          3) 이용자는 본인의 개인정보 열람·정정·삭제를 요청할 수 있으며, 법령상 보관 의무가 있는 정보는 예외가 될 수 있습니다.
        </p>
        <p>
          4) 회사는 개인정보 보호를 위해 접근권한 관리, 로그 모니터링, 전송 구간 보안 등 기술적·관리적 보호조치를 적용합니다.
        </p>
      </section>
    </main>
  );
}
