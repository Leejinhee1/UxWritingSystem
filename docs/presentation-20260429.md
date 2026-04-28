# UX Writing System
### AI 라이팅 감사 에이전트

2026.04.29 리뷰

---

## 1. 왜 만들었는가

### 문제

- 기획/디자인/퍼블 조직이 나뉜 팀에서 **톤앤매너 불일치가 반복** 발생
- 문서로 된 가이드라인은 **아무도 안 읽는다**
- UX writing 가이드라인(5원칙, 10카테고리, 금지 표현)을 사람이 매번 검수하는 건 한계가 있음

### 해결 방향

> "규칙을 외워라"가 아니라 **"그냥 써, 내가 봐줄게"**

UI 문구를 입력하면 AI가 라이팅 가이드라인에 따라 자동 감사하고, 수정안을 제안하는 내부 도구.

### 대상 사용자

| 역할 | 사용 시점 |
|------|-----------|
| 기획자 | 화면 문구를 기획하는 과정에서 |
| 디자이너 | Figma에서 문구를 넣을 때 |
| 퍼블리셔 | 최종 구현 전 문구 검증 |

---

## 2. 타사 사례 조사

UX Writing System은 글로벌 디자인 시스템들의 Content Guidelines를 벤치마킹했습니다.

### 해외 사례

