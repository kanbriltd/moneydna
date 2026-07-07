/**
 * MoneyDNA — Evidence Engine  (Constitution: Principle 3, Article I & II)
 * ----------------------------------------------------------------------
 * Before we reason, we assemble EVIDENCE. Each item is tagged by source so the
 * app can honestly distinguish what the user told us, what we observed, and what
 * we're inferring. The confidence BAND is computed from the strength and quantity
 * of that evidence — never asserted, never a predicted percentage.
 *
 * Numbers are EARNED, per the tiered confidence policy:
 *   0–9 similar past decisions  -> band only, no numbers
 *   10–19                       -> band + a factual count ("followed 8 times")
 *   20+                         -> band + a measured ratio ("followed 17 of 21")
 *
 * This file is pure & deterministic. It does not call an LLM. The Reasoning
 * Engine turns this evidence into warm language; it may never inflate it.
 */

import type { DecisionContext } from "@/lib/decision/inputs";
import type { Decision } from "@/lib/decision/engine";

export type EvidenceSource = "you_told_us" | "we_observed" | "we_infer";
export type ConfidenceBand = "high" | "medium" | "low";

export interface EvidenceItem {
  text: string; // plain-language fact
  source: EvidenceSource; // Article II: observation vs inference vs stated
  weight: number; // 0..1 — how much this supports the move
}

/** The history of this decision KIND for this user, used to earn numbers. */
export interface DecisionHistory {
  sameKindTotal: number; // how many times we've made this kind of move
  sameKindFollowed: number; // how many they followed
}

export interface EvidenceResult {
  items: EvidenceItem[];
  band: ConfidenceBand;
  /** A measured, honest history phrase — or null until it's earned. */
  historyNote: string | null;
  /** Machine-readable, for UI + the reasoning layer. */
  basedOn: string[];
}

export function assembleEvidence(decision: Decision, ctx: DecisionContext, history: DecisionHistory): EvidenceResult {
  const items: EvidenceItem[] = [];
  const add = (text: string, source: EvidenceSource, weight: number) => items.push({ text, source, weight });

  // --- What the user TOLD us (highest-trust: stated facts) ---
  if (ctx.goal) add(`Your top goal is ${ctx.goal.name}.`, "you_told_us", 0.9);
  if (ctx.situation.paydayDay) add(`You're usually paid on the ${ordinal(ctx.situation.paydayDay)}.`, "you_told_us", 0.7);
  if (ctx.situation.hasDebt && decision.kind === "debt_priority") add("You told us you're carrying debt.", "you_told_us", 0.9);
  if (ctx.situation.topExpenses.length && decision.kind === "cook_instead")
    add(`You named ${ctx.situation.topExpenses[0]} as a big monthly expense.`, "you_told_us", 0.7);

  // --- What we OBSERVED (from statement data, if present) ---
  if (ctx.hasStatement) {
    add("We can see your recent spending pattern in your statement.", "we_observed", 0.85);
  }
  // Observed follow-through history (their real behaviour with this kind of move)
  if (history.sameKindTotal > 0) {
    add(`You've acted on this kind of move before.`, "we_observed", 0.6 + Math.min(0.3, history.sameKindTotal * 0.03));
  }

  // --- What we INFER (clearly labelled as inference) ---
  const dsp = ctx.calendar.daysSincePayday;
  if (dsp != null && dsp <= 3) add("Spending tends to rise in the first days after payday.", "we_infer", 0.6);
  if (ctx.calendar.isWeekend) add("Weekends are often higher-spending days.", "we_infer", 0.5);
  if (ctx.traits.impulse >= 60) add("Your Financial DNA leans toward spontaneous spending.", "we_infer", 0.5);

  // Always at least one honest anchor so we never show an empty basis.
  if (!items.length) add("This is based mostly on your goals and Financial DNA.", "we_infer", 0.4);

  const band = computeBand(items, ctx, history);
  const historyNote = earnedHistoryNote(history);
  const basedOn = dedupeSources(items);

  return { items, band, historyNote, basedOn };
}

/**
 * Confidence band from evidence strength + how much of THIS user we've seen.
 * Deliberately conservative: strong observed history is required for "high".
 */
function computeBand(items: EvidenceItem[], ctx: DecisionContext, history: DecisionHistory): ConfidenceBand {
  const observedWeight = items.filter((i) => i.source !== "we_infer").reduce((s, i) => s + i.weight, 0);
  const hasRealHistory = history.sameKindTotal >= 10;
  const hasStatement = ctx.hasStatement;

  // High only when we've genuinely earned it: real behavioural history OR
  // statement data plus multiple stated/observed facts.
  if (hasRealHistory && observedWeight >= 1.4) return "high";
  if (hasStatement && observedWeight >= 1.6) return "high";
  if (observedWeight >= 1.0 || history.sameKindTotal >= 3) return "medium";
  return "low";
}

/** Earn the right to numbers — per the Constitution's tiered policy. */
function earnedHistoryNote(h: DecisionHistory): string | null {
  if (h.sameKindTotal >= 20) {
    return `You've followed ${h.sameKindFollowed} of ${h.sameKindTotal} similar moves.`;
  }
  if (h.sameKindTotal >= 10) {
    return `You've followed this type of move ${h.sameKindFollowed} time${h.sameKindFollowed === 1 ? "" : "s"} so far.`;
  }
  return null; // 0–9: bands only, no numbers
}

export const BAND_COPY: Record<ConfidenceBand, { emoji: string; label: string; line: string }> = {
  high: { emoji: "\u{1F7E2}", label: "High confidence", line: "We've seen this pattern from you consistently." },
  medium: { emoji: "\u{1F7E1}", label: "Medium confidence", line: "We're seeing signs of this, but still learning your patterns." },
  low: { emoji: "\u{26AA}", label: "Low confidence", line: "This is based mostly on your goals and Financial DNA — we don't have enough history yet." },
};

function dedupeSources(items: EvidenceItem[]): string[] {
  const map: Record<EvidenceSource, string> = {
    you_told_us: "What you told us",
    we_observed: "Your spending history",
    we_infer: "Your Financial DNA & goals",
  };
  return Array.from(new Set(items.map((i) => map[i.source])));
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
