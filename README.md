# UX Writing System

AI 라이팅 감사 에이전트. UI 문구의 톤앤매너를 자동 검사하고 수정안을 제안하는 내부 도구.

## 구조

- **레퍼런스**: 5계층 라이팅 규칙 조회 (L1 Voice ~ L5 Word List)
- **테스트**: 문구 입력 → AI 감사 → 수정안 제안
- **관리**: 규칙 데이터 CRUD (비밀번호 보호)

## 기술 스택

- Next.js (App Router) + Tailwind CSS
- Prisma ORM + SQLite (배포 시 PostgreSQL 전환)
- OpenAI gpt-4o

## 시작하기

```bash
npm install
npx prisma generate
npm run db:seed    # 시드 데이터 투입
npm run dev        # http://localhost:3000
```

## 환경변수 (.env)

```
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="your-password"
OPENAI_API_KEY="sk-..."
```

## 설계 문서

`docs/` 폴더 참고.
