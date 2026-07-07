import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { buildWeeklyReflection } from "@/lib/decision/weekly";
import { DEFAULT_TRAITS, type Traits } from "@/lib/decision/inputs";
import { logEvent } from "@/lib/events";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [decisions, profile] = await Promise.all([
    prisma.dailyDecision.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "asc" } }),
    prisma.companionProfile.findUnique({ where: { userId } }),
  ]);

  const after: Traits = profile
    ? { saver: profile.traitSaver, planner: profile.traitPlanner, impulse: profile.traitImpulse, risk: profile.traitRisk, discipline: profile.traitDiscipline }
    : { ...DEFAULT_TRAITS };

  // Rough "before" = reconstruct discipline at week start (after minus this week's follow-throughs).
  const followedThisWeek = decisions.filter((d: { status: string }) => d.status === "followed").length;
  const before: Traits = { ...after, discipline: Math.max(0, after.discipline - followedThisWeek * 3) };

  const reflection = buildWeeklyReflection(
    decisions.map((d: { status: string; estimatedImpact: number }) => ({ status: d.status, estimatedImpact: d.estimatedImpact })),
    before,
    after
  );

  await logEvent(userId, "weekly_viewed");
  return NextResponse.json(reflection);
}
