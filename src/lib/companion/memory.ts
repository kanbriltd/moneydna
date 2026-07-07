/**
 * MoneyDNA — Companion memory
 * ---------------------------
 * The bridge between the stored identity (CompanionProfile) and every AI moment.
 * `companionContext()` produces the short "what I know about you" brief that gets
 * injected into the coach's system prompt — so the AI always speaks like it
 * already knows the person. This is what turns a chatbot into a companion.
 */

import { prisma } from "@/lib/prisma";
import type { DiscoveryAnswers } from "@/lib/companion/discovery";

export interface CompanionProfileLite {
  discoveryComplete: boolean;
  dnaType: string | null;
  dnaLabel: string | null;
  dnaSummary: string | null;
  confidenceScore: number | null;
  answers: DiscoveryAnswers;
}

export async function loadCompanion(userId: string): Promise<CompanionProfileLite | null> {
  const p = await prisma.companionProfile.findUnique({ where: { userId } });
  if (!p) return null;
  return {
    discoveryComplete: p.discoveryComplete,
    dnaType: p.dnaType,
    dnaLabel: p.dnaLabel,
    dnaSummary: p.dnaSummary,
    confidenceScore: p.confidenceScore,
    answers: {
      moneyStory: p.moneyStory ?? undefined,
      temperament: p.temperament ?? undefined,
      planning: p.planning ?? undefined,
      riskComfort: p.riskComfort ?? undefined,
      lifeStage: p.lifeStage ?? undefined,
      supportsFamily: p.supportsFamily,
      goodLife: p.goodLife ?? undefined,
      biggestFear: p.biggestFear ?? undefined,
      futureVision: p.futureVision ?? undefined,
    },
  };
}

/**
 * The memory brief injected into AI prompts. Empty string when unknown, so the
 * coach degrades gracefully for users who haven't done discovery yet.
 */
export function companionContext(p: CompanionProfileLite | null): string {
  if (!p || !p.discoveryComplete) return "";
  const a = p.answers;
  const bits = [
    p.dnaLabel ? `This user's Financial DNA is ${p.dnaLabel}.` : "",
    a.goodLife ? `A good life to them means ${a.goodLife}.` : "",
    a.futureVision ? `The life they're building, in their words: "${a.futureVision}".` : "",
    a.temperament ? `With money they lean ${a.temperament}.` : "",
    a.riskComfort ? `Risk comfort: ${a.riskComfort}.` : "",
    a.biggestFear ? `Their biggest money worry: ${a.biggestFear}.` : "",
    a.supportsFamily ? "They support family financially — be sensitive to this." : "",
  ].filter(Boolean);
  if (!bits.length) return "";
  return (
    "WHO YOU ARE TALKING TO (you already know this person — speak like a companion who remembers them, never re-introduce yourself): " +
    bits.join(" ")
  );
}
