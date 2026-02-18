#!/usr/bin/env python3
"""Codex CLI batch processor + 우리동네심부름 목적별 프롬프트 템플릿.

사용 예시:

    python3 scripts/codex_batch_processor.py list-templates

    python3 scripts/codex_batch_processor.py render \
      --template errand_create_copy \
      --vars-json '{"requester_context":"퇴근이 늦어짐", ...}' \
      --out outputs/errand_copy.md

    python3 scripts/codex_batch_processor.py demo
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from textwrap import dedent
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence, Tuple, Union


PromptTemplateMap = Dict[str, str]


DONGNAE_PROMPT_TEMPLATES: PromptTemplateMap = {
    "errand_create_copy": dedent(
        """\
        역할: 로컬 심부름 앱 UX 카피라이터
        목표: 아래 입력을 바탕으로 의뢰 등록 문안을 소비자 친화적으로 정리

        입력:
        - 요청자 상황: {requester_context}
        - 요청 작업: {task_summary}
        - 물품/조건: {items_or_conditions}
        - 희망 시간: {time_window}
        - 보상금(원): {reward_krw}
        - 아파트/동: {apartment}
        - 주의사항: {caution}

        작성 규칙:
        - 제목 1개(28자 이내)
        - 한줄 요약 1개
        - 상세설명 bullet 4개
        - 수행자 체크포인트 bullet 3개
        - 안전/분쟁 예방 문구 2문장
        - 과장/허위 표현 금지

        출력 형식:
        [제목]
        [한줄요약]
        [상세설명]
        - ...
        [수행자 체크포인트]
        - ...
        [안전안내]
        ...
        """
    ),
    "helper_matching_message": dedent(
        """\
        역할: 매칭 매니저
        목표: 수행자에게 수락률이 높은 매칭 제안 메시지 작성

        입력:
        - 의뢰 제목: {title}
        - 작업 요약: {task_summary}
        - 예상 소요시간: {eta}
        - 보상금: {reward_krw}원
        - 에스크로 안내: {escrow_info}
        - 응답 마감: {response_deadline}
        - 동네: {neighborhood}

        작성 규칙:
        - 친절/간결 톤
        - 핵심 정보(보상, 시간, 위치, 안전장치) 우선
        - 마지막에 수락 유도 CTA 1문장

        출력:
        - 제목 1줄
        - 본문 5~7줄
        """
    ),
    "escrow_payment_guide": dedent(
        """\
        역할: 결제 UX 라이터
        목표: 결제 전 이탈을 줄이면서 신뢰를 높이는 안내문 작성

        입력:
        - 총 결제금액: {total_amount}원
        - 수행자 지급 예정: {helper_payout}원
        - 플랫폼 수수료: {platform_fee}원
        - 정산 조건: {settlement_condition}
        - 환불/취소 규칙: {refund_policy}

        작성 규칙:
        - 불안 해소 문장 2개
        - 단계별 설명 4단계(결제보관→매칭→증빙→승인정산)
        - 소비자 행동 유도 1문장
        - 400자 내외

        출력 형식: 마크다운
        """
    ),
    "proof_upload_request": dedent(
        """\
        역할: 거래 진행 어시스턴트
        목표: 수행자에게 증빙 업로드를 빠르게 유도

        입력:
        - 의뢰 제목: {title}
        - 필요한 증빙 유형: {required_proof}
        - 업로드 마감: {deadline}
        - 예시 파일: {examples}

        작성 규칙:
        - 명확한 행동 지시
        - 업로드 항목 체크리스트 3개
        - 누락 시 영향 1문장
        - 공격적 표현 금지

        출력:
        - 알림 제목 1줄(20자 이내)
        - 본문 4~6줄
        """
    ),
    "approval_request_message": dedent(
        """\
        역할: 거래 완료 안내 매니저
        목표: 요청자에게 완료 승인 행동 유도

        입력:
        - 의뢰 제목: {title}
        - 증빙 요약: {proof_summary}
        - 업로드 시간: {proof_time}
        - 승인 시 정산 금액: {payout_info}
        - 미승인 시 처리 정책: {timeout_policy}

        작성 규칙:
        - 핵심만 짧게
        - 승인 버튼 클릭 유도 CTA 포함
        - 분쟁 이동 경로 안내 1문장

        출력:
        - 제목 1줄
        - 본문 5줄 이내
        """
    ),
    "dispute_intake_structured": dedent(
        """\
        역할: 분쟁 접수 분석기
        목표: 자유서술 분쟁 내용을 운영팀 처리용으로 구조화

        입력:
        - 원문 신고 내용: {raw_dispute_text}
        - 거래 상태: {transaction_status}
        - 첨부/증빙 목록: {evidence_list}
        - 신고자 역할: {reporter_role}

        분류 기준:
        - reasonType: no_show | quality | fake_proof | amount | etc
        - 긴급도: low | medium | high
        - 권장 1차 대응: 1문장
        - 추가 요청 증빙: 1~2개

        출력 형식(JSON 유사):
        {{
          "reasonType": "...",
          "summary": "...",
          "keyFacts": ["...","..."],
          "urgency": "...",
          "firstResponseDraft": "...",
          "needMoreEvidence": ["..."]
        }}
        """
    ),
    "dispute_progress_notice": dedent(
        """\
        역할: CS 커뮤니케이션 담당자
        목표: 분쟁 접수 후 불안감을 줄이는 진행상황 안내

        입력:
        - 분쟁 번호: {dispute_id}
        - 현재 단계: {stage}
        - 다음 단계: {next_stage}
        - 예상 1차 답변 시간: {eta_hours}시간
        - 추가 요청사항: {additional_request}

        작성 규칙:
        - 공감 1문장 + 사실 안내
        - 책임 회피 금지
        - 최대 6문장

        출력:
        - 고객 발송용 메시지 본문만
        """
    ),
    "dispute_resolution_notice": dedent(
        """\
        역할: 분쟁 결과 안내 담당자
        목표: 결과(done/cancelled)를 명확하고 납득 가능하게 전달

        입력:
        - 결과: {decision}
        - 판단 근거: {reasoning}
        - 정산/환불 처리: {money_result}
        - 후속 조치: {follow_up}
        - 이의 재접수 정책: {appeal_policy}

        작성 규칙:
        - 단정적/공격적 표현 금지
        - 핵심 근거 2~3개 bullet
        - 마지막에 문의 채널 안내 1줄

        출력 형식: 마크다운
        """
    ),
    "review_request_message": dedent(
        """\
        역할: 리텐션 마케터
        목표: 거래 직후 리뷰 작성률을 높이는 메시지 생성

        입력:
        - 거래명: {title}
        - 상대 역할: {target_role}
        - 강조 포인트: {highlight}
        - 작성 소요시간 안내: {time_hint}

        작성 규칙:
        - 부담 적은 느낌
        - 1~5점 + 한줄 코멘트 유도
        - 4문장 이내

        출력:
        - 알림 제목(18자 이내)
        - 본문
        """
    ),
    "push_short_alert": dedent(
        """\
        역할: 모바일 푸시 카피라이터
        목표: 짧고 즉시 행동 가능한 알림 문구 생성

        입력:
        - 이벤트 타입: {event_type}
        - 핵심 메시지: {core_message}
        - CTA: {cta}
        - 톤: {tone}

        제약:
        - 제목 18자 이내
        - 본문 45자 이내
        - 이모지 최대 1개
        - 과장 표현 금지

        출력:
        {{
          "title": "...",
          "body": "...",
          "cta": "..."
        }}
        """
    ),
    "faq_safety_reply": dedent(
        """\
        역할: 신뢰/안전 정책 상담사
        목표: 안전정책 관련 문의에 이해 쉬운 답변 제공

        입력:
        - 질문: {question}
        - 정책 요약: {policy_summary}
        - 예외 상황: {exceptions}

        작성 규칙:
        - 쉬운 한국어
        - 핵심 답변 3문장
        - 예외/주의사항 bullet 2개
        - 마지막에 '도움 필요 시' 안내 1문장

        출력 형식: 마크다운
        """
    ),
    "admin_daily_report": dedent(
        """\
        역할: 운영 분석가
        목표: 하루 운영 현황 요약 리포트 작성

        입력 데이터:
        - 총 의뢰: {total_requests}
        - 완료: {done_count}
        - 취소: {cancel_count}
        - 열린 분쟁: {open_disputes}
        - 리뷰 수: {review_count}
        - 주요 이슈 로그: {issue_log}

        작성 규칙:
        - 오늘 요약 5줄
        - 리스크 3개
        - 내일 우선 실행 항목 3개
        - 데이터 과장 금지

        출력 형식: 마크다운
        """
    ),
}


def build_dongnae_prompt(template_key: str, **kwargs: Any) -> str:
    """템플릿 key + 변수로 최종 프롬프트를 렌더링합니다."""

    if template_key not in DONGNAE_PROMPT_TEMPLATES:
        available = ", ".join(sorted(DONGNAE_PROMPT_TEMPLATES.keys()))
        raise ValueError(f"Unknown template key '{template_key}'. Available: {available}")

    template = DONGNAE_PROMPT_TEMPLATES[template_key]
    try:
        return template.format(**kwargs).strip()
    except KeyError as exc:
        missing = exc.args[0]
        raise ValueError(f"Missing variable '{missing}' for template '{template_key}'") from exc


@dataclass(frozen=True)
class BatchTask:
    prompt: str
    output_file_path: str


@dataclass(frozen=True)
class BatchResult:
    index: int
    output_file_path: str
    ok: bool
    status: str
    message: str
    elapsed_sec: float


TaskLike = Union[BatchTask, Tuple[str, str]]


class CodexBatchProcessor:
    """Codex CLI를 병렬 실행하여 텍스트를 파일로 저장합니다."""

    def __init__(
        self,
        model: str = "codex-5.3-max",
        max_workers: int = 3,
        timeout: int = 300,
        cmd_base: str = "codex",
    ):
        self.cmd_base = cmd_base
        self.model = model
        self.max_workers = max_workers
        self.timeout = timeout

    @staticmethod
    def _normalize_tasks(tasks: Sequence[TaskLike]) -> List[BatchTask]:
        normalized: List[BatchTask] = []
        for item in tasks:
            if isinstance(item, BatchTask):
                normalized.append(item)
            else:
                prompt, output_file_path = item
                normalized.append(BatchTask(prompt=prompt, output_file_path=output_file_path))
        return normalized

    def _execute_task(self, idx: int, task: BatchTask) -> BatchResult:
        output_path = Path(task.output_file_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        command = [
            self.cmd_base,
            "exec",
            "--model",
            self.model,
            "--skip-git-repo-check",
            "--output-last-message",
            str(output_path),
            "--ephemeral",
            "-",
        ]

        started = time.time()
        try:
            subprocess.run(
                command,
                input=task.prompt,
                capture_output=True,
                text=True,
                check=True,
                shell=False,
                encoding="utf-8",
                timeout=self.timeout,
            )
            elapsed = time.time() - started
            return BatchResult(
                index=idx,
                output_file_path=str(output_path),
                ok=True,
                status="SUCCESS",
                message=f"Saved to {output_path}",
                elapsed_sec=elapsed,
            )
        except subprocess.CalledProcessError as exc:
            elapsed = time.time() - started
            stderr = (exc.stderr or "").strip() or "Unknown CLI Error"
            return BatchResult(
                index=idx,
                output_file_path=str(output_path),
                ok=False,
                status="ERROR",
                message=stderr,
                elapsed_sec=elapsed,
            )
        except subprocess.TimeoutExpired:
            elapsed = time.time() - started
            return BatchResult(
                index=idx,
                output_file_path=str(output_path),
                ok=False,
                status="TIMEOUT",
                message=f"Timed out after {self.timeout}s",
                elapsed_sec=elapsed,
            )
        except Exception as exc:  # pylint: disable=broad-except
            elapsed = time.time() - started
            return BatchResult(
                index=idx,
                output_file_path=str(output_path),
                ok=False,
                status="EXCEPTION",
                message=str(exc),
                elapsed_sec=elapsed,
            )

    def process_batch(self, tasks: Sequence[TaskLike]) -> List[BatchResult]:
        normalized = self._normalize_tasks(tasks)
        print(f"[*] Start batch: model={self.model}, workers={self.max_workers}, tasks={len(normalized)}")
        started = time.time()

        results: List[Optional[BatchResult]] = [None] * len(normalized)
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_idx = {
                executor.submit(self._execute_task, idx, task): idx for idx, task in enumerate(normalized)
            }
            for future in concurrent.futures.as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    results[idx] = future.result()
                except Exception as exc:  # pylint: disable=broad-except
                    results[idx] = BatchResult(
                        index=idx,
                        output_file_path=normalized[idx].output_file_path,
                        ok=False,
                        status="CRITICAL",
                        message=str(exc),
                        elapsed_sec=0.0,
                    )

        elapsed = time.time() - started
        print(f"[*] Batch completed in {elapsed:.2f}s")

        # mypy/pyright friendliness
        return [r for r in results if r is not None]

    def run_batch(self, tasks: Sequence[TaskLike]) -> List[BatchResult]:
        results = self.process_batch(tasks)
        ok_count = 0
        for res in results:
            prefix = "[SUCCESS]" if res.ok else f"[{res.status}]"
            print(f"{prefix} #{res.index} {res.output_file_path} ({res.elapsed_sec:.2f}s) :: {res.message}")
            if res.ok:
                ok_count += 1
        print(f"[*] Summary: {ok_count}/{len(results)} succeeded")
        return results


# ---------------- CLI helpers ----------------

def _read_vars_from_args(vars_json: Optional[str], vars_file: Optional[str]) -> Dict[str, Any]:
    if vars_json and vars_file:
        raise ValueError("--vars-json 과 --vars-file 중 하나만 사용하세요.")

    if vars_json:
        return json.loads(vars_json)

    if vars_file:
        with open(vars_file, "r", encoding="utf-8") as f:
            return json.load(f)

    return {}


def _cmd_list_templates() -> int:
    for key in sorted(DONGNAE_PROMPT_TEMPLATES):
        print(key)
    return 0


def _cmd_render(args: argparse.Namespace) -> int:
    variables = _read_vars_from_args(args.vars_json, args.vars_file)
    prompt = build_dongnae_prompt(args.template, **variables)

    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(prompt, encoding="utf-8")
        print(f"Saved rendered prompt -> {out_path}")
    else:
        print(prompt)
    return 0


def _cmd_demo(args: argparse.Namespace) -> int:
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    tasks: List[BatchTask] = [
        BatchTask(
            prompt=build_dongnae_prompt(
                "review_request_message",
                title="편의점 생수 부탁",
                target_role="수행자",
                highlight="빠른 전달과 친절한 응대",
                time_hint="30초",
            ),
            output_file_path=str(output_dir / "review_request_sample.txt"),
        ),
        BatchTask(
            prompt=build_dongnae_prompt(
                "push_short_alert",
                event_type="proof_uploaded",
                core_message="수행자가 완료 증빙을 업로드했습니다",
                cta="확인하고 승인하기",
                tone="명확하고 친절",
            ),
            output_file_path=str(output_dir / "push_alert_sample.json"),
        ),
    ]

    processor = CodexBatchProcessor(model=args.model, max_workers=args.max_workers, timeout=args.timeout)
    processor.run_batch(tasks)
    return 0


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Codex batch processor + 동네심부름 프롬프트 템플릿")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list-templates", help="사용 가능한 템플릿 key 목록")

    render = sub.add_parser("render", help="템플릿 1개 렌더링")
    render.add_argument("--template", required=True, help="템플릿 key")
    render.add_argument("--vars-json", help='JSON 문자열 변수 (예: "{\"title\":\"...\"}")')
    render.add_argument("--vars-file", help="JSON 파일 경로")
    render.add_argument("--out", help="렌더링 결과를 저장할 파일 경로")

    demo = sub.add_parser("demo", help="샘플 2건을 실제 Codex로 생성")
    demo.add_argument("--model", default="codex-5.3-max")
    demo.add_argument("--max-workers", type=int, default=2)
    demo.add_argument("--timeout", type=int, default=300)
    demo.add_argument("--output-dir", default="codex_test_outputs")

    return parser


def main() -> int:
    parser = _build_arg_parser()
    args = parser.parse_args()

    if args.command == "list-templates":
        return _cmd_list_templates()
    if args.command == "render":
        return _cmd_render(args)
    if args.command == "demo":
        return _cmd_demo(args)

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
