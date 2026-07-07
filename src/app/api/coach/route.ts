import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { getAnalytics } from "@/lib/analytics";
import { answerCoachQuestion } from "@/lib/coachEngine";
import { loadCompanion, companionContext } from "@/lib/companion/memory";
import { logEvent } from "@/lib/events";

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

  const [history, analytics, companion] = await Promise.all([
    prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 20 }),
    getAnalytics(userId),
    loadCompanion(userId),
  ]);

  await prisma.chatMessage.create({ data: { userId, role: "user", content: parsed.data.message } });
  await logEvent(userId, "coach_question_asked");

  // The memory brief makes the coach speak like a companion who already knows them.
  const memory = companionContext(companion);

  const reply = await answerCoachQuestion(
    parsed.data.message,
    analytics,
    history.map((h: { role: string; content: string }) => ({ role: h.role as "user" | "assistant", content: h.content })),
    memory
  );

  const saved = await prisma.chatMessage.create({ data: { userId, role: "assistant", content: reply } });
  return NextResponse.json(saved);
}
