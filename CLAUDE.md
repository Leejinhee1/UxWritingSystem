# UX Writing System

AI 라이팅 감사 에이전트. UI 문구의 톤앤매너를 자동 검사하고 수정 제안.

## 기술 스택
- Next.js (App Router) + Tailwind CSS
- Prisma ORM + SQLite (Vercel 배포 시 PostgreSQL로 전환, 설정만 변경)
- OpenAI gpt-4o (감사 AI)
- 비밀번호 인증 (ADMIN_PASSWORD 환경변수)

## 프로젝트 구조
```
src/
├── app/
│   ├── (reference)/          # 탭 1: UX Writing System (규칙 조회, 사이드바)
│   │   ├── page.tsx          # 개요 (5계층 + 검토 프로세스)
│   │   ├── voice/            # L1 Voice
│   │   ├── principles/       # L2 Writing Principles
│   │   ├── grammar/          # L3 Grammar & Mechanics
│   │   ├── patterns/         # L4 Component Patterns
│   │   └── wordlist/         # L5 Word List
│   ├── test/                 # 탭 2: 테스트 (사이드바: 문구 테스트 / 일괄 감사)
│   │   ├── page.tsx          # 단건 문구 테스트
│   │   ├── bulk/page.tsx     # 일괄 감사 (여러 문구 한번에)
│   │   └── layout.tsx        # TestSidebar 레이아웃
│   ├── admin/                # 탭 3: 관리 (비밀번호 보호, CRUD)
│   │   ├── voice/
│   │   ├── principles/
│   │   ├── grammar/
│   │   ├── patterns/
│   │   └── wordlist/
│   └── api/
│       ├── rules/            # GET/POST + [id] PUT/DELETE
│       ├── audit/            # POST (단건 감사) + bulk/ (일괄 감사)
│       └── auth/             # POST (비밀번호) / DELETE (로그아웃)
├── components/
│   ├── Nav.tsx               # 상단 3탭 네비게이션
│   ├── Sidebar.tsx           # 레퍼런스 사이드바 (L1~L5)
│   ├── AdminSidebar.tsx      # 관리 사이드바
│   └── LayerOverview.tsx     # 개요 페이지 접기/펼치기
├── lib/
│   ├── db.ts                 # Prisma 클라이언트
│   ├── openai.ts             # OpenAI 클라이언트
│   └── audit.ts              # 감사 공통 로직 (prepareRules, auditText)
└── generated/prisma/         # Prisma 생성 코드

prisma/
├── schema.prisma             # DB 스키마 (Rule, Audit, Exception)
├── seed.ts                   # 시드 데이터 (5계층 초기 규칙)
└── dev.db                    # SQLite DB 파일

docs/                         # 설계 문서
├── 01-project-overview.md
├── 02-data-architecture.md   # 5계층 데이터 구조
├── 03-audit-flow.md          # 감사 흐름
├── 04-api-design.md          # API + AI 프롬프트
├── 05-roadmap.md
└── 06-web-ui.md              # 웹 UI 화면 설계
```

## 5계층 규칙 구조
모든 규칙은 하나의 rules 테이블에서 rule_type으로 구분.

| Layer | rule_type | 역할 |
|-------|-----------|------|
| L1 | brand_voice | 브랜드 성격 (페르소나, 북극성, traits) |
| L2 | writing_principle | 글쓰기 원칙 (잡초뽑기 weeds, good/bad) |
| L3 | grammar | 문법 규칙 (종결어미는 AI 판단, 날짜/숫자 examples) |
| L4 | ui_pattern | UI 요소별 패턴 + 톤 (skip_rules, good/bad_examples) |
| L5 | word_list | 용어집 (term + aliases) |

## 감사 흐름
1. 규칙 기반 (deterministic): L5 용어집 aliases 매칭
2. AI 기반 (gpt-4o): L1 Voice + L2 Principles + L3 Grammar (종결어미+날짜+숫자) + L4 Patterns
3. 결과 병합: 규칙 위반 + AI 위반 + combined_suggestion
4. 테스트 시 UI 유형 선택 가능 (info, body, error_message 등)

핵심 결정사항:
- 종결어미�� AI 기반 (UI 유형에 따라 해요체/합쇼체 판단. info→합쇼체, body→해요체)
- 잡초뽑기는 AI 기반 (맥락 ��단 필요. "현재 5명 대기중" → 유지, "현재는 점검중" → 삭제)
- gpt-4o-mini는 한국어 맥락 판단 부정확, gpt-4o 필수
- 원문에 없는 문장 추가 금지. 빠진 요소(공감/해결책)는 채워도 됨
- label/placeholder는 감사 건너뜀 (단, L5 용어집 위반은 유지)

## 명령어
```bash
npm run dev          # 개발 서버
npm run db:seed      # 시드 데이터 투입
npm run db:reset     # DB 초기화 + 시드
```

## 환경변수 (.env)
```
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="admin1234"
OPENAI_API_KEY="sk-..."
```

## UI 스타일 규칙
- 리스트 아이템은 border-b 구분선 (border 박스 카드 지양)
- Do/Don't 예시는 2컬럼 나란히 비교
- 사이드바에 Layer 번호 라벨 (L1, L2...)

## 미구현
- Figma 플러그인 (2단계)
- Claude Code skill 변환 (3단계)
