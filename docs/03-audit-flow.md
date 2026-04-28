# 감사 흐름 설계

이전 Figma 플러그인 실패 경험을 반영한 재설계.

## 이전 실패 원인
- 모든 텍스트를 동일한 규칙으로 처리
- "로그인 필수" → "로그인 필수이에요" 같은 엉뚱한 수정 발생
- 잘 쓴 문구를 오히려 나쁘게 고침 (false positive)

## 핵심 해결: 텍스트 유형 분류가 감사보다 먼저

```
[Step 1] 텍스트 입력 + UI 유형 선택
  - 웹 앱: 사용자가 UI 유형 드롭다운에서 선택 (info, body, error_message 등)
  - 미선택 시: AI가 자동 분류
  - (향후) Figma: 부모 프레임/레이어 메타데이터로 자동 분류

[Step 2] AI가 UI 유형 판단 (사용자가 미선택 시)
  - 종결어미 있는 문장 → body 또는 다른 문장형 카테고리
  - 짧은 명사형 ("로그인 필수", "NEW") → label
  - "~하기" 형태 → button

[Step 3] L4 조회 → skipOption 적용
  - 유형 = label → skip ALL → 감사 안 함 (단, L5 용어집은 항상 검사)
  - 유형 = button → skip 종결어미, 잡초뽑기 등 → 패턴만 체크
  - 유형 = error_message → skip 없음 → 톤/구조 전부 체크

[Step 4] 규칙 기반 감사 (L5 용어집 — deterministic)
  - 텍스트에서 aliases 매칭: "'visa' 대신 'VISA'를 사용하세요"
  - UI 유형과 무관하게 항상 동작 (label이어도 잡음)

[Step 5] AI 기반 감사 (L1 + L2 + L3 + L4 — probabilistic)
  프롬프트에 포함:
  - L1 Voice: 브랜드 성격 (페르소나, 북극성, traits)
  - L2 Writing Principles: 글쓰기 원칙 + 잡초 단어 목록 + Do/Don't 예시
  - L3 Grammar: 종결어미 (UI 유형 기반 해요체/합쇼체 판단) + 날짜/숫자 형식 Do/Don't
  - L4 Patterns: 해당 ui_type의 tone + pattern_rule + Do/Don't 예시
  - 규칙 기반에서 이미 발견된 L5 위반 정보 (중복 보고 방지)

[Step 6] 결과 병합 + 제시
  - 규칙 기반 위반 (L5) + AI 위반 (L1~L4) 합산
  - combined_suggestion: 모든 위반을 반영한 최종 수정 문구
  - 위반 항목별 [규칙]/[AI] 뱃지로 구분 표시
  - label/placeholder로 분류되면 AI 위반은 비우되 L5 위반은 유지
```

## 2레이어 감사 구조

| 레이어 | 판단 방식 | 대상 | 정확도 |
|--------|-----------|------|--------|
| 규칙 기반 (L5) | aliases 매칭 (deterministic) | 용어집 틀린 표현 | ~100% |
| AI 기반 (L1+L2+L3+L4) | LLM 판단 (probabilistic) | 종결어미, 잡초뽑기, 날짜/숫자 형식, 톤, 구조, 카테고리 분류 | ~80% |

용어집은 규칙으로 확실하게. 나머지는 맥락 판단이 필요하니 AI로.

## 종결어미 판단 기준

종결어미는 단순 문법이 아니라 UI 유형 + 문장 맥락에 따라 달라진다.

- 평서형(~다 체): 항상 위반
- info(안내/공지), 공식 알림: 합쇼체(~ㅂ니다) 유지. "안내드립니다", "알려드립니다"
- body, error_message, success_message, empty_state: 해요체(~요)로 전환
- button: ~하기/~받기 형태
- label, placeholder: 종결어미 검사 안 함

## AI 폴백
AI 서비스 불가 시: 규칙 기반 레이어(L5 용어집)만 동작.
종결어미, 톤, 구조 판단은 안 되지만 용어 통일은 유지.

## 미구현 (향후)

- 적용/무시 버튼 → 예외 기록
- 학습 루프 (무시 → exceptions, 적용 → examples 축적)
- 거부율 높은 규칙 자동 플래그
- Figma 메타데이터 기반 자동 분류
