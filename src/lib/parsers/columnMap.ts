import { ParsedTxn } from "./types";

const DATE_KEYS = /^(date|txn ?date|transaction ?date|completion ?time|value ?date|posting ?date)$/i;
const DESC_KEYS = /^(description|details|narration|narrative|particulars|remarks?|memo)$/i;
const AMOUNT_KEYS = /^(amount|value)$/i;
const CREDIT_KEYS = /^(credit|paid ?in|money ?in|deposit|cr)$/i;
const DEBIT_KEYS = /^(debit|withdrawn|money ?out|withdrawal|dr)$/i;
const BALANCE_KEYS = /^(balance|running ?balance|closing ?balance)$/i;
const REF_KEYS = /^(ref(erence)?( ?no)?|receipt ?no|transaction ?id|cheque ?no)$/i;
const COUNTERPARTY_KEYS = /^(counterparty|payee|payer|other ?party|to\/from)$/i;

function findKey(headers: string[], re: RegExp): string | undefined {
  return headers.find((h) => re.test(h.trim()));
}

function parseNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const cleaned = String(v).replace(/[,\sKESkes]/g, "").replace(/^\((.+)\)$/, "-$1");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseDateValue(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    // Excel serial date
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(v).trim();
  const dmY = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dmY) {
    const [, d, m, y, hh, mm, ss] = dmY;
    let year = parseInt(y, 10);
    if (year < 100) year += 2000;
    const day = parseInt(d, 10);
    const month = parseInt(m, 10);
    // Heuristic: if "month" > 12 it's actually day-first ambiguity resolved already; if day > 31 impossible, swap.
    const date = new Date(year, month - 1, day, hh ? parseInt(hh, 10) : 0, mm ? parseInt(mm, 10) : 0, ss ? parseInt(ss, 10) : 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const iso = new Date(s);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

/**
 * Maps loosely-structured row objects (from CSV or Excel) into normalized transactions.
 * Handles both single Amount-column layouts (signed) and separate Debit/Credit layouts.
 */
export function mapRowsToTransactions(rows: Record<string, unknown>[]): ParsedTxn[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);

  const dateKey = findKey(headers, DATE_KEYS) ?? headers[0];
  const descKey = findKey(headers, DESC_KEYS);
  const amountKey = findKey(headers, AMOUNT_KEYS);
  const creditKey = findKey(headers, CREDIT_KEYS);
  const debitKey = findKey(headers, DEBIT_KEYS);
  const balanceKey = findKey(headers, BALANCE_KEYS);
  const refKey = findKey(headers, REF_KEYS);
  const counterpartyKey = findKey(headers, COUNTERPARTY_KEYS);

  const out: ParsedTxn[] = [];
  for (const row of rows) {
    const date = parseDateValue(row[dateKey]);
    if (!date) continue;

    let amount = 0;
    let direction: "in" | "out" = "out";

    if (creditKey || debitKey) {
      const credit = creditKey ? parseNumber(row[creditKey]) : 0;
      const debit = debitKey ? parseNumber(row[debitKey]) : 0;
      if (credit > 0) {
        amount = credit;
        direction = "in";
      } else if (debit > 0) {
        amount = debit;
        direction = "out";
      } else {
        continue;
      }
    } else if (amountKey) {
      const raw = parseNumber(row[amountKey]);
      if (raw === 0) continue;
      amount = Math.abs(raw);
      direction = raw > 0 ? "in" : "out";
    } else {
      continue;
    }

    const description = descKey ? String(row[descKey] ?? "").trim() : Object.values(row).find((v) => typeof v === "string") ?? "Transaction";

    out.push({
      date,
      description: String(description || "Transaction"),
      counterparty: counterpartyKey ? String(row[counterpartyKey] ?? "").trim() || null : null,
      amount,
      direction,
      rawRef: refKey ? String(row[refKey] ?? "").trim() || null : null,
      balanceAfter: balanceKey ? parseNumber(row[balanceKey]) : null,
    });
  }
  return out;
}
