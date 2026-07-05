import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/requireUser";
import { runWhatIf } from "@/lib/whatIf";

const scenarioSchema = z.object({
  extraMonthlySavings: z.number().min(0).max(10_000_000).default(0),
  stopFuliza: z.boolean().default(false),
  incomeChangePct: z.number().min(-100).max(500).default(0),
  rentChangePct: z.number().min(-100).max(500).default(0),
  monthlyInvestment: z.number().min(0).max(10_000_000).default(0),
  investmentAnnualReturnPct: z.number().min(0).max(100).default(10),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = scenarioSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid scenario." }, { status: 400 });

  const result = await runWhatIf(userId, parsed.data);
  return NextResponse.json(result);
}
