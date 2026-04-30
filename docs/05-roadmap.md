# 로드맵 + 열린 질문

## 로드맵

| 단계 | 범위 | 상태 |
|------|------|------|
| 1-A | 웹 앱 MVP: 문구 감사 + 수정안 | ✅ 완료 (일괄 감사 미구현) |
| 1-B | 규칙 관리 대시보드 (CRUD) | ✅ 완료 |
| 1-C | 감사 히스토리 조회 | 미착수 |
| 검증 | 팀 2주 사용 + 성공 기준 확인 | — |
| 2 | Figma 플러그인 (검증 후 별도 설계) | — |
| 3 | Claude Code skill로 변환 (CLI에서 감사 실행) | — |

## 완료된 항목

- 프로젝트 초기화 (Next.js + Prisma + SQLite)
- 5계층 규칙 데이터 구조 설계 + DB 시드
- 문구 감사 API (규칙 기반 L5 + AI 기반 L1~L4, OpenAI gpt-4o)
- 웹 UI 3탭 구조: 레퍼런스(규칙 조회) / 테스트(감사) / 관리(CRUD)
- 관리 비밀번호 보호 (세션 쿠키)
- 종결어미 판단을 AI 기반으로 전환 (UI 유형에 따라 해요체/합쇼체)
- 테스트 시 UI 유형 선택 드롭다운 추가
- 관리 UI 비개발자 친화 개선 (한글 라벨, 힌트, severity 한글화)
- L3 exception을 L4 UI 유형 목록에서 선택하도록 변경
- L4 skip_rules를 L2/L3 규칙 목록에서 선택하도록 변경
- L2/L3/L4 Do/Don't를 쌍별 비교 구조로 통일
- L4 관리 아코디언 UI 적용
- text_type 필드 제거 (불필요)

## 남은 작업 (MVP)

- 감사 히스토리 조회 (이전 감사 기록) — 생략 (우선순위 낮음)
- 팀에 공유 → 2주 검증

## 일괄 감사 (구현 계획)

피그마 플러그인 연동 대비. 한 페이지의 여러 문구를 한번에 검사.

### 핵심 설계

- 입력: `{text, ui_type?}[]` 배열. ui_type 미지정 시 AI 자동 분류.
- 처리: 규칙 로딩 1회 + 문구별 AI 호출 N회 (병렬)
- 출력: 문구별 감사 결과 + 전체 요약 (통과율, 주요 위반 유형)

### 작업 범위

| # | 작업 | 설명 |
|---|------|------|
| 1 | `/api/audit/bulk` 엔드포인트 | 규칙 로딩 1회, 프롬프트 빌드 1회, AI 호출 N회 병렬. 응답: 문구별 결과 배열 + 요약 |
| 2 | 일괄 테스트 UI (`/test/bulk`) | 여러 줄 입력 (줄바꿈 구분) + 일괄 테스트 버튼 + 진행률 |
| 3 | 결과 카드 UI | 문구별: 통과/위반 뱃지 + AI 판단 UI 유형 + combined_suggestion |
| 4 | 개별 재검사 | 결과에서 UI 유형 변경 → 해당 문구만 재감사 |
| 5 | 전체 요약 | 통과율, 레이어별 위반 건수, 가장 많이 위반된 규칙 |

### 동작 흐름

```
[사용자] 여러 줄 입력 + (선택) UI 유형 지정
    ↓
[프론트] POST /api/audit/bulk { items: [{text, ui_type?}, ...] }
    ↓
[서버] 규칙 전체 로딩 (1회)
    ↓
[서버] 문구별 병렬 처리:
    ├─ L5 용어집 매칭 (규칙 기반)
    └─ AI 호출 (L1+L2+L3+L4, ui_type 자동 분류 포함)
    ↓
[서버] 문구별 결과 + 전체 요약 응답
    ↓
[프론트] 결과 카드 목록 + 요약 표시
    ↓
[사용자] UI 유형 틀린 문구 → 유형 변경 → 개별 재검사
```

### 피그마 연동 시 재사용

피그마 플러그인(2단계)에서 동일한 `/api/audit/bulk` 호출.
차이점: 피그마는 레이어 메타데이터로 ui_type을 자동 추출해서 보내줌.
웹에서는 사용자가 수동 입력하거나 AI 자동 분류.

## 1단계에서 제외 (검증 후 추가)

- 팀/프로젝트별 커스텀 규칙 세트
- 팀 통계 대시보드 (주간/월간 통계)
- 사용자 인증 (현재 비밀번호만)
- 실시간 Figma 감사 (텍스트 변경 감지)

## 열린 질문

1. **AI 호출 비용 관리** — 일일 한도? 팀 예산? 캐싱 전략?
2. **규칙 변경 시 기존 감사 결과** — 재감사 필요한가?
3. **프로젝트별 규칙 세트 분리** — 단일 vs 멀티 프로젝트?
4. **Figma 플러그인 접근** — Figma Plugin API vs Figma REST API + MCP?

## 참고 자료

- [Shopify Polaris Content Guidelines](https://polaris.shopify.com/content/product-content)
- [Atlassian Voice and Tone](https://atlassian.design/content/voice-and-tone-principles/)
- [Mailchimp Content Style Guide](https://styleguide.mailchimp.com/)
- [UX Writing Hub — Content Design Systems](https://uxwritinghub.com/content-design-systems/)
- [UX Writing Hub — Agentic Content Design](https://uxwritinghub.com/agentic-content-design-guidelines/)
- [IBM Carbon Content](https://carbondesignsystem.com/guidelines/content/overview/)
- [토스의 8가지 라이팅 원칙](https://toss.tech/article/8-writing-principles-of-toss)
