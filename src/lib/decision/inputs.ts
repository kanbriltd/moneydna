/**
 * MoneyDNA — Daily Decision Engine: inputs
 * ----------------------------------------
 * Assembles the "decision context" the engine reasons over. Designed to work
 * across THREE data tiers so a brand-new user with no connected statement still
 * gets a real, useful decision on day one (manual-first):
 *
 *   Tier 1 — DNA + goal + manual money situation only  (day-one user)
 *   Tier 2 — + an optional manual daily check-in
 *   Tier 3 — + a connected statement (precise, high-confidence)
 *
 * The engine is ONE brain with a data-availability check — not three engines.
 */

export interface Traits {
  saver: number; // 0..100
  planner: number;
  impulse: number;
  risk: number;
  discipline: number;
}

export interface DecisionContext {
  name: string;
  dataTier: 1 | 2 | 3;
  hasStatement: boolean;
  dnaLabel: string | null;
  traits: Traits;
  goal: { name: string; target: number; current: number } | null;
  situation: {
    monthlyIncome: number | null;
    monthlySavings: number | null;
    paydayDay: number | null; // 1..31
    topExpenses: string[];
    hasDebt: boolean;
  };
  calendar: {
    todayISO: string; // YYYY-MM-DD
    dayOfWeek: number; // 0=Sun .. 6=Sat
    isWeekend: boolean;
    daysSincePayday: number | null;
  };
  yesterdayKind: string | null; // for light anti-repetition
}

export const DEFAULT_TRAITS: Traits = { saver: 50, planner: 50, impulse: 50, risk: 50, discipline: 50 };

/** Days since the most recent payday, given a day-of-month payday (1..31). */
export function daysSincePayday(paydayDay: number | null, today = new Date()): number | null {
  if (!paydayDay || paydayDay < 1 || paydayDay > 31) return null;
  const d = today.getDate();
  if (d >= paydayDay) return d - paydayDay;
  // last month's payday
  const prev = new Date(today.getFullYear(), today.getMonth(), 0).getDate(); // days in prev month
  const effectivePay = Math.min(paydayDay, prev);
  return d + (prev - effectivePay);
}

/** A sensible daily nudge amount: ~1% of monthly income, clamped. */
export function suggestedDailyAmount(income: number | null): number {
  const base = income && income > 0 ? income * 0.01 : 500;
  const rounded = Math.round(base / 50) * 50;
  return Math.min(2000, Math.max(100, rounded));
}

export function isoDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
