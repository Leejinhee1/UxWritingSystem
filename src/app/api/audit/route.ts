import { prisma } from "@/lib/db";
import { openai } from "@/lib/openai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, ui_type } = body;

  if (!text?.trim()) {
    return Response.json({ error: "텍스트를 입력해주세요." }, { status: 400 });
  }

  // Load all rules
  const rules = await prisma.rule.findMany();
  const voiceRules = rules.filter((r) => r.ruleType === "brand_voice");
  const principleRules = rules.filter((r) => r.ruleType === "writing_principle");
  const grammarRules = rules.filter((r) => r.ruleType === "grammar");
  const patternRules = rules.filter((r) => r.ruleType === "ui_pattern");
  const wordListRules = rules.filter((r) => r.ruleType === "word_list");

  // === Rule-based checks (deterministic) ===

  const ruleViolations: Array<{
    ruleId: string;
    ruleType: string;
    name: string;
    message: string;
    severity: string;
  }> = [];

  // Layer 5: Word List — aliases 매칭
  for (const rule of wordListRules) {
    const pattern = JSON.parse(rule.pattern);
    if (pattern.aliases) {
      for (const alias of pattern.aliases) {
        if (text.includes(alias)) {
          ruleViolations.push({
            ruleId: rule.id,
            ruleType: rule.ruleType,
            name: `L5 용어: ${pattern.term}`,
            message: `"${alias}" 대신 "${pattern.term}"을 사용하세요.`,
            severity: rule.severity,
          });
        }
      }
    }
  }

  // === AI-based check (L1 Voice + L2 Principles + L4 Patterns) ===

  // Build prompt context
  const voice = voiceRules[0] ? JSON.parse(voiceRules[0].pattern) : null;
  const principles = principleRules.map((r) => ({
    name: r.name,
    description: r.description,
    pattern: JSON.parse(r.pattern),
  }));
  const patterns = patternRules.map((r) => ({
    name: r.name,
    pattern: JSON.parse(r.pattern),
  }));
  const grammars = grammarRules.map((r) => ({
    name: r.name,
    description: r.description,
    pattern: JSON.parse(r.pattern),
  }));

  // skip_rules id → 이름 변환용 맵
  const ruleNameMap: Record<string, string> = {};
  for (const r of rules) {
    ruleNameMap[r.id] = r.name;
  }

  const systemPrompt = buildSystemPrompt(voice, principles, grammars, patterns, ruleViolations, ui_type || null, ruleNameMap);

  let aiResult: AIAuditResult | null = null;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `감사할 문구: "${text}"` },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      aiResult = JSON.parse(content);
    }
  } catch (e) {
    console.error("AI audit failed:", e);
    // AI 실패 시 규칙 기반 결과만 리턴
  }

  // === Merge results ===
  // skip_rules는 AI 프롬프트에서 처리. 규칙 기반(L5)은 항상 유지.

  // Build rule-based suggestions to match violations 1:1
  const ruleSuggestions: Array<{ original: string; suggested: string; reason: string }> = [];
  for (const v of ruleViolations) {
    if (v.ruleType === "grammar") {
      const rule = grammarRules.find((r) => r.id === v.ruleId);
      const pattern = rule ? JSON.parse(rule.pattern) : null;
      if (pattern?.replacements) {
        let suggested = text.trim();
        for (const rep of pattern.replacements) {
          suggested = suggested.replace(new RegExp(rep.from + "\\.?$", "g"), rep.to + ".");
        }
        ruleSuggestions.push({
          original: text.trim(),
          suggested: suggested.trim(),
          reason: rule?.description || "",
        });
      } else {
        ruleSuggestions.push({ original: "", suggested: "", reason: v.message });
      }
    } else if (v.ruleType === "word_list") {
      const alias = v.message.match(/"([^"]+)" 대신/)?.[1] || "";
      const term = v.message.match(/대신 "([^"]+)"/)?.[1] || "";
      ruleSuggestions.push({
        original: alias,
        suggested: term,
        reason: `공식 용어 "${term}" 사용`,
      });
    } else {
      ruleSuggestions.push({ original: "", suggested: "", reason: v.message });
    }
  }

  const violations = [
    ...ruleViolations,
    ...(aiResult?.violations || []),
  ];

  const allSuggestions = [
    ...ruleSuggestions,
    ...(aiResult?.suggestions || []),
  ];

  const pass = violations.length === 0;

  // Save audit record
  const audit = await prisma.audit.create({
    data: {
      inputText: text,
      uiCategoryDetected: aiResult?.ui_type || "auto",
      violations: JSON.stringify(violations),
      suggestions: JSON.stringify(aiResult?.suggestions || []),
    },
  });

  return Response.json({
    audit_id: audit.id,
    ui_type_detected: aiResult?.ui_type || "auto",
    violations,
    suggestions: allSuggestions,
    combined_suggestion: buildCombinedSuggestion(text, aiResult?.combined_suggestion || null, ruleViolations, grammarRules, pass),
    pass,
  });
}

