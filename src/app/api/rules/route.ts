import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const rules = await prisma.rule.findMany({
    orderBy: [{ ruleType: "asc" }, { createdAt: "asc" }],
  });

  const parsed = rules.map((r) => ({
    ...r,
    pattern: JSON.parse(r.pattern),
  }));

  return Response.json({ rules: parsed });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ruleType, name, description, severity, pattern } = body;

  if (!ruleType || !name) {
    return Response.json({ error: "ruleType과 name은 필수예요." }, { status: 400 });
  }

  const rule = await prisma.rule.create({
    data: {
      ruleType,
      name,
      description: description || "",
      severity: severity || "info",
      pattern: JSON.stringify(pattern || {}),
    },
  });

  return Response.json({ rule: { ...rule, pattern: JSON.parse(rule.pattern) } }, { status: 201 });
}
