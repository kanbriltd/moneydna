import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { requireUserId } from "@/lib/requireUser";
import { getAnalytics } from "@/lib/analytics";
import { buildBlueprint, type Blueprint } from "@/lib/salaryBlueprint";
import { kes } from "@/lib/format";

const bodySchema = z.object({
  salary: z.number().positive().max(100_000_000).optional(),
  context: z
    .object({
      incomeType: z.enum(["salaried", "irregular"]).optional(),
      highInterestDebt: z.boolean().optional(),
      emergencyMonthsSaved: z.number().min(0).max(60).optional(),
      dependents: z.boolean().optional(),
      age: z.number().int().min(16).max(90).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // Auto-detect monthly income from the user's statement when they don't supply one.
  const analytics = await getAnalytics(userId);
  const detectedIncome = Math.round(analytics.kpis.income) || 0;
  const salary = parsed.data.salary ?? detectedIncome;

  if (!salary || salary <= 0) {
    return NextResponse.json(
      { error: "No salary provided and none could be detected — enter a monthly income." },
      { status: 422 }
    );
  }

  const blueprint = buildBlueprint(salary, parsed.data.context ?? {});
  const narrative = await narrateBlueprint(blueprint);

  return NextResponse.json({ blueprint, narrative, detectedIncome });
}

/** Warm companion note over the deterministic numbers. Never picks specific products. */
async function narrateBlueprint(bp: Blueprint): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const facts = [
    `Monthly income: ${kes(bp.income)}.`,
    `Mode: ${bp.mode}.`,
    `Money not consumed (saved/invested/debt): ${bp.savingsPct}%.`,
    `Allocations: ${bp.allocations.map((a) => `${a.label} ${kes(a.amount)} (${a.pct}%)`).join(", ")}.`,
    bp.freedom.reachable && bp.freedom.baseYears != null
      ? `Freedom estimate: ~${bp.freedom.baseYears}-${bp.freedom.highYears} years at KES ${bp.freedom.monthlyInvestable.toLocaleString("en-US")}/month invested.`
      : `Freedom is distant at the current monthly investable amount.`,
    bp.cautions.length ? `Cautions: ${bp.cautions.join(" ")}` : "",
  ].join(" ");

  if (!apiKey) return fallbackNarrative(bp);

  try {
    const client = new Anthropic({ apiKey });
    const system =
      `You are MoneyDNA's warm financial COMPANION (not a licensed advisor). In under 80 words, encourage the user about THIS salary blueprint. ` +
      `Congratulate them, highlight the single most important move, and if there is a caution (debt, low income, irregular income, family support), address it kindly. ` +
      `Guide, never dictate; do NOT recommend any specific fund/stock/product; frame the freedom estimate as one possible path, not a promise. Warm, human, hopeful. Plain text, no markdown.`;
    const msg = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 260,
      system,
      messages: [{ role: "user", content: facts }],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
    return text || fallbackNarrative(bp);
  } catch (err) {
    console.error("[blueprint] narrative generation failed, using fallback:", err);
    return fallbackNarrative(bp);
  }
}

function fallbackNarrative(bp: Blueprint): string {
  if (bp.mode === "debtFirst")
    return "First — nice work facing the debt head-on. Clearing those high-interest loans is the best 'investment' you can make right now, because no fund beats that guaranteed return. Once they're gone, this same plan quietly turns into wealth-building. One step at a time.";
  if (bp.mode === "lowIncome")
    return "This is a real, honest start — and starting is the hard part. The magic here isn't the amount, it's that it never stops. A small automatic save every month builds the buffer that keeps you off expensive loans, and it grows with you. Proud of you for planning ahead.";
  if (bp.mode === "irregular")
    return "Smart to plan around income that moves. Pay yourself the moment money lands, keep that buffer fat in good months, and lean on it in lean ones. Treat every bucket as a share of whatever arrives — that rhythm is what turns an unpredictable income into a stable future.";
  return `Great step taking control of your ${kes(bp.income)}. You're routing ${bp.savingsPct}% toward your future — the single most powerful habit in personal finance is paying yourself first, automatically, the day you're paid. Keep this going and future-you inherits the reward. One possible path, but a strong one.`;
}