interface AIAuditResult {
  ui_type: string;
  violations: Array<{
    ruleId: string;
    ruleType: string;
    name: string;
    message: string;
    severity: string;
  }>;
  suggestions: Array<{
    original: string;
    suggested: string;
    reason: string;
  }>;
  combined_suggestion: string | null;
}

function buildSystemPrompt(
  voice: Record<string, unknown> | null,
  principles: Array<{ name: string; description: string; pattern: Record<string, unknown> }>,
  grammars: Array<{ name: string; description: string; pattern: Record<string, unknown> }>,
  patterns: Array<{ name: string; pattern: Record<string, unknown> }>,
  ruleViolations: Array<{ name: string; message: string }>,
  userUiType: string | null,
  ruleNameMap: Record<string, string>,
) {
  return `당신은 UX writing 감사 에이전트입니다.
사용자가 입력한 UI 문구를 아래 라이팅 규칙에 따라 감사하고, 모든 규칙을 반영한 하나의 개선된 문구를 제안하세요.

${voice ? `## Layer 1: Voice (브랜드 성격)
페르소나: ${voice.persona}
북극성: "${voice.north_star}"
성격: ${(voice.traits as string[])?.join(", ")}
안티 성격: ${(voice.anti_traits as string[])?.join(", ")}` : ""}

## Layer 2: Writing Principles (글쓰기 원칙)
${principles.map((p) => {
  const pat = p.pattern;
  let detail = `- ${p.name}: ${p.description}`;
  if (pat.weeds) detail += `\n  잡초 단어 목록: ${(pat.weeds as string[]).join(", ")}`;
  if (pat.examples) {
    for (const ex of (pat.examples as Array<{ do: string; dont: string }>)) {
      detail += `\n  Do: "${ex.do}" / Don't: "${ex.dont}"`;
    }
  }
  if (pat.weeds) detail += `\n\n  [잡초 판단 핵심 규칙]\n  판단 방법: 해당 단어를 삭제한 문장과 원문을 비교. 의미가 달라지면 잡초가 아님.\n\n  잡초 O (삭제해야 함):\n  - "현재는 서비스 점검 중입니다" → "서비스 점검 중입니다" (의미 동일)\n  - "혹시 궁금한 점이 있으시면" → "궁금한 점이 있으시면" (의미 동일)\n  - "물론 가능합니다" → "가능합니다" (의미 동일)\n\n  잡초 X (삭제하면 안 됨):\n  - "현재 대기중인 인원이 5명" → "대기중인 인원이 5명" (시점 정보 소실. "항상 5명"과 "지금 5명"이 구분 안 됨)\n  - "현재 3명이 대기 중" → 삭제하면 실시간 정보임을 알 수 없음\n  - "현재 버전은 2.0입니다" → 삭제하면 어떤 시점의 버전인지 불명확\n\n  의심스러우면 유지하세요. 잘못 삭제하는 것이 잘못 유지하는 것보다 나쁩니다.`;
  return detail;
}).join("\n")}

