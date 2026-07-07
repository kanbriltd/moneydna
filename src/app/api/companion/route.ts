import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { deriveDna, dnaConfidence, revealDna } from "@/lib/companion/financialDna";
import { logEvent } from "@/lib/events";

// GET — current companion profile (used to decide whether to onboard).
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const profile = await prisma.companionProfile.findUnique({ where: { userId } });
  return NextResponse.json(profile ?? { discoveryComplete: false });
}

const answersSchema = z.object({
  moneyStory: z.string().max(40).optional(),
  temperament: z.string().max(40).optional(),
  planning: z.string().max(40).optional(),
  riskComfort: z.string().max(40).optional(),
  lifeStage: z.string().max(40).optional(),
  supportsFamily: z.boolean().optional(),
  goodLife: z.string().max(40).optional(),
  biggestFear: z.string().max(40).optional(),
  futureVision: z.string().max(600).optional(),
});

// POST — save discovery answers, derive Financial DNA, generate the reveal.
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = answersSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answers." }, { status: 400 });
  const a = parsed.data;

  const dna = deriveDna(a);
  const confidence = dnaConfidence(a);
  const summary = await revealDna(dna, a);

  const data = {
    moneyStory: a.moneyStory ?? null,
    temperament: a.temperament ?? null,
    planning: a.planning ?? null,
    riskComfort: a.riskComfort ?? null,
    lifeStage: a.lifeStage ?? null,
    supportsFamily: a.supportsFamily ?? false,
    goodLife: a.goodLife ?? null,
    biggestFear: a.biggestFear ?? null,
    futureVision: a.futureVision ?? null,
    dnaType: dna.type,
    dnaLabel: dna.label,
    dnaSummary: summary,
    dnaConfidence: confidence,
    discoveryComplete: true,
  };

  await prisma.companionProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  await logEvent(userId, "discovery_completed");
  await logEvent(userId, "dna_revealed", { dnaType: dna.type });

  return NextResponse.json({ dna, summary, confidence });
}
