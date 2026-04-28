# API + AI 프롬프트 설계

## API 엔드포인트

### 감사

```
POST /api/audit
  body: { text: string, ui_type?: string }
  response: {
    ui_type_detected: string,
    violations: [{ ruleId, ruleType, name, message, severity }],
    suggestions: [{ original, suggested, reason }],
    combined_suggestion: string | null,
    pass: boolean
  }
  errors:
    400 — 빈 텍스트

POST /api/audit/batch (미구현)
  body: { items: [{ text, ui_type? }] }
  response: { results: [위와 동일 구조] }
```

### 규칙 관리

```
GET /api/rules
  response: { rules[] } (pattern은 JSON 파싱된 객체로 리턴)

POST /api/rules
  body: { ruleType, name, description, severity, pattern }

PUT /api/rules/:id
  body: { name?, description?, severity?, pattern? }

DELETE /api/rules/:id
  response: 204
```

### 인증

```
POST /api/auth
  body: { password: string }
  response: 200 (세션 쿠키 발급) | 401

DELETE /api/auth
  response: 200 (로그아웃, 쿠키 삭제)
```

### 히스토리 (미구현)

```
GET /api/audits?limit=20&offset=0
  response: { audits[], total }
```

---

## AI 프롬프트 전략

### 프롬프트 구조

```
System: 당신은 UX writing 감사 에이전트입니다.

[Layer 1: Voice]
페르소나, 북극성, 성격, 안티 성격

[Layer 2: Writing Principles]
각 원칙 + Do/Don't 예시 + 잡초 단어 목록 + 잡초 판단 규칙

[Layer 3: Grammar & Mechanics]
각 규칙 + Do/Don't 예시 (context 포함)
종결어미 규칙: UI 유형 기반 판단 (info→합쇼체, body→해요체)
날짜/숫자 형식 위반 감지

[Layer 4: Component Patterns]
해당 ui_type의 tone + pattern_rule + Do/Don't 예시

[규칙 기반에서 발견된 위반 — 중복 보고 방지]

[사용자 지정 UI 유형 — 있으면 자동 분류 건너뜀]

응답: JSON 형식
{
  "ui_type": "분류된 카테고리",
  "violations": [{ruleId, ruleType, name, message, severity}],
  "suggestions": [{original, suggested, reason}],
  "combined_suggestion": "모든 규칙 반영한 최종 수정 문구 또는 null"
}

User: 감사할 문구: "{입력 텍스트}"
```

### 감사 흐름

1. 규칙 기반 (L5 용어집): aliases 매칭으로 즉시 위반 감지
2. AI 기반 (L1+L2+L3+L4): 위 프롬프트로 gpt-4o 호출
3. 결과 병합: 규칙 위반 + AI 위반 + combined_suggestion
4. label/placeholder 분류 시: AI 위반 비우되 L5 위반은 유지

### AI 모델

- gpt-4o 필수 (gpt-4o-mini는 한국어 맥락 판단 부정확)
- temperature: 0.3
- response_format: json_object

### AI 폴백
AI 서비스 불가 시: L5 용어집 매칭만 동작.
종결어미, 톤, 구조 판단은 안 되지만 용어 통일은 유지.
