import { prisma } from "@/lib/db";
import { prepareRules, auditText, AuditResult } from "@/lib/audit";
import { NextRequest } from "next/server";

const MAX_ITEMS = 30;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { items } = body as { items: Array<{ text: string; ui_type?: string }> };

  if (!items?.length) {
    return Response.json({ error: "검사할 문구가 없습니다." }, { status: 400 });
  }

  if (items.length > MAX_ITEMS) {
    return Response.json({ error: `최대 ${MAX_ITEMS}개까지 검사할 수 있습니다.` }, { status: 400 });
  }

  // 규칙 1회 로딩
  const rules = await prisma.rule.findMany();
  const prepared = prepareRules(rules);

  // 문구별 병렬 감사
  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const text = item.text.trim();
      if (!text) return null;
      return auditText(text, item.ui_type || null, prepared);
    })
  );

  // 결과 수집 + DB 저장
  const results: (AuditResult | null)[] = [];

  for (let i = 0; i < settled.length; i++) {
    const s = settled[i];
    if (s.status === "fulfilled" && s.value) {
      const result = s.value;
      const audit = await prisma.audit.create({
        data: {
          inputText: result.text,
          uiCategoryDetected: result.ui_type_detected,
          violations: JSON.stringify(result.violations),
          suggestions: JSON.stringify(result.suggestions),
        },
      });
      results.push({ audit_id: audit.id, ...result });
    } else {
      // 빈 줄이거나 실패한 항목
      results.push(null);
    }
  }

  // 요약 통계
  const validResults = results.filter((r): r is AuditResult => r !== null);
  const passCount = validResults.filter((r) => r.pass).length;
  const failCount = validResults.filter((r) => !r.pass).length;

  // 레이어별 위반 집계
  const violationsByLayer: Record<string, number> = {};
  for (const r of validResults) {
    for (const v of r.violations) {
      const layer = v.name.match(/^L\d/)?.[0] || v.ruleType;
      violationsByLayer[layer] = (violationsByLayer[layer] || 0) + 1;
    }
  }

  return Response.json({
    results,
    summary: {
      total: validResults.length,
      pass: passCount,
      fail: failCount,
      passRate: validResults.length > 0
        ? Math.round((passCount / validResults.length) * 100)
        : 0,
      violationsByLayer,
    },
  });
}
