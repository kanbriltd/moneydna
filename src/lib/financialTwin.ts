import { prisma } from "@/lib/prisma";
import type { AnalyticsResult } from "@/lib/analytics";

export interface RecurringUpcoming {
  name: string;
  category: string;
  expectedAmount: number;
  expectedDate: string;
  confidence: "high" | "medium" | "low";
}

export interface CategoryForecastEntry {
  category: string;
  thisMonth: number;
  nextMonthProjected: number;
  trend: "up" | "down" | "flat";
}

export interface SavingsTrajectoryPoint {
  month: number;
  label: string;
  projected: number;
  low: number;
  high: number;
}

export interface FinancialTwin {
  hasData: boolean;
  asOf: string;
  depletionDate: string | null;
  depletionRisk: "none" | "low" | "medium" | "high";
  debtRiskScore: number;
  debtRiskLevel: "Low" | "Moderate" | "High" | "Critical";
  upcomingRecurring: RecurringUpcoming[];
  categoryForecast: CategoryForecastEntry[];
  savingsTrajectory: SavingsTrajectoryPoint[];
  explanation: string;
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}
function mean(xs: number[]) {
  return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0;
}
function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

const EMPTY: FinancialTwin = {
  hasData: false,
  asOf: "",
  depletionDate: null,
  depletionRisk: "none",
  debtRiskScore: 0,
  debtRiskLevel: "Low",
  upcomingRecurring: [],
  categoryForecast: [],
  savingsTrajectory: [],
  explanation: "",
};

/**
 * A predictive "digital clone" of the user's finances: projects cash depletion,
 * debt-risk trajectory, likely upcoming recurring bills, near-term category
 * spend, and a 6-month savings trajectory band — all derived from real
 * transaction history, no new schema required.
 */