## Layer 3: Grammar & Mechanics (문법/형식 규칙)
${grammars.map((g) => {
  const pat = g.pattern;
  let detail = `- ${g.name}: ${g.description}`;
  if (pat.examples) {
    detail += `\n  Do / Don't 예시:`;
    for (const ex of (pat.examples as Array<{ do: string; dont: string }>)) {
      detail += `\n    Do: "${ex.do}" / Don't: "${ex.dont}"`;
    }
  }
  return detail;
}).join("\n")}

규칙 기반 엔진이 용어집을 체크합니다. AI는 다음을 추가로 찾아주세요:

[종결어미 규칙 — UI 유형 기반 판단]
- 평서형(~다 체): 항상 위반. 어떤 UI 유형이든 "~다"로 끝나면 안 됨.
- UI 유형별 올바른 종결어미:
  - info(안내/공지) → 합쇼체(~ㅂ니다). 예: "완료되었다"→"완료되었습니다", "우대입니다"→유지
  - body(본문/콘텐츠), error_message, success_message, empty_state → 해요체(~요). "~ㅂ니다" 체도 해요체로 바꿔야 함. 예: "완료되었다"→"완료됐어요", "우대입니다"→"우대에요", "필요합니다"→"필요해요"
  - button → "~하기", "~받기" 형태.
  - label, placeholder → 종결어미 검사 안 함.
- 판단 순서: (1) 현재 종결어미가 ~다 체인가? → 위반 (2) UI 유형에 맞는 종결어미인가? → 아니면 위반
- 예시:
  "결제가 완료되었다" + info → "결제가 완료되었습니다" (합쇼체로)
  "결제가 완료되었다" + body → "결제가 완료됐어요" (해요체로)
  "환율 100% 우대입니다" + info → 통과 (이미 합쇼체)
  "환율 100% 우대입니다" + body → "환율 100% 우대에요" (해요체로 전환)
  "로그인이 필요합니다" + body → "로그인이 필요해요" (해요체로 전환)
  "로그인이 필요합니다" + info → 통과 (이미 합쇼체)

날짜가 "3/4", "4.25", "2026.04.25" 같은 형식이면 위반입니다. Do 예시의 형식으로 수정하세요.

## Layer 4: Component Patterns (UI 요소별 패턴)
${patterns.map((p) => {
  const pat = p.pattern;
  let detail = `- ${pat.ui_type} (${p.name})`;
  if (pat.tone) detail += `\n  톤: ${pat.tone}`;
  if (pat.pattern_rule) detail += `\n  패턴: ${pat.pattern_rule}`;
  if ((pat.skip_rules as string[])?.length) {
    const skipNames = (pat.skip_rules as string[]).map(id => id === "ALL" ? "ALL" : ruleNameMap[id] || id);
    detail += `\n  이 유형에서 건너뛸 규칙: ${skipNames.join(", ")}`;
  }
  if ((pat.examples as Array<{ do: string; dont: string }>)?.length) {
    for (const ex of (pat.examples as Array<{ do: string; dont: string }>)) {
      detail += `\n  Do: "${ex.do}" / Don't: "${ex.dont}"`;
    }
  }
  return detail;
}).join("\n\n")}

${ruleViolations.length > 0 ? `## 규칙 기반 검사에서 이미 발견된 위반
${ruleViolations.map((v) => `- ${v.name}: ${v.message}`).join("\n")}
이 위반들은 이미 보고되었으니, AI 감사에서는 중복으로 보고하지 마세요.
단, combined_suggestion에는 반드시 이 위반들의 수정을 포함해야 합니다.` : ""}

