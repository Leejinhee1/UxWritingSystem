# 5계층 라이팅 시스템 데이터 구조

업계 표준(Shopify Polaris, Atlassian, Mailchimp, IBM Carbon) 분석 기반.

## 핵심 구조: rules 테이블 하나로 모든 규칙 관리

5개 레이어의 모든 규칙이 **하나의 `rules` 테이블**에 저장된다. `rule_type` 필드로 어떤 레이어인지 구분.

```
rules 테이블
├── rule_type: "brand_voice"        → L1 Voice
├── rule_type: "writing_principle"  → L2 Writing Principles
├── rule_type: "grammar"            → L3 Grammar & Mechanics
├── rule_type: "ui_pattern"         → L4 Component Patterns
└── rule_type: "word_list"          → L5 Word List
```

각 레이어마다 `pattern` 필드(JSON)에 들어가는 데이터 구조가 다르다. 아래에서 레이어별로 설명.

## 감사 엔진: 관리에서 넣은 데이터가 감사에서 어떻게 쓰이나

```
┌─ 규칙 기반 (코드가 자동으로 잡음) ─────────────────┐
│  L5 용어집: 틀린 표현이 텍스트에 있으면 즉시 위반    │
└──────────────────────────────────────────────────────┘

┌─ AI 기반 (gpt-4o가 판단) ──────────────────────────┐
│  L1 Voice     → AI에게 브랜드 성격을 알려줌          │
│  L2 Principles → AI가 원칙 위반 여부를 판단          │
│  L3 Grammar    → AI가 문법/종결어미/날짜 형식 판단   │
│  L4 Patterns   → AI가 UI 유형에 맞는 톤/구조 판단   │
└──────────────────────────────────────────────────────┘

관리에서 데이터를 수정하면 → 다음 감사부터 바로 반영됨 (배포 불필요)
```

## 계층 요약

| Layer | 이름 | 역할 | 변경 빈도 | 감사에서의 역할 |
|-------|------|------|-----------|----------------|
| 1 | Voice | 브랜드 성격 | 연 1-2회 | AI에게 "너는 이런 성격이야" 알려줌. 수정안 톤에 반영. |
| 2 | Writing Principles | 글쓰기 원칙 | 분기 1회 | AI가 원칙별 위반 판단 (잡초뽑기, 능동태 등) |
| 3 | Grammar & Mechanics | 문법/형식 규칙 | 월 1회 | AI가 종결어미, 날짜/숫자 형식 위반 판단 |
| 4 | Component Patterns | UI 요소별 패턴 + 톤 | 기능 추가마다 | 테스트 시 선택한 UI 유형과 매칭. AI가 톤/구조 판단 |
| 5 | Word List | 용어집 | 기능 추가마다 | 코드가 자동 매칭 (AI 불필요). UI 유형 무관, 항상 검사 |

note: AI Harness(do-not 규칙)는 현재 제외. 필요해지면 Layer 0으로 추가.

---

## Layer 1: Voice (브랜드 성격)

우리 브랜드가 "누구"인가.

**관리 화면:** 관리 > Voice에서 편집
**감사에서:** AI에게 "너는 이런 성격이야"라고 전달. 직접 위반을 잡지는 않지만, AI가 수정안을 만들 때 이 톤을 반영한다. 예를 들어 "따뜻한" 성격이면 딱딱한 문장을 부드럽게 고치는 방향으로.

| 관리 필드 | 설명 | 예시 |
|-----------|------|------|
| 페르소나 | 브랜드가 사람이라면 어떤 사람인지 | "아이와 농장 체험을 해본 이웃집 언니/오빠" |
| 북극성 | 모든 문구의 판단 기준이 되는 한 문장 | "가족을 위한 서비스" |
| 성격 | 브랜드가 가져야 할 성격 태그 | 따뜻한, 쉬운, 구체적인 |
| 안티 성격 | 브랜드가 피해야 할 성격 태그 | 전문적인, 사무적인, 차가운 |

```json
{
  "persona": "아이와 농장 체험을 해본 이웃집 언니/오빠",
  "north_star": "가족을 위한 서비스",
  "traits": ["따뜻한", "쉬운", "구체적인", "안심되는", "가족적인"],
  "anti_traits": ["전문적인", "사무적인", "차가운", "형식적인"]
}
```

---

## Layer 2: Writing Principles (글쓰기 원칙)

모든 상황에 적용되는 원칙.

**관리 화면:** 관리 > Writing Principles에서 편집
**감사에서:** AI가 각 원칙을 읽고 위반 여부를 판단한다.

