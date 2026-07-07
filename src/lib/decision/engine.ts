/**
 * MoneyDNA — Daily Decision Engine (the heart of V1)
 * --------------------------------------------------
 * Every morning it answers ONE question: what is the single highest-impact
 * financial decision this person could make today?
 *
 * Deterministic + explainable: it generates candidate decisions, scores each by
 * (estimated impact toward the user's goal) x (fit to who they are today), and
 * returns the single best one. The AI only writes the warm phrasing later — the
 * choice itself is auditable rules, never a black box. It NUDGES, never dictates
 * (stays inside the "not advisers" guardrail), and it is honest about confidence
 * when it has little data.
 */

import { DecisionContext, suggestedDailyAmount } from "@/lib/decision/inputs";

export type DecisionKind =
  | "save_after_payday"
  | "micro_transfer"
  | "impulse_guard"
  | "debt_priority"
  | "cook_instead"
  | "delay_purchase"
  | "on_track_affirm";

export interface Decision {
  kind: DecisionKind;
  title: string; // short imperative shown big
  body: string; // one supporting sentence (deterministic fallback text)
  estimatedImpact: number; // KES toward the goal
  goalName: string | null;
  goalProgressDelta: number; // % of goal this moves them
  confidence: "high" | "medium" | "low";
  insight: string; // the small "daily insight" line
}

interface Candidate extends Omit<Decision, "goalProgressDelta"> {
  fit: number; // 0..1 — how well this fits the user TODAY
}

/** Build every plausible decision for today, each with an impact + fit score. */
function candidates(ctx: DecisionContext): Candidate[] {
  const out: Candidate[] = [];
  const t = ctx.traits;
  const amt = suggestedDailyAmount(ctx.situation.monthlyIncome);
  const goalName = ctx.goal?.name ?? null;
  const conf: Decision["confidence"] = ctx.hasStatement ? "high" : "medium";
  const foods = ctx.situation.topExpenses.map((e) => e.toLowerCase());
  const eatsOut = foods.some((e) => /food|eat|restaurant|takeaway|lunch|dining/.test(e));
  const dsp = ctx.calendar.daysSincePayday;

  // 1) Save right after payday — strongest for high-impulse / low-saver users.
  if (dsp != null && dsp <= 3) {
    out.push({
      kind: "save_after_payday",
      title: `Move KES ${amt.toLocaleString("en-US")} to savings today`,
      body: `You were paid ${dsp === 0 ? "today" : `${dsp} day${dsp === 1 ? "" : "s"} ago`} — moving a little aside now, before it's spent, is the single highest-leverage move you can make.`,
      estimatedImpact: amt,
      goalName,
      confidence: conf,
      insight: "Money moved in the first days after payday is money you actually keep.",
      fit: 0.55 + (t.impulse / 100) * 0.3 + ((100 - t.saver) / 100) * 0.15,
    });
  }

  // 2) Debt first (guardrail: clearing high-interest debt beats investing).
  if (ctx.situation.hasDebt) {
    out.push({
      kind: "debt_priority",
      title: `Put KES ${amt.toLocaleString("en-US")} toward your debt today`,
      body: `Clearing debt is a guaranteed return no saving or investment can beat — chipping at it today quietly frees up your future.`,
      estimatedImpact: amt,
      goalName,
      confidence: conf,
      insight: "Every shilling off high-interest debt is worth more than the same shilling saved.",
      fit: 0.7,
    });
  }

  // 3) Impulse guard on risky days (weekends / high-impulse users).
  if (ctx.calendar.isWeekend || t.impulse >= 60) {
    const avoided = Math.round(amt * 1.5);
    out.push({
      kind: "impulse_guard",
      title: "Pause before any non-essential buy today",
      body: `Today tends to be a spending day for you. If something isn't planned, sleep on it — that pause alone could protect about KES ${avoided.toLocaleString("en-US")}.`,
      estimatedImpact: avoided,
      goalName,
      confidence: ctx.hasStatement ? "high" : "medium",
      insight: "The gap between wanting and buying is where money is saved.",
      fit: 0.4 + (t.impulse / 100) * 0.45 + (ctx.calendar.isWeekend ? 0.1 : 0),
    });
  }

  // 4) Cook instead of ordering — if food is a top expense.
  if (eatsOut) {
    out.push({
      kind: "cook_instead",
      title: "Cook instead of ordering today",
      body: `One home-cooked meal instead of takeout is an easy win — roughly KES 850 that could go toward ${goalName ?? "your goal"} instead.`,
      estimatedImpact: 850,
      goalName,
      confidence: "medium",
      insight: "Food is the expense you control most — small swaps add up fast.",
      fit: 0.45 + ((100 - t.discipline) / 100) * 0.1,
    });
  }

  // 5) Micro-transfer toward the goal — universal, easy, habit-building.
  if (ctx.goal) {
    out.push({
      kind: "micro_transfer",
      title: `Send KES ${Math.max(100, Math.round(amt / 2)).toLocaleString("en-US")} to your ${ctx.goal.name} fund`,
      body: `Tiny and painless — but doing it today keeps the habit alive and moves ${ctx.goal.name} a step closer.`,
      estimatedImpact: Math.max(100, Math.round(amt / 2)),
      goalName,
      confidence: conf,
      insight: "Small, automatic, relentless beats big and occasional.",
      fit: 0.4 + (t.saver / 100) * 0.15,
    });
  }

  // 6) Delay a purchase to a better time.
  if (t.impulse >= 45 && ctx.calendar.dayOfWeek !== 5) {
    out.push({
      kind: "delay_purchase",
      title: "Delay any big buy to the weekend",
      body: `If you're planning a larger purchase, wait a couple of days — you'll buy it clear-headed, and often decide you don't need it at all.`,
      estimatedImpact: Math.round(amt * 2),
      goalName,
      confidence: "low",
      insight: "A short delay turns impulse into intention.",
      fit: 0.3 + (t.impulse / 100) * 0.2,
    });
  }

  // 7) On-track affirmation — the point isn't to stop spending. Reward discipline.
  if (t.discipline >= 65 || (dsp != null && dsp > 20)) {
    out.push({
      kind: "on_track_affirm",
      title: "You're on track — enjoy today, guilt-free",
      body: `Your habits are solid right now. Spending intentionally on something you value today is part of a healthy plan, not a break from it.`,
      estimatedImpact: 0,
      goalName,
      confidence: conf,
      insight: "Confidence isn't never spending — it's knowing when you can.",
      fit: 0.35 + (t.discipline / 100) * 0.3,
    });
  }

  return out;
}