${userUiType ? `## 사용자 지정 UI 유형: ${userUiType}
사용자가 이 문구의 UI 유형을 "${userUiType}"로 지정했습니다. 이 유형을 그대로 사용하세요. 자동 분류하지 마세요.` : ""}

## 응답 규칙
1. ${userUiType ? `사용자가 지정한 UI 유형 "${userUiType}"을 ui_type으로 사용하세요.` : "먼저 문구의 UI 카테고리를 분류하세요 (button, label, heading, error_message, success_message, empty_state, placeholder, body, info 중 택1)."}
   분류 기준:
   - label: "로그인 필수", "NEW", "필수" 같은 짧은 명사형. 종결어미 없음.
   - body: 종결어미가 있는 일반 문장. "~이에요", "~있습니다" 등으로 끝남.
   - button: "~하기", "~받기" 로 끝나는 행동 유도.
   - 문장이 길고 종결어미가 있으면 label이 아니라 body 또는 다른 문장형 카테고리.
2. label, placeholder로 분류되더라도 L3 Grammar 규칙(숫자 표기, 날짜 형식, 환율 정보 등)은 검사하세요. 단, skip_rules에 포함된 규칙은 건너뛰세요.
3. 적용한 모든 규칙을 violations에 넣으세요. 여기에는:
   - Writing Principles 위반 (잡초뽑기 등. 맥락상 의미가 있으면 위반이 아닙니다)
   - Component Patterns 톤 적용 (예: error_message의 "공감 + 해결책" 톤을 적용했다면 그것도 violation으로 기록)
   각 violation의 ruleType에 "writing_principle" 또는 "ui_pattern"을 넣으세요.
   name에는 적용한 Layer와 규칙명을 함께 쓰세요 (예: "L2 잡초 뽑기", "L4 error_message 톤 적용").
4. suggestions에는 각 violation에 대응하는 수정 내용을 넣으세요. violations와 같은 순서, 같은 개수.
5. combined_suggestion에는 규칙 기반 위반 + AI 위반을 모두 반영한 최종 수정 문구를 넣으세요.
6. [수정 범위 규칙]
   - 원문에 이미 있는 요소를 중복 추가하지 마세요.
     금지: "내일 다시 시도해 주세요" → "잠시 문제가 생겼어요. 내일 다시 시도해 주세요." (해결책이 이미 있는데 공감을 추가)
   - 원문에 빠진 요소는 채워줘도 됩니다. combined_suggestion에 포함하세요.
     허용: "오류가 발생했습니다" → "잠시 문제가 생겼어요. 다시 시도해 주세요." (공감+해결책 둘 다 빠져있으므로 추가)
   - 판단 기준:
     공감 = 상황을 알려주는 표현 ("잠시 문제가 생겼어요", "점검 중이에요" 등)
     해결책 = 사용자가 다음에 뭘 하면 되는지 ("다시 시도해 주세요", "내일 시도해 주세요" 등)
     "내일 다시 시도해 주세요"는 해결책이 있는 문장입니다.
7. 위반이 없으면 violations를 빈 배열로, combined_suggestion을 null로 리턴하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "ui_type": "분류된 카테고리",
  "violations": [{"ruleId": "ai", "ruleType": "writing_principle 또는 ui_pattern", "name": "L2 잡초 뽑기", "message": "설명", "severity": "warning"}],
  "suggestions": [{"original": "원문 중 해당 부분", "suggested": "수정안", "reason": "이유"}],
  "combined_suggestion": "모든 규칙을 반영한 최종 수정 문구 또는 null"
}`;
}

function buildCombinedSuggestion(
  originalText: string,
  aiCombined: string | null,
  ruleViolations: Array<{ name: string; ruleType: string; ruleId: string }>,
  _grammarRules: Array<{ id: string; pattern: string }>,
  pass: boolean,
): string | null {
  if (pass) return null;

  const result = (aiCombined || originalText).trim();

  return result !== originalText.trim() ? result : null;
}