| 관리 필드 | 설명 | 감사에서의 역할 |
|-----------|------|----------------|
| 원칙 이름 | 원칙 제목 | AI에게 "이런 원칙이 있다"고 전달 |
| 설명 | 원칙의 상세 내용 | AI가 판단 기준으로 사용 |
| Do/Don't | 좋은 예시 / 나쁜 예시 | AI가 비슷한 패턴을 찾을 때 참고 |
| 잡초 단어 | 불필요할 수 있는 단어 목록 | AI가 맥락을 보고 삭제 여부 판단. "현재 점검 중" → 삭제, "현재 5명 대기" → 유지 |
| 중요도 | 필수/권장/참고 | 위반 시 얼마나 강하게 표시할지 |

pattern 구조 (잡초뽑기):
```json
{
  "weeds": ["현재", "혹시", "물론", "실제로", "기본적으로"],
  "examples": [{"do": "서비스 점검 중이에요.", "dont": "현재는 서비스 점검 중입니다."}]
}
```

pattern 구조 (일반 원칙):
```json
{
  "examples": [{"do": "신청해보세요", "dont": "신청이 필요합니다"}]
}
```

---

## Layer 3: Grammar & Mechanics (문법/형식 규칙)

문법과 표기 형식 규칙. AI가 Do/Don't 예시를 참고해서 위반을 판단한다.

**관리 화면:** 관리 > Grammar & Mechanics에서 편집
**감사에서:** AI가 종결어미, 날짜/숫자 형식 위반을 판단. 종결어미는 테스트 시 선택한 UI 유형에 따라 달라진다 (info→합쇼체 유지, body→해요체로 전환).

| 관리 필드 | 설명 | 감사에서의 역할 |
|-----------|------|----------------|
| 규칙 이름 | 문법 규칙 제목 | AI에게 전달 |
| 설명 | 규칙 상세 | AI 판단 기준 |
| Do/Don't 예시 | 올바른/잘못된 형식 비교 | AI가 이 예시를 보고 비슷한 패턴 감지. 예: Do "4월 25일" / Don't "4/25" |
| 맥락 (context) | Do/Don't에 맥락 라벨 추가 (선택) | 종결어미처럼 맥락에 따라 다른 규칙이 적용될 때 사용. 예: "일반 안내", "공식 알림" |
| 예외 UI 유형 | 이 규칙을 적용하지 않는 UI 유형 | L4 UI 유형 목록에서 선택. 예: 종결어미 규칙은 label, button, placeholder에서 제외 |
| 중요도 | 필수/권장/참고 | 위반 표시 강도 |

pattern 구조 (종결어미 통일):
```json
{
  "examples": [
    {"do": "배송 중이에요.", "dont": "배송 중이다.", "context": "일반 안내"},
    {"do": "서비스 점검 안내드립니다.", "dont": "서비스 점검 안내드려요.", "context": "공식 안내/공지"}
  ],
  "exception": ["label", "button", "placeholder"]
}
```

pattern 구조 (숫자 표기 등 일반 규칙):
```json
{
  "examples": [
    {"do": "1,000원", "dont": "1000원"},
    {"do": "3개", "dont": "3 개"}
  ]
}
```

---

## Layer 4: Component Patterns (UI 요소별 패턴 + 톤)

UI 요소 유형별 구체적 패턴 + 톤. 테스트 시 사용자가 선택하는 "UI 유형"과 여기서 관리하는 "UI 유형"이 매칭된다.

**관리 화면:** 관리 > Component Patterns에서 편집
**감사에서:** 사용자가 "error_message"로 테스트 → L4에서 error_message 패턴을 찾음 → AI가 해당 톤/구조 기준으로 판단.

| 관리 필드 | 설명 | 감사에서의 역할 |
|-----------|------|----------------|
| UI 유형 | error_message, button, heading 등 | 테스트 시 선택하는 UI 유형과 매칭. 종결어미 판단에도 영향 (info→합쇼체, body→해요체) |
| 톤 | 이 UI 유형에서 쓸 말투 | AI가 수정안 만들 때 이 톤 반영. 예: "공감하되 가볍지 않게" |
| 패턴 규칙 | 문구가 갖춰야 할 구조 | AI가 누락된 요소를 찾음. 예: "공감 + 해결책" → 해결책 없으면 위반 |
| Do/Don't | 좋은/나쁜 예시 쌍 | AI가 참고해서 비슷한 패턴 감지 |
| 예외 규칙 | 이 유형에서 건너뛸 L2/L3 규칙 | 규칙 목록에서 선택. 예: button은 종결어미+잡초뽑기 건너뜀. "전체 건너뛰기"도 가능 |
| 메모 | 내부 참고용 메모 | 감사에서는 사용 안 함 |

예시: error_message 패턴에 톤="공감하되 가볍지 않게", 패턴 규칙="공감 + 해결책"이라고 넣어두면
- "오류가 발생했습니다"를 error_message로 테스트
- AI: "공감이 없고 해결책도 없다" → 위반
- 수정안: "잠시 문제가 생겼어요. 다시 시도해 주세요."

