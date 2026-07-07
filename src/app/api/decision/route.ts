import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { getAnalytics } from "@/lib/analytics";
import { logEvent } from "@/lib/events";
import { generateDecision, type DecisionKind } from "@/lib/decision/engine";
import { buildTodaysBestMove } from "@/lib/decision/reason";
import { applyOutcome } from "@/lib/decision/traits";
import { DEFAULT_TRAITS, daysSincePayday, isoDay, type DecisionContext, type Traits } from "@/lib/decision/inputs";

// ---- GET: today's single "Today's Best Move" (generate + persist if absent) ----
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const today = isoDay();
  await logEvent(userId, "today_viewed");

  const existing = await prisma.dailyDecision.findUnique({ where: { userId_forDate: { userId, forDate: today } } });
  if (existing) {
    return NextResponse.json({ decision: existing, alreadyAnswered: existing.status !== "pending" });
  }

  const ctx = await buildContext(userId, today);
  const raw = generateDecision(ctx);

  // The user's OWN history with this KIND of move — used to earn confidence/numbers.
  const priors = await prisma.dailyDecision.findMany({ where: { userId, kind: raw.kind }, select: { status: true } });
  const history = {
    sameKindTotal: priors.length,
    sameKindFollowed: priors.filter((p: { status: string }) => p.status === "followed").length,
  };

  const move = await buildTodaysBestMove(raw, ctx, history);

  const saved = await prisma.dailyDecision.create({
    data: {
      userId,
      forDate: today,
      kind: raw.kind,
      title: move.move,
      body: raw.body,
      insight: raw.insight,
      why: move.why,
      basedOn: JSON.stringify(move.basedOn),
      band: move.band,
      historyNote: move.historyNote,
      estimatedImpact: raw.estimatedImpact,
      goalName: raw.goalName,
      confidence: move.band, // keep legacy field aligned with the band
      status: "pending",
    },
  });
  await logEvent(userId, "decision_generated", { kind: raw.kind, band: move.band });
  return NextResponse.json({ decision: saved, alreadyAnswered: false, goalProgressDelta: raw.goalProgressDelta });
}

// ---- POST: feedback loop (followed / skipped + why) -> evolve DNA traits ----
const feedbackSchema = z.object({
  followed: z.boolean(),
  reason: z.enum(["forgot", "couldnt_afford", "disagreed", "emergency", "other"]).optional(),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = feedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid feedback." }, { status: 400 });

  const today = isoDay();
  const decision = await prisma.dailyDecision.findUnique({ where: { userId_forDate: { userId, forDate: today } } });
  if (!decision) return NextResponse.json({ error: "No decision for today yet." }, { status: 404 });

  const status = parsed.data.followed ? "followed" : "skipped";
  await prisma.dailyDecision.update({
    where: { id: decision.id },
    data: { status, skipReason: parsed.data.followed ? null : parsed.data.reason ?? null },
  });

  // The loop closes: outcome -> memory. Evolve the five traits.
  const profile = await prisma.companionProfile.findUnique({ where: { userId } });
  if (profile) {
    const before: Traits = {
      saver: profile.traitSaver, planner: profile.traitPlanner, impulse: profile.traitImpulse,
      risk: profile.traitRisk, discipline: profile.traitDiscipline,
    };
    const after = applyOutcome(before, decision.kind as DecisionKind, parsed.data.followed);
    await prisma.companionProfile.update({
      where: { userId },
      data: {
        traitSaver: after.saver, traitPlanner: after.planner, traitImpulse: after.impulse,
        traitRisk: after.risk, traitDiscipline: after.discipline,
      },
    });
  }

  await logEvent(userId, parsed.data.followed ? "decision_followed" : "decision_skipped", { kind: decision.kind });
  return NextResponse.json({ ok: true, status });
}

// ---- Context assembly: manual-first, three data tiers ----
async function buildContext(userId: string, today: string): Promise<DecisionContext> {
  const [profile, situation, goals, yesterday, user] = await Promise.all([
    prisma.companionProfile.findUnique({ where: { userId } }),
    prisma.moneySituation.findUnique({ where: { userId } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.dailyDecision.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  const analytics = await getAnalytics(userId);
  const hasStatement = analytics.hasData;

  const traits: Traits = profile
    ? { saver: profile.traitSaver, planner: profile.traitPlanner, impulse: profile.traitImpulse, risk: profile.traitRisk, discipline: profile.traitDiscipline }
    : { ...DEFAULT_TRAITS };

  const goal = goals[0] ? { name: goals[0].name, target: goals[0].targetAmount, current: goals[0].currentAmount } : null;
  const now = new Date();

  return {
    name: user?.name?.split(" ")[0] || "there",
    dataTier: hasStatement ? 3 : situation ? 2 : 1,
    hasStatement,
    dnaLabel: profile?.dnaLabel ?? null,
    traits,
    goal,
    situation: {
      monthlyIncome: situation?.monthlyIncome ?? (hasStatement ? Math.round(analytics.kpis.income) : null),
      monthlySavings: situation?.monthlySavings ?? null,
      paydayDay: situation?.paydayDay ?? null,
      topExpenses: [situation?.topExpense1, situation?.topExpense2].filter(Boolean) as string[],
      hasDebt: situation?.hasDebt ?? false,
    },
    calendar: {
      todayISO: today,
      dayOfWeek: now.getDay(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      daysSincePayday: daysSincePayday(situation?.paydayDay ?? null, now),
    },
    yesterdayKind: yesterday?.kind ?? null,
  };
}
