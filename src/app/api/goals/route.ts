import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().min(1).max(8),
  color: z.string().trim().min(1).max(20),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const goal = await prisma.goal.create({ data: { userId, ...parsed.data } });
  return NextResponse.json(goal, { status: 201 });
}
