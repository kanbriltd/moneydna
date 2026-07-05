import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/requireUser";
import { parseStatement, ParseError } from "@/lib/parsers";
import { categorizeTransaction, detectMpesaChannel } from "@/lib/categorize";
import { detectAnomalies } from "@/lib/anomalies";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File is too large (25MB max)." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = await parseStatement(buffer, file.name, file.type);
  } catch (err) {
    const message = err instanceof ParseError ? err.message : "Couldn't parse this file.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const { txns, sourceType } = parsed;

  const enriched = txns.map((t) => ({
    ...t,
    category: categorizeTransaction(t.description, t.counterparty ?? null, t.direction),
    channel: sourceType === "mpesa" ? detectMpesaChannel(t.description) : null,
  }));

  const flags = detectAnomalies(enriched);
  const flagByIndex = new Map(flags.map((f) => [f.index, f]));

  const statement = await prisma.statement.create({
    data: { userId, fileName: file.name, sourceType, status: "done", txnCount: enriched.length },
  });

  await prisma.transaction.createMany({
    data: enriched.map((t, i) => ({
      userId,
      statementId: statement.id,
      date: t.date,
      description: t.description,
      counterparty: t.counterparty ?? null,
      amount: t.amount,
      direction: t.direction,
      category: t.category,
      channel: t.channel,
      rawRef: t.rawRef ?? null,
      balanceAfter: t.balanceAfter ?? null,
      isAnomaly: flagByIndex.has(i),
      anomalyReason: flagByIndex.get(i)?.reason ?? null,
      anomalySeverity: flagByIndex.get(i)?.severity ?? null,
    })),
  });

  const totalIn = enriched.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0);
  const totalOut = enriched.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0);
  const dates = enriched.map((t) => t.date.getTime());

  return NextResponse.json({
    statementId: statement.id,
    sourceType,
    txnCount: enriched.length,
    anomalyCount: flags.length,
    totalIn,
    totalOut,
    periodStart: dates.length ? new Date(Math.min(...dates)) : null,
    periodEnd: dates.length ? new Date(Math.max(...dates)) : null,
  });
}
