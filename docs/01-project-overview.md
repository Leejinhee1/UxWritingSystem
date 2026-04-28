# UX Writing System - 프로젝트 개요

## 프로젝트명
UX Writing System (AI 라이팅 감사 에이전트)

## 한 줄 요약
앱의 UI 문구를 라이팅 가이드라인에 따라 AI가 자동 감사하고 수정안을 제안하는 내부 도구.

## 배경
- 기획/디자인/퍼블 조직이 나뉜 팀에서 톤앤매너 불일치가 반복 발생
- farm-mvp에서 UX writing 가이드라인(5원칙, 10카테고리, 금지 표현)을 만들어 성공적으로 적용한 경험
- 문서로 된 가이드라인은 아무도 안 읽는다 → "그냥 써, 내가 봐줄게" 시스템이 필요

## 핵심 가치
"규칙을 외워라"가 아니라 "그냥 써, 내가 봐줄게"

## 대상 사용자
- 기획자: 화면 문구를 기획하는 과정에서 사용
- 디자이너: Figma에서 문구를 넣을 때 사용
- 퍼블리셔: 최종 구현 전 문구 검증

## 단계적 접근
| 단계 | 형태 | 목적 |
|------|------|------|
| 1단계 | 웹 앱 | 규칙 체계 + AI 감사 검증 |
| 2단계 | Figma 플러그인 | 실시간 워크플로우 통합 (검증 후) |

## 기술 스택
- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: Next.js API Routes
- DB: SQLite (Prisma ORM) — 자체 DB, 외부 서비스 의존 없음
- AI: OpenAI gpt-4o
- 배포: Vercel (또는 자체 서버)

## 검증 성공 기준
| 항목 | 성공 기준 | 실패 시그널 |
|------|-----------|-------------|
| 규칙 정확도 | 실제 문구 50개 감사 시 위반 탐지 80%+ | 오탐/미탐 비율 높음 |
| 수정안 품질 | 제안의 70%+ 수용/약간 수정 후 수용 | 맥락 무시, 원래보다 나쁨 |
| 팀 채택 | 2주 내 2명+ 주 3회+ 사용 | 한두 번 쓰고 안 씀 |

## 관련 문서
- [02-data-architecture.md](./02-data-architecture.md) — 5계층 데이터 구조 + DB 스키마
- [03-audit-flow.md](./03-audit-flow.md) — 감사 흐름 설계
- [04-api-design.md](./04-api-design.md) — API + AI 프롬프트 설계
- [05-roadmap.md](./05-roadmap.md) — 로드맵 + 열린 질문
- [06-web-ui.md](./06-web-ui.md) — 웹 UI 화면 설계 (페이지 구조, 와이어프레임)

## 이력
| 날짜 | 내용 |
|------|------|
| 2026-04-20 | farm-mvp에 UX writing 가이드라인 최초 생성 (DESIGN.md) |
| 2026-04-20 | 기존 랜딩페이지 감사 → 10개 위반 수정 |
| 2026-04-21 | 별도 프로젝트로 분리 결정. /office-hours로 설계 |
| 2026-04-21 | 데이터 구조 설계 시작 (초기 7계층, 이후 5계층으로 축소) |
| 2026-04-21 | DB: Supabase → SQLite + Prisma로 변경. Vercel 배포 시 PostgreSQL 전환 (설정만 변경, 10-15분) |
| 2026-04-22 | Word List(용어집)를 rules 테이블에 통합 (rule_type="word_list"). 7계층 전체가 단일 테이블에서 CRUD 관리 |
| 2026-04-22 | 웹 UI 화면 설계 추가 (06-web-ui.md). 5개 페이지: 감사, 일괄 감사, 규칙 관리, 용어집, 히스토리 |
| 2026-04-22 | 웹 UI 재설계: 3개 탭(UX Writing System + 테스트 + 관리). Carbon/Atlassian 스타일 사이드바, 관리는 비밀번호 보호. Figma 시안 프로세스 제거 (코드로 바로 구현) |
| 2026-04-22 | Tone Scale을 Component Patterns에 통합, AI Harness 제거. 7계층 → 5계층. 숫자 스케일 → 예시 기반. 이모지 사용 지양 |
| 2026-04-22 | Next.js 프로젝트 초기화 (/Users/openclaw/ux-writing-app). Prisma(SQLite) + 시드 데이터 완료 |
| 2026-04-22 | OpenAI gpt-4o 연동. 규칙 기반(L3+L5) + AI 기반(L1+L2+L4) 2레이어 감사 구현 |
| 2026-04-22 | 잡초뽑기를 AI 기반으로 전환. gpt-4o-mini는 맥락 판단 부정확, gpt-4o 필수 |
| 2026-04-22 | 종결어미 replacements를 DB로 관리. 코드 하드코딩 제거 |
| 2026-04-23 | 관리 탭 구현: Voice/Principles/Grammar/Patterns/WordList 편집. 비밀번호 인증 |
| 2026-04-23 | 관리 페이지 개선: 필드 토글(weeds/good_bad/detect 초기화), severity/exception/skip_rules/note 편집 |
| 2026-04-25 | Do/Don't 2컬럼 비교 레이아웃. Grammar에 날짜/숫자 예시 추가. AI 프롬프트에 Grammar examples 포함 |
| 2026-04-26 | 종결어미를 규칙 기반(regex)에서 AI 기반으로 전환. UI 유형에 따라 해요체/합쇼체 판단 |
| 2026-04-26 | 테스트 페이지에 UI 유형 선택 드롭다운 추가 (info, body, error_message 등) |
| 2026-04-26 | label/placeholder skip 시에도 L5 용어집 위반 유지 |
| 2026-04-28 | 관리 UI 비개발자 친화 개선: severity 한글화, 기술 용어 → 한글 라벨, 힌트 텍스트 추가 |
| 2026-04-28 | L2 Do/Don't를 examples 배열로 통일 (여러 쌍 추가 가능) |
| 2026-04-28 | L3 종결어미에 context(맥락) 필드 추가, exception을 UI 유형 배열로 변경 |
| 2026-04-28 | L4 good/bad_examples를 examples 배열로 통일, text_type 필드 제거 |
| 2026-04-28 | L4 skip_rules를 L2/L3 규칙 목록에서 선택하도록 변경 (하드코딩 id 제거) |
| 2026-04-28 | L4 관리 아코디언 UI 적용, L3 detect(패턴 매칭) 코드/UI 제거 |
