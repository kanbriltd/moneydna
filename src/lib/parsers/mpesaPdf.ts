import { ParsedTxn, ParseError } from "./types";

// @ts-expect-error -- subpath import bypasses pdf-parse's index.js debug-mode self-test block
import pdfParseLib from "pdf-parse/lib/pdf-parse.js";

const pdfParse = pdfParseLib as (buf: Buffer) => Promise<{ text: string }>;

// Safaricom M-PESA statement rows: Receipt No | Completion Time | Details | Status | Paid In | Withdrawn | Balance
const ROW_RE =
  /^([A-Z0-9]{8,12})\s+(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(?::\d{2})?|\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+(.+?)\s+(Completed|COMPLETED)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/;

function parseAmount(s: string): number {
  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseCompletionDate(s: string): Date | null {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (iso) {
    const [, y, m, d, hh, mm, ss] = iso;
    return new Date(+y, +m - 1, +d, +hh, +mm, ss ? +ss : 0);
  }
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (dmy) {
    const [, d, m, y, hh, mm, ss] = dmy;
    let year = +y;
    if (year < 100) year += 2000;
    return new Date(year, +m - 1, +d, +hh, +mm, ss ? +ss : 0);
  }
  return null;
}

export async function parseMpesaPdf(buffer: Buffer): Promise<ParsedTxn[]> {
  let text: string;
  try {
    const result = await pdfParse(buffer);
    text = result.text;
  } catch {
    throw new ParseError("Couldn't read this PDF. Make sure it's not a scanned image and isn't password-protected.");
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const txns: ParsedTxn[] = [];

  for (const line of lines) {
    const m = ROW_RE.exec(line);
    if (!m) continue;
    const [, receipt, when, details, , paidIn, withdrawn, balance] = m;
    const date = parseCompletionDate(when);
    if (!date) continue;
    const inAmt = parseAmount(paidIn);
    const outAmt = parseAmount(withdrawn);
    if (inAmt === 0 && outAmt === 0) continue;

    txns.push({
      date,
      description: details.trim(),
      counterparty: null,
      amount: inAmt > 0 ? inAmt : outAmt,
      direction: inAmt > 0 ? "in" : "out",
      rawRef: receipt,
      balanceAfter: parseAmount(balance),
    });
  }

  if (txns.length < 3) {
    throw new ParseError(
      "Couldn't find a recognizable M-PESA statement table in this PDF. Try exporting it as CSV/Excel from the M-PESA app, or upload a bank-format PDF instead."
    );
  }

  return txns;
}
