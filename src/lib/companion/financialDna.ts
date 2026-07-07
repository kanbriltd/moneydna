/**
 * MoneyDNA — Financial DNA (the reveal)
 * -------------------------------------
 * Turns the discovery answers into a Financial DNA archetype — the "who you are
 * with money" the user is trying to discover. Deterministic derivation (so it's
 * explainable and stable) + a warm AI-written reveal, with a safe fallback.
 *
 * IMPORTANT: this is identity, not advice. It describes the person; it never
 * tells them what to buy or do.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { DiscoveryAnswers } from "@/lib/companion/discovery";

export interface FinancialDna {
  type: string; // archetype key
  label: string; // "The Builder"
  emoji: string;
  traits: string[]; // short descriptors
  coreDriver: string; // what motivates them
  strength: string; // their financial superpower
  watchOut: string; // gentle blind spot (not advice)
}

// Six archetypes, chosen from temperament + planning + goodLife + riskComfort.
const ARCHETYPES: Record<string, Omit<FinancialDna, "type">> = {
  builder: {
    label: "The Builder",
    emoji: "\u{1F9F1}",
    traits: ["security-driven", "steady", "long-term"],
    coreDriver: "building something solid that lasts",
    strength: "you save with discipline and think in years, not days",
    watchOut: "sometimes you delay enjoying today for a tomorrow that's already safe",
  },
  guardian: {
    label: "The Guardian",
    emoji: "\u{1F6E1}\u{FE0F}",
    traits: ["protective", "cautious", "family-first"],
    coreDriver: "keeping the people you love safe",
    strength: "you plan ahead and rarely take reckless risks",
    watchOut: "fear of loss can keep your money too still to grow",
  },
  explorer: {
    label: "The Explorer",
    emoji: "\u{1F9ED}",
    traits: ["adventurous", "experience-led", "open"],
    coreDriver: "freedom and a life full of experiences",
    strength: "you're motivated and willing to bet on yourself",
    watchOut: "the excitement of now can outrun the plan for later",
  },
  achiever: {
    label: "The Achiever",
    emoji: "\u{1F3AF}",
    traits: ["ambitious", "driven", "status-aware"],
    coreDriver: "achievement and being respected for it",
    strength: "you aim high and move fast toward goals",
    watchOut: "lifestyle can quietly rise as fast as income does",
  },
  dreamer: {
    label: "The Dreamer",
    emoji: "\u{2728}",
    traits: ["visionary", "spontaneous", "hopeful"],
    coreDriver: "a bigger, freer life you can already picture",
    strength: "you have a clear, motivating vision of the future",
    watchOut: "turning the dream into small steady steps is the missing piece",
  },
  steward: {
    label: "The Steward",
    emoji: "\u{1F331}",
    traits: ["balanced", "thoughtful", "legacy-minded"],
    coreDriver: "using money wisely for something beyond yourself",
    strength: "you balance today and tomorrow with unusual care",
    watchOut: "you may give to others before securing your own base",
  },
};

/** Deterministic, explainable mapping from answers to an archetype. */
export function deriveDna(a: DiscoveryAnswers): FinancialDna {
  const good = a.goodLife;
  const temp = a.temperament;
  const risk = a.riskComfort;

  let key = "steward";
  if (good === "security" || (temp === "saver" && a.planning === "planner")) key = a.supportsFamily ? "guardian" : "builder";
  else if (good === "family") key = "guardian";
  else if (good === "freedom") key = risk === "bold" ? "explorer" : "builder";
  else if (good === "adventure") key = "explorer";
  else if (good === "status") key = "achiever";
  else if (good === "legacy") key = "steward";
  else if (a.planning === "spontaneous" && risk !== "cautious") key = "dreamer";

  return { type: key, ...ARCHETYPES[key] };
}

/** Confidence in the derived DNA — grows as more of the profile is filled. */
export function dnaConfidence(a: DiscoveryAnswers): number {
  const fields = ["moneyStory", "temperament", "planning", "riskComfort", "lifeStage", "goodLife", "biggestFear", "futureVision"] as const;
  const filled = fields.filter((f) => a[f] != null && String(a[f]).trim() !== "").length;
  return Math.round((filled / fields.length) * 70); // caps at ~70 until real data confirms it
}

/** Warm, personal reveal. Identity, never advice. AI with safe fallback. */
export async function revealDna(dna: FinancialDna, a: DiscoveryAnswers): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackReveal(dna, a);
  try {
    const client = new Anthropic({ apiKey });
    const facts = [
      `Archetype: ${dna.label} ${dna.emoji}.`,
      `Core driver: ${dna.coreDriver}.`,
      `Strength: ${dna.strength}.`,
      `Gentle blind spot: ${dna.watchOut}.`,
      a.moneyStory ? `Money growing up: ${a.moneyStory}.` : "",
      a.goodLife ? `A good life means: ${a.goodLife}.` : "",
      a.biggestFear ? `Biggest worry: ${a.biggestFear}.` : "",
      a.futureVision ? `In their words, the life they want: "${a.futureVision}".` : "",
    ].filter(Boolean).join(" ");
    const system =
      `You are MoneyDNA, a warm financial COMPANION revealing someone's "Financial DNA" for the first time. ` +
      `In under 90 words, speak directly to them ("you"). Make them feel SEEN and understood, name their archetype, reflect back their vision in their own spirit, and end with quiet encouragement. ` +
      `This is identity, not advice: do NOT tell them what to buy, save, or do, and never mention specific products. Warm, human, hopeful. Plain text.`;
    const msg = await client.messages.create({ model: "claude-sonnet-5", max_tokens: 260, system, messages: [{ role: "user", content: facts }] });
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
    return text || fallbackReveal(dna, a);
  } catch (err) {
    console.error("[financialDna] reveal generation failed, using fallback:", err);
    return fallbackReveal(dna, a);
  }
}

function fallbackReveal(dna: FinancialDna, a: DiscoveryAnswers): string {
  const vision = a.futureVision?.trim();
  return (
    `You're ${dna.label} ${dna.emoji}. At your core, you're driven by ${dna.coreDriver}. ` +
    `Your strength is clear: ${dna.strength}. ` +
    (vision ? `And the life you described — "${vision}" — tells me exactly what we're building toward. ` : "") +
    `I'll remember who you are from here on, and everything we do together will be shaped around it. This is just the beginning.`
  );
}
