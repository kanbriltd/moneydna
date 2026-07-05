import { hasReliableTime } from "@/lib/dateUtils";
import type { Transaction } from "@prisma/client";

export interface Leak {
  id: string;
  title: string;
  description: string;
  monthlyEstimate: number;
  annualEstimate: number;
  severity: "high" | "medium" | "low";
  icon: string;
}

function mean(xs: number[]) {
  return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0;
}

function severityFor(annualEstimate: number, expenses: number): "high" | "medium" | "low" {
  if (expenses <= 0) return "low";
  const ratio = annualEstimate / 12 / expenses;
  if (ratio >= 0.08) return "high";
  if (ratio >= 0.03) return "medium";
  return "low";
}

/**
 * Ranks recurring "money leaks" for the current month, each with an estimated
 * annual cost if the pattern continues. `curTxns` is the current-month window;
 * `allTxns` (full history, ascending by date) is used for trend-based leaks
 * (lifestyle creep) that need a prior baseline.
 */
export function detectLeaks(curTxns: Transaction[], allTxns: Transaction[], expenses: number): Leak[] {
  const leaks: Leak[] = [];
  const out = curTxns.filter((t) => t.direction === "out");

  // 1) Subscription waste
  const subSpend = out.filter((t) => t.category === "Subscriptions").reduce((s, t) => s + t.amount, 0);
  if (subSpend > 0) {
    leaks.push({
      id: "subscriptions",
      title: "Subscription waste",
      description: `You're spending ${kes(subSpend)}/month across subscriptions. Cancelling unused ones is the fastest leak to plug.`,
      monthlyEstimate: subSpend,
      annualEstimate: subSpend * 12,
      severity: severityFor(subSpend * 12, expenses),
      icon: "🔁",
    });
  }

  // 2) Fuliza dependence
  const fulizaSpend = out.filter((t) => t.channel === "Fuliza").reduce((s, t) => s + t.amount, 0);
  if (fulizaSpend > 0) {
    leaks.push({
      id: "fuliza",
      title: "Fuliza dependence",
      description: `${kes(fulizaSpend)} in Fuliza overdraft this month — the fees compound fast if this becomes a habit.`,
      monthlyEstimate: fulizaSpend,
      annualEstimate: fulizaSpend * 12,
      severity: "high",
      icon: "⚠️",
    });
  }

  // 3) High transaction fees / charges
  const feeSpend = out.filter((t) => /\b(charge|fee)s?\b/i.test(t.description)).reduce((s, t) => s + t.amount, 0);
  if (feeSpend > 0) {
    leaks.push({
      id: "fees",
      title: "Transaction fees",
      description: `${kes(feeSpend)} lost to transaction charges this month — batching transfers can cut this down.`,
      monthlyEstimate: feeSpend,
      annualEstimate: feeSpend * 12,
      severity: severityFor(feeSpend * 12, expenses),
      icon: "💸",
    });
  }

  // 4) Tiny frequent purchases
  const tiny = out.filter((t) => t.amount < 300);
  if (tiny.length >= 15) {
    const tinySum = tiny.reduce((s, t) => s + t.amount, 0);
    leaks.push({
      id: "tiny-purchases",
      title: "Tiny frequent purchases",
      description: `${tiny.length} purchases under KES 300 added up to ${kes(tinySum)} this month — small, but it compounds.`,
      monthlyEstimate: tinySum,
      annualEstimate: tinySum * 12,
      severity: severityFor(tinySum * 12, expenses),
      icon: "🪙",
    });
  }

  // 5) Weekend overspending
  const weekday = out.filter((t) => t.date.getDay() >= 1 && t.date.getDay() <= 5);
  const weekend = out.filter((t) => t.date.getDay() === 0 || t.date.getDay() === 6);
  const weekdayDailyAvg = mean(Object.values(groupByDay(weekday)));
  const weekendDailyAvg = mean(Object.values(groupByDay(weekend)));
  if (weekendDailyAvg > weekdayDailyAvg * 1.3 && weekendDailyAvg > 0) {
    const excess = (weekendDailyAvg - weekdayDailyAvg) * 104; // ~104 weekend days/year
    leaks.push({
      id: "weekend-overspend",
      title: "Weekend overspending",
      description: `You spend ${kes(weekendDailyAvg)}/day on weekends vs ${kes(weekdayDailyAvg)}/day on weekdays — that gap alone.`,
      monthlyEstimate: excess / 12,
      annualEstimate: excess,
      severity: severityFor(excess, expenses),
      icon: "🎉",
    });
  }

  // 6) Late-night spending
  const night = out.filter((t) => hasReliableTime(t.date) && (t.date.getHours() >= 22 || t.date.getHours() < 5));
  const nightSum = night.reduce((s, t) => s + t.amount, 0);
  if (nightSum > 0) {
    leaks.push({
      id: "late-night",
      title: "Late-night spending",
      description: `${kes(nightSum)} spent between 10PM–5AM this month — your highest-risk window for impulse buys.`,
      monthlyEstimate: nightSum,
      annualEstimate: nightSum * 12,
      severity: severityFor(nightSum * 12, expenses),
      icon: "🌙",
    });
  }

  // 7) Duplicate spending
  const dupes = curTxns.filter((t) => t.isAnomaly && /duplicate/i.test(t.anomalyReason ?? ""));
  const dupeSum = dupes.reduce((s, t) => s + t.amount, 0);
  if (dupeSum > 0) {
    leaks.push({
      id: "duplicates",
      title: "Duplicate charges",
      description: `${kes(dupeSum)} billed twice this month across ${dupes.length} transaction${dupes.length === 1 ? "" : "s"} — worth disputing.`,
      monthlyEstimate: dupeSum,
      annualEstimate: dupeSum * 12,
      severity: "high",
      icon: "🧾",
    });
  }

  // 8) Lifestyle creep — discretionary spend trending up vs 3 months ago
  const discretionary = ["Entertainment", "Shopping", "Restaurants", "Travel"];
  const curDiscretionary = out.filter((t) => discretionary.includes(t.category)).reduce((s, t) => s + t.amount, 0);
  const curMonthKey = `${curTxns[0]?.date.getFullYear()}-${curTxns[0]?.date.getMonth()}`;
  const priorRef = curTxns[0] ? new Date(curTxns[0].date.getFullYear(), curTxns[0].date.getMonth() - 3, 1) : null;
  const priorDiscretionary = priorRef
    ? allTxns
        .filter(
          (t) =>
            t.direction === "out" &&
            discretionary.includes(t.category) &&
            t.date.getFullYear() === priorRef.getFullYear() &&
            t.date.getMonth() === priorRef.getMonth() &&
            `${t.date.getFullYear()}-${t.date.getMonth()}` !== curMonthKey
        )
        .reduce((s, t) => s + t.amount, 0)
    : 0;
  if (priorDiscretionary > 0 && curDiscretionary > priorDiscretionary * 1.15) {
    const delta = curDiscretionary - priorDiscretionary;
    leaks.push({
      id: "lifestyle-creep",
      title: "Lifestyle creep",
      description: `Discretionary spend (entertainment, shopping, dining, travel) is up ${Math.round(((curDiscretionary - priorDiscretionary) / priorDiscretionary) * 100)}% vs 3 months ago.`,
      monthlyEstimate: delta,
      annualEstimate: delta * 12,
      severity: severityFor(delta * 12, expenses),
      icon: "📈",
    });
  }

  // 9) Salary-day splurging
  const salaryDates = curTxns.filter((t) => t.direction === "in" && ["Salary", "Business Income"].includes(t.category)).map((t) => t.date);
  const dailyOutAvg = mean(Object.values(groupByDay(out)));
  let splurge = 0;
  for (const sd of salaryDates) {
    const windowEnd = new Date(sd);
    windowEnd.setDate(windowEnd.getDate() + 3);
    const windowSpend = out.filter((t) => t.date >= sd && t.date <= windowEnd).reduce((s, t) => s + t.amount, 0);
    const expected = dailyOutAvg * 3;
    if (windowSpend > expected * 1.4) splurge += windowSpend - expected;
  }
  if (splurge > 0) {
    leaks.push({
      id: "salary-splurge",
      title: "Salary-day splurging",
      description: `You spend noticeably more in the 3 days right after income lands — ${kes(splurge)} above your usual pace this month.`,
      monthlyEstimate: splurge,
      annualEstimate: splurge * 12,
      severity: severityFor(splurge * 12, expenses),
      icon: "💳",
    });
  }

  return leaks.sort((a, b) => b.annualEstimate - a.annualEstimate).slice(0, 8);
}

function groupByDay(txns: Transaction[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of txns) {
    const k = t.date.toISOString().slice(0, 10);
    map[k] = (map[k] ?? 0) + t.amount;
  }
  return map;
}

function kes(n: number): string {
  return "KES " + Math.round(n).toLocaleString("en-US");
}
