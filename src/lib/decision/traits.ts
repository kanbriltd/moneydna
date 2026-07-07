/**
 * MoneyDNA — Evolving Financial DNA traits
 * ----------------------------------------
 * Five traits (0..100) that MOVE over time based on real behaviour. Seeded from
 * the discovery answers, then nudged every time the user follows or skips a daily
 * decision. This evolution is what makes the product feel alive — it tells the
 * story of the user's progress, not just their money.
 */

import type { Traits } from "@/lib/decision/inputs";
import type { DiscoveryAnswers } from "@/lib/companion/discovery";
import type { DecisionKind } from "@/lib/decision/engine";

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

/** Seed the five traits from the discovery answers (a reasonable starting read). */
export function seedTraits(a: DiscoveryAnswers): Traits {
  const saverBase = a.temperament === "saver" ? 68 : a.temperament === "spender" ? 34 : 50;
  const storyAdj = a.moneyStory === "scarcity" ? 6 : a.moneyStory === "comfort" ? -4 : 0;
  const planner = a.planning === "planner" ? 70 : a.planning === "spontaneous" ? 34 : 50;
  const impulse = a.planning === "spontaneous" ? 66 : a.planning === "planner" ? 36 : 50;
  const risk = a.riskComfort === "bold" ? 72 : a.riskComfort === "cautious" ? 30 : 50;
  const discipline = Math.round((planner + saverBase) / 2);
  return {
    saver: clamp(saverBase + storyAdj),
    planner: clamp(planner),
    impulse: clamp(impulse + (a.temperament === "spender" ? 8 : 0)),
    risk: clamp(risk),
    discipline: clamp(discipline),
  };
}

/**
 * Nudge traits after a decision outcome. Small deltas so the DNA drifts
 * gradually and believably over weeks (never lurches).
 */
export function applyOutcome(traits: Traits, kind: DecisionKind, followed: boolean): Traits {
  const t = { ...traits };
  const up = (k: keyof Traits, d: number) => (t[k] = clamp(t[k] + d));
  const s = followed ? 1 : -1;

  // Following ANY decision builds discipline; skipping erodes it slightly.
  up("discipline", 3 * s);

  switch (kind) {
    case "save_after_payday":
    case "micro_transfer":
      up("saver", 3 * s);
      break;
    case "impulse_guard":
    case "delay_purchase":
      up("impulse", -3 * s); // following reduces impulse
      up("planner", 2 * s);
      break;
    case "debt_priority":
      up("saver", 2 * s);
      up("planner", 2 * s);
      break;
    case "cook_instead":
      up("saver", 2 * s);
      break;
    case "on_track_affirm":
      up("discipline", 1 * s); // mild — this one is affirmation, not effort
      break;
  }
  return t;
}

/** A friendly one-liner describing the biggest recent trait move (for the weekly story). */
export function biggestMove(before: Traits, after: Traits): string | null {
  const keys: (keyof Traits)[] = ["saver", "planner", "impulse", "risk", "discipline"];
  let best: { k: keyof Traits; d: number } | null = null;
  for (const k of keys) {
    const d = after[k] - before[k];
    const improvement = k === "impulse" ? -d : d; // lower impulse is an improvement
    if (!best || improvement > (best.k === "impulse" ? -best.d : best.d)) best = { k, d };
  }
  if (!best || best.d === 0) return null;
  const label: Record<keyof Traits, string> = {
    saver: "saving consistency",
    planner: "planning ahead",
    impulse: "resisting impulse spending",
    risk: "risk comfort",
    discipline: "following through on your goals",
  };
  return `Your biggest improvement: ${label[best.k]}.`;
}
