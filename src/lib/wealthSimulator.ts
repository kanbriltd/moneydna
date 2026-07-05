/**
 * MoneyDNA — Future Wealth Simulator (pure, deterministic math)
 * ------------------------------------------------------------
 * No network, no side effects — safe to import on client OR server.
 * Turns a monthly contribution into a projected future value, and ALWAYS
 * returns a low/base/high band + explicit assumptions so the UI never shows
 * a single fake-precise number (see the guardrails spec: FALSE_PRECISION).
 */

export interface WealthAssumptions {
  annualReturnPct: number; // nominal, e.g. 10
  years: number;
  monthly: number;
  startingAmount: number;
}

export interface WealthPoint {
  year: number;
  contributed: number; // cumulative money you put in
  value: number; // projected balance (base case)
}

export interface WealthProjection {
  monthly: number;
  years: number;
  startingAmount: number;
  totalContributed: number;
  base: number; // projected value at base return
  low: number; // conservative band
  high: number; // optimistic band
  growth: number; // base - totalContributed (the "free" money from compounding)
  series: WealthPoint[]; // per-year, base case (for charting)
  assumptions: string[];
}

/** Future value of a starting lump + monthly contributions at a monthly rate. */
function futureValue(monthly: number, months: number, annualPct: number, starting: number): number {
  const r = annualPct / 100 / 12;
  if (r === 0) return starting + monthly * months;
  const fvContribs = monthly * ((Math.pow(1 + r, months) - 1) / r);
  const fvStart = starting * Math.pow(1 + r, months);
  return fvContribs + fvStart;
}

export function projectWealth(input: Partial<WealthAssumptions> = {}): WealthProjection {
  const monthly = Math.max(0, input.monthly ?? 5000);
  const years = clampInt(input.years ?? 30, 1, 60);
  const annualReturnPct = clampNum(input.annualReturnPct ?? 10, 0, 30);
  const startingAmount = Math.max(0, input.startingAmount ?? 0);

  const months = years * 12;
  const base = futureValue(monthly, months, annualReturnPct, startingAmount);
  // Honest band: +/- 3 percentage points of return (floored at 1%).
  const low = futureValue(monthly, months, Math.max(1, annualReturnPct - 3), startingAmount);
  const high = futureValue(monthly, months, annualReturnPct + 3, startingAmount);
  const totalContributed = startingAmount + monthly * months;

  const series: WealthPoint[] = [];
  for (let y = 0; y <= years; y++) {
    series.push({
      year: y,
      contributed: Math.round(startingAmount + monthly * 12 * y),
      value: Math.round(futureValue(monthly, y * 12, annualReturnPct, startingAmount)),
    });
  }

  return {
    monthly,
    years,
    startingAmount,
    totalContributed: Math.round(totalContributed),
    base: Math.round(base),
    low: Math.round(low),
    high: Math.round(high),
    growth: Math.round(base - totalContributed),
    series,
    assumptions: [
      `Assumes a steady ${annualReturnPct}% average annual return (base case); the band shows ${Math.max(1, annualReturnPct - 3)}%–${annualReturnPct + 3}%.`,
      `Assumes you invest KES ${monthly.toLocaleString("en-US")} every month for ${years} years without withdrawing.`,
      "Figures are nominal (before inflation) and are illustrative, not a guarantee — real returns vary year to year.",
    ],
  };
}

/** One-line headline used on cards ("save X/month → ~KES Y by retirement"). */
export function retirementHeadline(monthly: number, years = 30, annualReturnPct = 10): number {
  return projectWealth({ monthly, years, annualReturnPct }).base;
}

function clampNum(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
}
function clampInt(v: number, lo: number, hi: number): number {
  return Math.round(clampNum(v, lo, hi));
}
