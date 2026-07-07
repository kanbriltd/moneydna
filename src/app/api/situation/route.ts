import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { logEvent } from "@/lib/events";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const s = await prisma.moneySituation.findUnique({ where: { userId } });
  return NextResponse.json(s ?? null);
}

// The 4–5 manual money inputs, captured right after the Financial DNA reveal.
const schema = z.object({
  monthlyIncome: z.number().min(0).max(100_000_000).optional(),
  monthlySavings: z.number().min(0).max(100_000_000).optional(),
  paydayDay: z.number().int().min(1).max(31).optional(),
  topExpense1: z.string().max(40).optional(),
  topExpense2: z.string().max(40).optional(),
  hasDebt: z.boolean().optional(),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  const d = parsed.data;

  const data = {
    monthlyIncome: d.monthlyIncome ?? null,
    monthlySavings: d.monthlySavings ?? null,
    paydayDay: d.paydayDay ?? null,
    topExpense1: d.topExpense1 ?? null,
    topExpense2: d.topExpense2 ?? null,
    hasDebt: d.hasDebt ?? false,
  };

  const saved = await prisma.moneySituation.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  await logEvent(userId, "situation_saved");
  return NextResponse.json(saved);
}
