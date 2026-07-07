/**
 * MoneyDNA — Weekly reflection
 * ----------------------------
 * Every Sunday, tell a STORY about the user (not charts). Reinforces the habit
 * and shows behaviour change over the week — the thing the whole product exists
 * to prove.
 */

import type { Traits } from "@/lib/decision/inputs";
import { biggestMove } from "@/lib/decision/traits";

export interface WeekDecision {
  status: string; // pending | followed | skipped
  estimatedImpact: number;
}

export interface WeeklyReflection {
  total: number;
  followed: number;
  estimatedSaved: number;
  disciplineBefore: number;
  disciplineAfter: number;
  headline: string;
  story: string[];
  biggestMove: string | null;
}

export function buildWeeklyReflection(
  decisions: WeekDecision[],
  traitsBefore: Traits,
  traitsAfter: Traits
): WeeklyReflection {
  const total = decisions.length;
  const followed = decisions.filter((d) => d.status === "followed").length;
  const estimatedSaved = decisions
    .filter((d) => d.status === "followed")
    .reduce((s, d) => s + (d.estimatedImpact || 0), 0);

  const story: string[] = [];
  if (total > 0) {
    story.push(`This week you made ${total} money decision${total === 1 ? "" : "s"} with me.`);
    story.push(`You followed through ${followed} time${followed === 1 ? "" : "s"}.`);
    if (estimatedSaved > 0) story.push(`That's roughly KES ${Math.round(estimatedSaved).toLocaleString("en-US")} kept or moved toward your future.`);
    const dDelta = traitsAfter.discipline - traitsBefore.discipline;
    if (dDelta !== 0) story.push(`Your Discipline moved from ${traitsBefore.discipline} to ${traitsAfter.discipline}.`);
  } else {
    story.push("A fresh week ahead — your first decision is waiting for you tomorrow morning.");
  }

  const move = biggestMove(traitsBefore, traitsAfter);
  if (move) story.push(move);

  const headline =
    total === 0
      ? "Let's begin"
      : followed / Math.max(total, 1) >= 0.6
      ? "A strong week"
      : "Every decision counts";

  return {
    total,
    followed,
    estimatedSaved: Math.round(estimatedSaved),
    disciplineBefore: traitsBefore.discipline,
    disciplineAfter: traitsAfter.discipline,
    headline,
    story,
    biggestMove: move,
  };
}
