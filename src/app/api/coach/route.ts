import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { getAnalytics } from "@/lib/analytics";
import { answerCoachQuestion } from "@/lib/coachEngine";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const messages = await prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(messages);
}

const bodySchema = z.object({ message: z.string().trim().min(1).max(2000) });

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Message required." }, { status: 400 });

  const history = await prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 20 });
  const analytics = await getAnalytics(userId);

  await prisma.chatMessage.create({ data: { userId, role: "user", content: parsed.data.message } });

  const reply = await answerCoachQuestion(
    parsed.data.message,
    analytics,
    history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content }))
  );

  const saved = await prisma.chatMessage.create({ data: { userId, role: "assistant", content: reply } });

  return NextResponse.json(saved);
}
