import { prisma } from "@/lib/db";
import { prepareRules, auditText } from "@/lib/audit";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, ui_type } = body;

  if (!text?.trim()) {
    return Response.json({ error: "텍스트를 입력해주세요." }, { status: 400 });
  }

  const rules = await prisma.rule.findMany();
  const prepared = prepareRules(rules);
  const result = await auditText(text, ui_type || null, prepared);

  // Save audit record
  const audit = await prisma.audit.create({
    data: {
      inputText: text,
      uiCategoryDetected: result.ui_type_detected,
      violations: JSON.stringify(result.violations),
      suggestions: JSON.stringify(result.suggestions),
    },
  });

  return Response.json({
    audit_id: audit.id,
    ...result,
  });
}