/** Score = impact (normalised) x 0.55 + fit x 0.45, with a small anti-repeat penalty. */
export function generateDecision(ctx: DecisionContext): Decision {
  const list = candidates(ctx);

  // Fallback if nothing fired (shouldn't happen, but never leave the user empty).
  if (!list.length) {
    const amt = suggestedDailyAmount(ctx.situation.monthlyIncome);
    return {
      kind: "micro_transfer",
      title: `Set aside KES ${amt.toLocaleString("en-US")} today`,
      body: "A small amount kept today is the simplest way to move toward the life you're building.",
      estimatedImpact: amt,
      goalName: ctx.goal?.name ?? null,
      goalProgressDelta: ctx.goal ? round1((amt / ctx.goal.target) * 100) : 0,
      confidence: "medium",
      insight: "One small decision, every day, compounds into a different future.",
    };
  }

  const maxImpact = Math.max(...list.map((c) => c.estimatedImpact), 1);
  const scored = list.map((c) => {
    const impactN = c.estimatedImpact / maxImpact; // 0..1
    let score = impactN * 0.55 + c.fit * 0.45;
    if (ctx.yesterdayKind && c.kind === ctx.yesterdayKind) score -= 0.2; // keep it fresh
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].c;

  const goalProgressDelta = ctx.goal && best.estimatedImpact > 0 ? round1((best.estimatedImpact / ctx.goal.target) * 100) : 0;
  return { ...stripFit(best), goalProgressDelta };
}

function stripFit(c: Candidate): Decision {
  const { fit: _drop, ...rest } = c;
  void _drop;
  return { ...rest, goalProgressDelta: 0 };
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
