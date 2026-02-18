# Codex Batch Processor (우리동네심부름 템플릿 포함)

파일: `scripts/codex_batch_processor.py`

## 1) 템플릿 목록 보기

```bash
python3 scripts/codex_batch_processor.py list-templates
```

## 2) 템플릿 1건 렌더링

```bash
python3 scripts/codex_batch_processor.py render \
  --template review_request_message \
  --vars-json '{"title":"편의점 생수 부탁","target_role":"수행자","highlight":"빠른 전달","time_hint":"30초"}'
```

파일로 저장:

```bash
python3 scripts/codex_batch_processor.py render \
  --template push_short_alert \
  --vars-file ./scripts/sample_push_vars.json \
  --out ./outputs/push_prompt.txt
```

## 3) 실제 Codex 병렬 생성 데모

> 사전 조건: `codex` CLI가 PATH에 있어야 함

```bash
python3 scripts/codex_batch_processor.py demo \
  --model codex-5.3-max \
  --max-workers 2 \
  --timeout 300 \
  --output-dir codex_test_outputs
```

## 4) 파이썬 코드에서 직접 사용

```python
from scripts.codex_batch_processor import (
    build_dongnae_prompt,
    BatchTask,
    CodexBatchProcessor,
)

tasks = [
    BatchTask(
        prompt=build_dongnae_prompt(
            "dispute_intake_structured",
            raw_dispute_text="수행자가 완료했다는데 물건이 없어요",
            transaction_status="in_progress",
            evidence_list="채팅 캡처 2장",
            reporter_role="requester",
        ),
        output_file_path="outputs/dispute_case_001.json",
    ),
]

processor = CodexBatchProcessor(model="codex-5.3-max", max_workers=2, timeout=300)
processor.run_batch(tasks)
```

## 포함된 목적별 템플릿

- `errand_create_copy`
- `helper_matching_message`
- `escrow_payment_guide`
- `proof_upload_request`
- `approval_request_message`
- `dispute_intake_structured`
- `dispute_progress_notice`
- `dispute_resolution_notice`
- `review_request_message`
- `push_short_alert`
- `faq_safety_reply`
- `admin_daily_report`
