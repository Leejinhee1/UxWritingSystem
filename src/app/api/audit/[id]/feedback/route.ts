import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { feedback, feedbackReason } = body;

  if (!feedback || !["good", "bad"].includes(feedback)) {
    return Response.json({ error: "feedback는 good 또는 bad" }, { status: 400 });
  }

  await prisma.audit.update({
    where: { id },
    data: {
      feedback,
      feedbackReason: feedback === "bad" ? feedbackReason || null : null,
    },
  });

  return Response.json({ ok: true });
}
