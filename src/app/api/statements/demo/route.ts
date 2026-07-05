import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { seedDemoData } from "@/lib/demoData";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Clear any prior demo data for idempotency if the user retries.
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.statement.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });

  const result = await seedDemoData(userId);
  return NextResponse.json(result);
}
