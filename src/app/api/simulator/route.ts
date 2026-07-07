import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/requireUser";
import { projectWealth } from "@/lib/wealthSimulator";

const bodySchema = z.object({
  monthly: z.number().min(0).max(100_000_000),
  years: z.number().int().min(1).max(60).optional(),
  annualReturnPct: z.number().min(0).max(30).optional(),
  startingAmount: z.number().min(0).max(1_000_000_000).optional(),
});

/**
 * The live slider computes projections client-side (instant, no round-trip),
 * but this endpoint lets you generate/share a projection server-side too.
 */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  return NextResponse.json(projectWealth(parsed.data));
}
