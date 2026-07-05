import { ParsedTxn, ParseError } from "./types";

// @ts-expect-error -- subpath import bypasses pdf-parse's index.js debug-mode self-test block
import pdfParseLib from "pdf-parse/lib/pdf-parse.js";

const pdfParse = pdfParseLib as (buf: Buffer) => Promise<{ text: string }>;

const AMOUNT_TOKEN = /^-?\(?[\d,]+\.\d{2}\)?$/;

function toDate(tok: string): Date | null {
  const iso = tok.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const dmy = tok.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    let year = +dmy[3];
    if (year < 100) year += 2000;
    return new Date(year, +dmy[2] - 1, +dmy[1]);
  }
  return null;
}

function toAmount(tok: string): number {
  const neg = tok.startsWith("-") || (tok.startsWith("(") && tok.endsWith(")"));
  const n = parseFloat(tok.replace(/[(),-]/g, "").replace(/,/g, ""));
  return neg ? -n : n;
}

/**
 * Best-effort generic bank-statement PDF line parser: a line with a leading date
 * token and 1-3 trailing amount-looking tokens is treated as a transaction row
 * (description = the tokens between). Layouts vary a lot between banks, so this
 * is a fallback used only when the M-PESA-specific parser finds nothing.
 */
export async function parseGenericBankPdf(buffer: Buffer): Promise<ParsedTxn[]> {
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
    const tokens = line.split(/\s+/);
    if (tokens.length < 3) continue;
    const date = toDate(tokens[0]);
    if (!date) continue;

    const amountTokens: { idx: number; val: number }[] = [];
    for (let i = tokens.length - 1; i >= 1 && amountTokens.length < 3; i--) {
      if (AMOUNT_TOKEN.test(tokens[i])) amountTokens.push({ idx: i, val: toAmount(tokens[i]) });
      else if (amountTokens.length > 0) break;
    }
    if (amountTokens.length === 0) continue;
    amountTokens.reverse();

    const firstAmountIdx = amountTokens[0].idx;
    const description = tokens.slice(1, firstAmountIdx).join(" ").trim();
    if (!description) continue;

    // Layout guess: [amount] or [amount, balance] or [debit, credit, balance]
    let amount = 0;
    let direction: "in" | "out" = "out";
    let balanceAfter: number | null = null;

    if (amountTokens.length === 1) {
      amount = Math.abs(amountTokens[0].val);
      direction = amountTokens[0].val >= 0 ? "in" : "out";
    } else if (amountTokens.length === 2) {
      amount = Math.abs(amountTokens[0].val);
      direction = amountTokens[0].val >= 0 ? "in" : "out";
      balanceAfter = amountTokens[1].val;
    } else {
      const [debit, credit, balance] = amountTokens.map((a) => a.val);
      if (Math.abs(credit) > 0) {
        amount = Math.abs(credit);
        direction = "in";
      } else {
        amount = Math.abs(debit);
        direction = "out";
      }
      balanceAfter = balance;
    }
    if (amount === 0) continue;

    txns.push({ date, description, counterparty: null, amount, direction, rawRef: null, balanceAfter });
  }

  if (txns.length < 3) {
    throw new ParseError(
      "Couldn't find a recognizable transaction table in this PDF. Try exporting a CSV or Excel version of the statement instead."
    );
  }

  return txns;
}