pattern 구조:
```json
{
  "ui_type": "error_message",
  "tone": "공감하되 가볍지 않게. 해결 방법을 함께 제시.",
  "pattern_rule": "공감 + 해결책",
  "skip_rules": [],
  "examples": [
    {"do": "연락처 형식을 확인해주세요 (010-0000-0000)", "dont": "오류가 발생했습니다"},
    {"do": "잠시 문제가 생겼어요. 다시 시도해주세요.", "dont": "걱정 마세요~! 금방 될 거예요!!"}
  ]
}
```

```json
{
  "ui_type": "button",
  "tone": null,
  "pattern_rule": "행동동사 + ~하기/~받기",
  "skip_rules": ["(종결어미 통일 id)", "(잡초뽑기 id)"],
  "examples": [
    {"do": "신청하기", "dont": "신청"},
    {"do": "참여하기", "dont": "Submit"}
  ]
}
```

- tone이 null인 유형(button, label, placeholder)은 톤 판단을 하지 않음.
- skip_rules에 "ALL"을 넣으면 모든 규칙을 건너뜀 (label, placeholder).
- skip_rules에는 실제 규칙 id(cuid)가 들어감. 관리 화면에서 L2/L3 규칙 목록 중 선택.

---

## Layer 5: Word List (용어집)

서비스 고유 용어. 유일하게 AI 없이 코드가 자동으로 잡는 규칙.

**관리 화면:** 관리 > Word List에서 편집
**감사에서:** 입력 텍스트에 "틀린 표현"이 포함되어 있으면 즉시 위반. AI를 거치지 않으므로 가장 빠르고 정확하다. UI 유형과 무관하게 항상 검사한다 (label이어도 잡음).

| 관리 필드 | 설명 | 감사에서의 역할 |
|-----------|------|----------------|
| 공식 용어 | 정확한 표현 | 수정 제안 시 이 용어로 변경 권장 |
| 정의 | 용어 설명 | 감사에서는 사용 안 함. 팀 레퍼런스용 |
| 틀린 표현 | 잘못된 표현 목록 | 텍스트에 이 단어가 있으면 즉시 위반 |

예시: 공식 용어 "VISA", 틀린 표현 ["visa", "Visa"] 등록 시
- "visa 카드로 결제" 입력 → "visa" 대신 "VISA"을 사용하세요

```json
[
  {
    "term": "농장 매칭",
    "definition": "사용자 조건에 맞는 농장을 찾아 연결하는 과정",
    "aliases": ["농장 추천", "농장 소개", "농장 연결", "팜 매칭", "농장찾기"]
  },
  {
    "term": "구독",
    "definition": "작물 구독 서비스 (C타입)",
    "aliases": ["구독권", "정기배송", "작물배송"]
  },
  {
    "term": "체험",
    "definition": "원데이 농장 방문 프로그램 (B타입)",
    "aliases": ["체험학습", "농장견학", "팜투어"]
  }
]
```

---

## DB 테이블 설계

### rules 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text (cuid) | PK |
| rule_type | text | brand_voice / writing_principle / grammar / ui_pattern / word_list |
| name | text | 규칙 이름 |
| description | text | 규칙 설명 |
| severity | text | error(필수: 반드시 수정) / warning(권장: 수정 권장) / info(참고: 알림만) |
| pattern | text (JSON) | 규칙 유형별 구조 (위 각 계층 참고) |
| created_at | text (ISO 8601) | 생성일 |
| updated_at | text (ISO 8601) | 수정일 |

### audits 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text (cuid) | PK |
| input_text | text | 감사 대상 문구 |
| ui_category_detected | text | 감지된 UI 카테고리 |
| violations | text (JSON) | `[{rule_id, rule_type, message, severity}]` |
| suggestions | text (JSON) | `[{original, suggested, reason}]` |
| accepted_suggestion | text | 사용자가 수용한 최종 문구 (null 가능) |
| created_at | text (ISO 8601) | 생성일 |

### exceptions 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text (cuid) | PK |
| text_pattern | text | "무시"된 텍스트 패턴 |
| ui_type | text | UI 요소 유형 |
| rule_id | text | 무시 대상 규칙 |
| reason | text | 무시 사유 (선택) |
| created_at | text (ISO 8601) | 생성일 |

note: MVP에서는 user_id, project_id 없이 단일 프로젝트로 동작.

## DB 선택: SQLite + Prisma

- **SQLite:** 파일 하나(`prisma/dev.db`)가 DB 전체. 설치/설정 없음. 내부 도구에 적합.
- **Prisma ORM:** 타입 안전한 쿼리, 마이그레이션 자동화, Next.js와 바로 연동.
- **JSON 컬럼:** SQLite는 jsonb를 지원하지 않으므로 text 타입에 JSON 문자열로 저장. Prisma에서 `Json` 타입으로 매핑.
- **확장:** Vercel 배포 시 Prisma 스키마의 provider를 `postgresql`로 변경 + `DATABASE_URL` 환경변수 추가. 코드 수정 없음, 작업 10-15분.
