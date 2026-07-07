/**
 * MoneyDNA — Daily decision narration
 * -----------------------------------
 * Wraps the deterministically-chosen decision in warm, personal, companion
 * language. The engine decides WHAT; this decides how it's SAID. It never
 * invents a different decision, never gives a directive/advice, and stays
 * grounded in who the user is (their DNA + goal).
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Decision } from "@/lib/decision/engine";
import type { DecisionContext } from "@/lib/decision/inputs";

export async function narrateDecision(decision: Decision, ctx: DecisionContext): Promise<{ title: string; body: string; insight: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { title: decision.title, body: decision.body, insight: decision.insight };

  try {
    const client = new Anthropic({ apiKey });
    const facts = [
      `User: ${ctx.name}.`,
      ctx.dnaLabel ? `Their Financial DNA: ${ctx.dnaLabel}.` : "",
      ctx.goal ? `Their #1 goal: ${ctx.goal.name}.` : "",
      `Chosen decision (do NOT change it): ${decision.title}. Rationale: ${decision.body}`,
      decision.estimatedImpact > 0 ? `Estimated impact: about KES ${Math.round(decision.estimatedImpact).toLocaleString("en-US")}${ctx.goal ? ` toward ${ctx.goal.name}` : ""}.` : "This is an affirmation, not a restriction.",
      `Confidence: ${decision.confidence}.`,
    ].filter(Boolean).join(" ");

    const system =
      `You are MoneyDNA, a warm financial COMPANION delivering ONE daily decision. Rewrite the chosen decision as a short morning nudge (title max 8 words; body max 2 sentences; insight max 1 sentence). ` +
      `Speak directly ("you"), warm and encouraging, like a companion who knows them. Keep it a NUDGE, never a command or advice; do not add new numbers or a different decision. ` +
      `If confidence is medium/low, gently signal it's based on what they've shared. Return STRICT JSON only: {"title": "...", "body": "...", "insight": "..."} with no extra text.`;

    const msg = await client.messages.create({ model: "claude-sonnet-5", max_tokens: 300, system, messages: [{ role: "user", content: facts }] });
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("").trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as { title?: string; body?: string; insight?: string };
    return {
      title: parsed.title?.trim() || decision.title,
      body: parsed.body?.trim() || decision.body,
      insight: parsed.insight?.trim() || decision.insight,
    };
  } catch (err) {
    console.error("[decision] narration failed, using deterministic copy:", err);
    return { title: decision.title, body: decision.body, insight: decision.insight };
  }
}