| 회사 | 시스템 | 특징 |
|------|--------|------|
| **Atlassian** | [Voice and Tone Principles](https://atlassian.design/content/voice-and-tone-principles/) | 상황별 톤 가이드. "Bold, Optimistic, Practical" 등 브랜드 성격 정의 |
| **Shopify** | [Polaris Content Guidelines](https://polaris.shopify.com/content/product-content) | UI 컴포넌트별 라이팅 패턴. 에러 메시지, 빈 상태, 버튼 등 유형별 가이드 |
| **Mailchimp** | [Content Style Guide](https://styleguide.mailchimp.com/) | 브랜드 보이스 프레임워크의 원조. Voice & Tone 분리 개념 정립 |
| **IBM** | [Carbon Content Guidelines](https://carbondesignsystem.com/guidelines/content/overview/) | 디자인 시스템과 콘텐츠 가이드라인 통합. 접근성 중심 |

### 국내 사례

| 회사 | 참고 내용 |
|------|-----------|
| **토스** | [8가지 라이팅 원칙](https://toss.tech/article/8-writing-principles-of-toss) — 한국어 UX Writing의 대표 사례. 잡초뽑기, 능동태, 구체적 숫자 등 |

### 새로운 흐름: Agentic Content Design

| 출처 | 핵심 아이디어 |
|------|---------------|
| [UX Writing Hub — Content Design Systems](https://uxwritinghub.com/content-design-systems/) | 콘텐츠 가이드라인을 시스템화하는 프레임워크 |
| [UX Writing Hub — Agentic Content Design](https://uxwritinghub.com/agentic-content-design-guidelines/) | AI 에이전트가 콘텐츠 가이드라인을 직접 적용하는 시대의 설계 원칙 |

### 우리의 차별점

기존 사례들은 모두 **"사람이 읽고 따르는 문서"**입니다.
우리는 이 가이드라인을 **AI가 직접 실행하는 규칙 엔진**으로 만들었습니다.

---

## 3. 현재 구현된 프로젝트

### 3-1. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend/Backend | Next.js (App Router) + Tailwind CSS |
| Database | SQLite + Prisma ORM (배포 시 PostgreSQL 전환, 설정만 변경) |
| AI | OpenAI gpt-4o |
| 인증 | 비밀번호 기반 (관리자 전용) |

### 3-2. 5계층 규칙 구조

모든 규칙은 단일 `rules` 테이블에서 `rule_type`으로 구분됩니다.

```
┌─────────────────────────────────────────────┐
│  L1  Voice (브랜드 성격)                      │
│      페르소나, 북극성, traits, anti-traits     │
├─────────────────────────────────────────────┤
│  L2  Writing Principles (글쓰기 원칙)         │
│      잡초뽑기, 능동태, 구체적 숫자, 서비스 패턴  │
├─────────────────────────────────────────────┤
│  L3  Grammar & Mechanics (문법)              │
│      종결어미, 날짜/숫자 표기, 이모지 규칙       │
├─────────────────────────────────────────────┤
│  L4  Component Patterns (UI 유형별 패턴)      │
│      버튼, 에러, 빈 상태, 안내문 등 톤+예시     │
├─────────────────────────────────────────────┤
│  L5  Word List (용어집)                       │
│      정식 용어 + aliases (동의어/오표기)         │
└─────────────────────────────────────────────┘
```

**설계 원칙:** 위에서 아래로 갈수록 구체적. L1~L2는 브랜드 전체의 방향, L3~L5는 실행 레벨의 규칙.

### 3-3. 감사 시스템 동작 방식

2레이어 하이브리드 구조 — **규칙 엔진 + AI**를 결합합니다.

```
[사용자 입력: 문구 + UI 유형(선택)]
              │
              ▼
┌──────────────────────────────┐
│  1단계: 규칙 기반 (Deterministic)  │
│  ─────────────────────────── │
│  • L3 Grammar: detect 정규식 매칭  │
│  • L5 용어집: aliases 문자열 매칭  │
│  • 정확도: 100%                   │
│  • 비용: 0원                      │
└──────────────┬───────────────┘
              │
              ▼
┌──────────────────────────────┐
│  2단계: AI 기반 (gpt-4o)          │
│  ─────────────────────────── │
│  • L1 Voice 컨텍스트              │
│  • L2 Principles (잡초뽑기 등)    │
│  • L3 Grammar (종결어미/표기)     │
│  • L4 Component Patterns          │
│  • 1단계 결과 중복 제거            │
│  • 정확도: ~80%                   │
└──────────────┬───────────────┘
              │
              ▼
┌──────────────────────────────┐
│  3단계: 결과 병합                  │
│  ─────────────────────────── │
│  • violations (위반 목록)         │
│  • suggestions (개별 수정 제안)    │
│  • combined_suggestion (통합 수정) │
│  • pass/fail 판정                 │
└──────────────────────────────┘
```

**핵심 기술 결정:**
- **종결어미는 AI 판단** — UI 유형에 따라 해요체/합쇼체가 달라짐 (info→합쇼체, body→해요체)
- **잡초뽑기는 AI 판단** — "현재 5명 대기중" → 유지 vs "현재는 점검중" → 삭제 (맥락 의존)
- **gpt-4o 필수** — gpt-4o-mini는 한국어 맥락 판단 부정확
- **label/placeholder는 감사 건너뜀** (단, L5 용어집 위반은 유지)
- **AI fallback** — OpenAI API 장애 시에도 규칙 기반 레이어는 정상 동작

### 3-4. 운영을 위한 DB 구조

3개의 테이블로 구성됩니다.

```
┌───────────────────────────────────────┐
│  rules                                 │
│  ───────────────────────────────────── │
│  id          (cuid, PK)               │
│  rule_type   (brand_voice | writing_  │
│               principle | grammar |   │
│               ui_pattern | word_list) │
│  name        (규칙 이름)               │
│  description (설명)                    │
│  severity    (error | warning | info) │
│  pattern     (JSON — 구조는 타입별 상이) │
│  created_at                            │
│  updated_at                            │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  audits                                │
│  ───────────────────────────────────── │
│  id                     (cuid, PK)    │
│  input_text             (원문)         │
│  ui_category_detected   (감지된 UI 유형)│
│  violations             (JSON)         │
│  suggestions            (JSON)         │
│  accepted_suggestion    (최종 채택, nullable) │
│  created_at                            │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  exceptions                            │
│  ───────────────────────────────────── │
│  id            (cuid, PK)             │
│  text_pattern  (예외 패턴)             │
│  ui_type       (UI 유형 컨텍스트)       │
│  rule_id       (어떤 규칙을 건너뛸지)    │
│  reason        (사유)                  │
│  created_at                            │
└───────────────────────────────────────┘
```

**pattern 필드의 타입별 JSON 구조:**

| rule_type | pattern 구조 |
|-----------|-------------|
| brand_voice | `{ persona, north_star, traits[], anti_traits[] }` |
| writing_principle | `{ weeds[], good, bad }` |
| grammar | `{ detect (regex), replacements[], exception }` |
| ui_pattern | `{ ui_type, tone, pattern_rule, skip_rules[], good_examples[], bad_examples[] }` |
| word_list | `{ term, definition, aliases[] }` |

**설계 이유:** 5계층 모두 단일 테이블로 관리하여 CRUD API를 통합. `pattern` 필드에 타입별 JSON을 저장하여 유연성 확보.

### 3-5. 웹 앱 구성

3개의 탭으로 구성됩니다.

| 탭 | 역할 | 접근 권한 |
|-----|------|-----------|
| **UX Writing System** | 5계층 규칙 조회 (사이드바 네비게이션) | 전체 공개 |
| **테스트** | 문구 입력 → 감사 → 수정안 확인 | 전체 공개 |
| **관리** | 규칙 CRUD (생성/수정/삭제) | 비밀번호 인증 |

---

## 4. 향후 디벨롭 방향

### 4-1. UX팀 AI-Native화 로드맵에서의 위치

UX Writing System은 **UX팀 업무를 AI-native화하는 단계의 일부**입니다.

```
                         UX팀 AI-Native 전환 로드맵
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Stage 1]  개별 업무의 AI 도구화                    ◀── 현재 단계
           ────────────────────
           • UX Writing System (라이팅 감사)
           • 디자인 리서치 자동화
           • 사용성 테스트 분석

              │
              ▼

[Stage 2]  Figma 워크플로우 통합
           ────────────────────
           • Figma 플러그인으로 실시간 감사
           • 디자인 작업 중 즉시 피드백
           • 팀 전체가 자연스럽게 사용

              │
              ▼

[Stage 3]  AI 에이전트의 Skill로 통합
           ────────────────────
           • UI 디자인 에이전트가 화면을 생성할 때
             UX Writing System을 skill로 호출
           • 에이전트가 문구를 생성하면서
             동시에 가이드라인 준수 여부를 자체 검증
           • 사람의 개입 없이 가이드라인 준수

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4-2. 현재 단계에서의 의미

지금 UX Writing System이 하고 있는 것:

1. **규칙의 구조화** — 사람만 읽을 수 있던 가이드라인을 기계가 실행 가능한 형태로 변환
2. **AI 판단력 검증** — gpt-4o가 한국어 UX 맥락을 얼마나 정확히 판단하는지 실측
3. **규칙 운영 체계 구축** — 규칙 추가/수정/삭제를 웹에서 관리, 변경 즉시 반영

이것이 왜 중요하냐면, Stage 3에서 UI 디자인 에이전트가 이 시스템을 skill로 사용하려면:
- 규칙이 **구조화된 데이터**여야 하고 (문서 X)
- AI가 **실행 가능한 API**로 제공되어야 하고
- 규칙 변경이 **즉시 반영**되어야 합니다

**지금 만들고 있는 것이 바로 그 기반입니다.**

### 4-3. 단기 로드맵 (Phase 1 잔여)

| 항목 | 설명 | 상태 |
|------|------|------|
| 일괄 감사 | 여러 문구를 한번에 감사 (최대 20개) | 미구현 |
| 감사 히스토리 | 이전 감사 결과 조회/필터 | 미구현 |
| 팀 검증 | 2주간 팀 사용 → 채택률/정확도 측정 | 대기 |

### 4-4. 검증 성공 기준

| 항목 | 성공 | 실패 |
|------|------|------|
| 규칙 정확도 | 실제 문구 50개 감사 시 위반 탐지 80%+ | 오탐/미탐 비율 높음 |
| 수정안 품질 | 제안의 70%+ 수용 또는 약간 수정 후 수용 | 맥락 무시, 원래보다 나쁨 |
| 팀 채택 | 2주 내 2명+ 주 3회+ 사용 | 한두 번 쓰고 안 씀 |

---

## Q&A