export async function buildFinancialTwin(userId: string, analytics: AnalyticsResult): Promise<FinancialTwin> {
  if (!analytics.hasData) return EMPTY;

  const txns = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: "asc" } });
  if (txns.length === 0) return EMPTY;

  const lastDate = txns[txns.length - 1].date;
  const monthKeys = Array.from(new Set(txns.map((t) => monthKey(t.date)))).sort();
  const last3Keys = new Set(monthKeys.slice(-3));
  const last3Txns = txns.filter((t) => last3Keys.has(monthKey(t.date)));
  const nMonths = last3Keys.size || 1;

  const avgMonthlyIncome = last3Txns.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0) / nMonths;
  const avgMonthlyExpenses = last3Txns.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0) / nMonths;
  const avgMonthlyNet = avgMonthlyIncome - avgMonthlyExpenses;

  // ---------- cash depletion ----------
  const cash = analytics.lastKnownBalance ?? Math.max(0, analytics.netWorth);
  let depletionDate: string | null = null;
  let depletionRisk: "none" | "low" | "medium" | "high" = "none";
  if (avgMonthlyNet < 0) {
    const dailyDeficit = -avgMonthlyNet / 30;
    const daysLeft = dailyDeficit > 0 ? cash / dailyDeficit : Infinity;
    if (Number.isFinite(daysLeft)) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + Math.round(daysLeft));
      depletionDate = d.toISOString().slice(0, 10);
      depletionRisk = daysLeft < 14 ? "high" : daysLeft < 30 ? "medium" : "low";
    }
  }

  // ---------- debt risk ----------
  const debtPressure = analytics.stress.parts.find((p) => p.label === "Debt pressure")?.value ?? 0;
  const monthKeysArr = Array.from(last3Keys).sort();
  const fulizaByMonth = monthKeysArr.map(
    (k) => txns.filter((t) => t.direction === "out" && t.channel === "Fuliza" && monthKey(t.date) === k).reduce((s, t) => s + t.amount, 0)
  );
  const fulizaTrendingUp = fulizaByMonth.length >= 2 && fulizaByMonth[fulizaByMonth.length - 1] > fulizaByMonth[0] && fulizaByMonth[fulizaByMonth.length - 1] > 0;
  const fulizaRatio = avgMonthlyExpenses > 0 ? mean(fulizaByMonth) / avgMonthlyExpenses : 0;
  const debtRiskScore = Math.round(clamp(debtPressure * 0.55 + fulizaRatio * 100 * 3.5 + (fulizaTrendingUp ? 12 : 0)));
  const debtRiskLevel: "Low" | "Moderate" | "High" | "Critical" =
    debtRiskScore >= 75 ? "Critical" : debtRiskScore >= 55 ? "High" : debtRiskScore >= 30 ? "Moderate" : "Low";

  // ---------- upcoming recurring transactions ----------
  const groups = new Map<string, { category: string; dates: Date[]; amounts: number[] }>();
  for (const t of txns) {
    if (t.direction !== "out" || /\bcharge\b/i.test(t.description)) continue;
    const key = t.description.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, { category: t.category, dates: [], amounts: [] });
    const g = groups.get(key)!;
    g.dates.push(t.date);
    g.amounts.push(t.amount);
  }
  const upcomingRecurring: RecurringUpcoming[] = [];
  const horizon = new Date(lastDate);
  horizon.setDate(horizon.getDate() + 30);
  for (const [key, g] of groups) {
    if (g.dates.length < 3) continue;
    const sorted = [...g.dates].sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) intervals.push((sorted[i].getTime() - sorted[i - 1].getTime()) / 86_400_000);
    const medInterval = median(intervals);
    if (medInterval < 1 || medInterval > 100) continue;
    const lastOccurrence = sorted[sorted.length - 1];
    const expected = new Date(lastOccurrence);
    expected.setDate(expected.getDate() + Math.round(medInterval));
    if (expected < lastDate || expected > horizon) continue;
    const avgInterval = mean(intervals);
    const cv = avgInterval > 0 ? Math.sqrt(mean(intervals.map((v) => (v - avgInterval) ** 2))) / avgInterval : 1;
    upcomingRecurring.push({
      name: key.replace(/\b\w/g, (c) => c.toUpperCase()),
      category: g.category,
      expectedAmount: mean(g.amounts),
      expectedDate: expected.toISOString().slice(0, 10),
      confidence: cv < 0.15 ? "high" : cv < 0.4 ? "medium" : "low",
    });
  }
  upcomingRecurring.sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));

  // ---------- per-category next-month forecast ----------
  const categoryForecast: CategoryForecastEntry[] = analytics.categories.slice(0, 5).map((c) => {
    const perMonth = monthKeysArr.map((k) => txns.filter((t) => t.direction === "out" && t.category === c.name && monthKey(t.date) === k).reduce((s, t) => s + t.amount, 0));
    const thisMonth = c.amount;
    const prior = perMonth.slice(0, -1);
    const priorAvg = mean(prior.length ? prior : perMonth);
    const nextMonthProjected = mean(perMonth.length ? perMonth : [thisMonth]);
    const trend: "up" | "down" | "flat" = priorAvg <= 0 ? "flat" : thisMonth > priorAvg * 1.1 ? "up" : thisMonth < priorAvg * 0.9 ? "down" : "flat";
    return { category: c.name, thisMonth, nextMonthProjected, trend };
  });

  // ---------- 6-month savings trajectory ----------
  const savingsTrajectory: SavingsTrajectoryPoint[] = [];
  let cum = 0;
  const refMonth = lastDate.getMonth();
  const refYear = lastDate.getFullYear();
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let m = 1; m <= 6; m++) {
    cum += avgMonthlyNet;
    const band = Math.abs(cum) * 0.15;
    const d = new Date(refYear, refMonth + m, 1);
    savingsTrajectory.push({ month: m, label: MONTH_NAMES[d.getMonth()], projected: cum, low: cum - band, high: cum + band });
  }

  // ---------- explanation ----------
  let explanation: string;
  if (depletionRisk === "high") {
    explanation = `At the current pace, available cash could run low around ${depletionDate} — worth exploring options before then.`;
  } else if (debtRiskLevel === "High" || debtRiskLevel === "Critical") {
    explanation = `Debt risk is running ${debtRiskLevel.toLowerCase()}${fulizaTrendingUp ? ", and Fuliza usage is trending up" : ""} — one possibility worth exploring is easing that before it grows further.`;
  } else if (upcomingRecurring.length > 0) {
    explanation = `${upcomingRecurring.length} recurring payment${upcomingRecurring.length === 1 ? "" : "s"} likely due in the next 30 days, totalling ~${Math.round(upcomingRecurring.reduce((s, r) => s + r.expectedAmount, 0)).toLocaleString()} KES.`;
  } else {
    explanation = "Your projected trajectory looks steady — the current pattern seems sustainable.";
  }

  return {
    hasData: true,
    asOf: lastDate.toISOString().slice(0, 10),
    depletionDate,
    depletionRisk,
    debtRiskScore,
    debtRiskLevel,
    upcomingRecurring: upcomingRecurring.slice(0, 6),
    categoryForecast,
    savingsTrajectory,
    explanation,
  };
}
