import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, description, severity, pattern } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (severity !== undefined) data.severity = severity;
  if (pattern !== undefined) data.pattern = JSON.stringify(pattern);

  const rule = await prisma.rule.update({ where: { id }, data });

  return Response.json({ rule: { ...rule, pattern: JSON.parse(rule.pattern) } });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.rule.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
