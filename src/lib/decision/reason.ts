/**
 * MoneyDNA — Evidence-First Reasoning Engine  (Constitution: Principles 3 & 4)
 * ---------------------------------------------------------------------------
 * Turns assembled evidence into the immutable three-section "Today's Best Move".
 * The AI phrases; the EVIDENCE decides the confidence. The model is structurally
 * forbidden from inventing facts or sounding more certain than the band allows:
 *   - it only rephrases evidence we pass it,
 *   - the band + history note are computed deterministically and passed through
 *     unchanged (the model never sets confidence),
 *   - a rule-based fallback produces the same honest structure with no LLM.
 *
 * Output is always answerable to the user's question: "why did you tell me this?"
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Decision } from "@/lib/decision/engine";
import type { DecisionContext } from "@/lib/decision/inputs";
import { assembleEvidence, BAND_COPY, type DecisionHistory, type EvidenceResult, type ConfidenceBand } from "@/lib/decision/evidence";

export interface TodaysBestMove {
  move: string; // "Today's Best Move"
  why: string; // "Why this matters"
  basedOn: string[]; // "What we're basing this on"
  band: ConfidenceBand;
  bandEmoji: string;
  bandLabel: string;
  bandLine: string;
  historyNote: string | null; // measured, earned — or null
  evidence: { text: string; source: string }[]; // the raw items, for transparency
}

const SOURCE_LABEL: Record<string, string> = {
  you_told_us: "You told us",
  we_observed: "We observed",
  we_infer: "We're inferring",
};

export async function buildTodaysBestMove(
  decision: Decision,
  ctx: DecisionContext,
  history: DecisionHistory
): Promise<TodaysBestMove> {
  const ev = assembleEvidence(decision, ctx, history);
  const band = BAND_COPY[ev.band];

  const why = await reasonWhy(decision, ctx, ev);

  return {
    move: decision.title,
    why,
    basedOn: buildBasedOn(ev),
    band: ev.band,
    bandEmoji: band.emoji,
    bandLabel: band.label,
    bandLine: band.line,
    historyNote: ev.historyNote,
    evidence: ev.items.map((i) => ({ text: i.text, source: SOURCE_LABEL[i.source] })),
  };
}

/** "What we're basing this on" — evidence sources + the honest confidence line. */
function buildBasedOn(ev: EvidenceResult): string[] {
  const lines = ev.basedOn.map((s) => `\u2713 ${s}`);
  // The confidence line always appears here, so certainty is never implied silently.
  lines.push(`${BAND_COPY[ev.band].emoji} ${BAND_COPY[ev.band].label} \u2014 ${BAND_COPY[ev.band].line}`);
  if (ev.historyNote) lines.push(`\u2713 ${ev.historyNote}`);
  return lines;
}

/** The "Why this matters" sentence. AI phrases the evidence; never exceeds it. */
async function reasonWhy(decision: Decision, ctx: DecisionContext, ev: EvidenceResult): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackWhy(decision, ctx, ev);

  try {
    const client = new Anthropic({ apiKey });
    const evidenceList = ev.items.map((i) => `- (${SOURCE_LABEL[i.source]}) ${i.text}`).join("\n");
    const system =
      `You are MoneyDNA, a warm financial COMPANION. Write ONLY the "Why this matters" sentence(s) for today's move — max 2 sentences. ` +
      `Rules (non-negotiable): use ONLY the evidence provided; never invent a fact, number, or probability; never sound more certain than the stated confidence band; ` +
      `distinguish what the user told us from what we observed or inferred if relevant; warm and clear, never bossy. This connects the move to the user's own goal. Plain text only.`;
    const user =
      `Move: ${decision.title}\nUser goal: ${ctx.goal?.name ?? "building their future"}\nConfidence band: ${ev.band}\nEvidence:\n${evidenceList}`;
    const msg = await client.messages.create({ model: "claude-sonnet-5", max_tokens: 160, system, messages: [{ role: "user", content: user }] });
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();
    return text || fallbackWhy(decision, ctx, ev);
  } catch (err) {
    console.error("[reason] why-generation failed, using deterministic copy:", err);
    return fallbackWhy(decision, ctx, ev);
  }
}

function fallbackWhy(decision: Decision, ctx: DecisionContext, ev: EvidenceResult): string {
  const goal = ctx.goal?.name;
  const topInfer = ev.items.find((i) => i.source === "we_infer")?.text;
  const base = decision.body;
  if (goal && topInfer) return `${topInfer} Acting on this today keeps you moving toward ${goal}.`;
  if (goal) return `${base} It keeps you moving toward ${goal}.`;
  return base;
}
