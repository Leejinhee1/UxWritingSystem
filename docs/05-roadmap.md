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

- 일괄 감사 (여러 문구 한번에 테스트)
- 감사 히스토리 조회 (이전 감사 기록)
- 팀에 공유 → 2주 검증

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
