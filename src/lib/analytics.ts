import { prisma } from "@/lib/prisma";
import { CATEGORY_COLORS, CHANNEL_COLORS } from "@/lib/categories";
import { hasReliableTime } from "@/lib/dateUtils";
import { detectLeaks, type Leak } from "@/lib/leaks";
import type { Transaction } from "@prisma/client";

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}
function daysInMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate();
}
function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}
// Collapses -0 (and tiny floating-point dust around zero) to a clean 0, so
// formatted output never shows a stray "-0" / "-0%" for break-even months.
function zeroSafe(n: number, epsilon = 0.005): number {
  return Math.abs(n) < epsilon ? 0 : n;
}
function mean(xs: number[]) {
  return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0;
}
function stddev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((v) => (v - m) ** 2)));
}

export interface AnalyticsResult {
  hasData: boolean;
  periodLabel: string;
  userName: string;
  businessName: string | null;
  streakMonths: number;
  kpis: {
    income: number;
    expenses: number;
    net: number;
    burnRate: number;
    incomeDeltaPct: number | null;
    expenseDeltaPct: number | null;
  };
  savingsRate: number;
  netWorth: number;
  health: { score: number; parts: { label: string; value: number; color: string }[] };
  stress: { score: number; level: "Low" | "Moderate" | "High" | "Critical"; parts: { label: string; value: number; color: string }[]; explanation: string };
  leaks: Leak[];
  lastKnownBalance: number | null;
  cashflowRiver: { labels: string[]; income: number[]; expenses: number[] };
  categories: { name: string; amount: number; widthPct: number; color: string }[];
  mpesaBreakdown: { label: string; pct: number; color: string }[];
  merchants: { rank: number; name: string; tag: string; amount: number; count: string; color: string }[];
  anomalies: { title: string; body: string; severity: "high" | "medium" | "low" }[];
  goals: { id: string; name: string; icon: string; color: string; current: number; target: number; progressPct: number }[];
  insights: { text: string; color: string }[];
  sunburst: { name: string; value: number; color: string; subs: { name: string; value: number }[] }[];
  sankey: {
    income: { name: string; value: number; color: string }[];
    outflow: { name: string; value: number; color: string }[];
  };
  heatmap: { date: string; amount: number }[];
  galaxy: { amount: number }[];
  dna: { traits: { name: string; value: number }[]; typeName: string; explanation: string };
  forecast: { horizonDays: number; projected: number; low: number; high: number }[];
}

const EMPTY: AnalyticsResult = {
  hasData: false,
  periodLabel: "",
  userName: "",
  businessName: null,
  streakMonths: 0,
  kpis: { income: 0, expenses: 0, net: 0, burnRate: 0, incomeDeltaPct: null, expenseDeltaPct: null },
  savingsRate: 0,
  netWorth: 0,
  health: { score: 0, parts: [] },
  stress: { score: 0, level: "Low", parts: [], explanation: "" },
  leaks: [],
  lastKnownBalance: null,
  cashflowRiver: { labels: [], income: [], expenses: [] },
  categories: [],
  mpesaBreakdown: [],
  merchants: [],
  anomalies: [],
  goals: [],
  insights: [],
  sunburst: [],
  sankey: { income: [], outflow: [] },
  heatmap: [],
  galaxy: [],
  dna: { traits: [], typeName: "", explanation: "" },
  forecast: [],
};

export async function getAnalytics(userId: string): Promise<AnalyticsResult> {
  const [user, txns, goals] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!user) return EMPTY;
  if (txns.length === 0) {
    return { ...EMPTY, hasData: false, userName: user.name, businessName: user.businessName };
  }

  const lastDate = txns[txns.length - 1].date;
  const curY = lastDate.getFullYear();
  const curM = lastDate.getMonth();
  const curTxns = txns.filter((t) => t.date.getFullYear() === curY && t.date.getMonth() === curM);

  const prevRef = new Date(curY, curM - 1, 1);
  const prevTxns = txns.filter((t) => t.date.getFullYear() === prevRef.getFullYear() && t.date.getMonth() === prevRef.getMonth());

  const sum = (arr: Transaction[], dir: "in" | "out") => arr.filter((t) => t.direction === dir).reduce((s, t) => s + t.amount, 0);

  const income = sum(curTxns, "in");
  const expenses = sum(curTxns, "out");
  const net = zeroSafe(income - expenses);
  const burnRate = expenses / daysInMonth(curY, curM);
  const prevIncome = sum(prevTxns, "in");
  const prevExpenses = sum(prevTxns, "out");
  const savingsRate = income > 0 ? zeroSafe(clamp((net / income) * 100, -100, 100)) : 0;

  // ---------- 12-month cashflow river ----------
  const byMonth = new Map<string, { income: number; expenses: number; y: number; m: number }>();
  for (const t of txns) {
    const key = monthKey(t.date);
    if (!byMonth.has(key)) byMonth.set(key, { income: 0, expenses: 0, y: t.date.getFullYear(), m: t.date.getMonth() });
    const bucket = byMonth.get(key)!;
    if (t.direction === "in") bucket.income += t.amount;
    else bucket.expenses += t.amount;
  }
  const riverMonths: { y: number; m: number; income: number; expenses: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(curY, curM - i, 1);
    const bucket = byMonth.get(monthKey(d));
    riverMonths.push({ y: d.getFullYear(), m: d.getMonth(), income: bucket?.income ?? 0, expenses: bucket?.expenses ?? 0 });
  }

  // ---------- health score (7 weighted signals) ----------
  const monthlyIncomes = riverMonths.map((r) => r.income).filter((v) => v > 0);
  const monthlyNets = riverMonths.map((r) => r.income - r.expenses);
  const incomeCV = mean(monthlyIncomes) > 0 ? stddev(monthlyIncomes) / mean(monthlyIncomes) : 1;
  const netCV = mean(monthlyNets.map(Math.abs)) > 0 ? stddev(monthlyNets) / (mean(monthlyNets.map(Math.abs)) || 1) : 1;

  const dailySpend = new Map<string, number>();
  for (const t of curTxns) {
    if (t.direction !== "out") continue;
    const k = t.date.toISOString().slice(0, 10);
    dailySpend.set(k, (dailySpend.get(k) ?? 0) + t.amount);
  }
  const dailyVals = Array.from(dailySpend.values());
  const spendCV = mean(dailyVals) > 0 ? stddev(dailyVals) / mean(dailyVals) : 0;

  const loanSpend = curTxns.filter((t) => t.category === "Loans" && t.direction === "out").reduce((s, t) => s + t.amount, 0);
  const debtRatio = income > 0 ? loanSpend / income : 0;

  const recurringSpend = curTxns
    .filter((t) => ["Subscriptions", "Bills", "Utilities"].includes(t.category) && t.direction === "out")
    .reduce((s, t) => s + t.amount, 0);
  const recurringRatio = expenses > 0 ? recurringSpend / expenses : 0;

  const emergencyGoal = goals.find((g) => /emergency/i.test(g.name));
  const emergencyCoverage = emergencyGoal ? clamp((emergencyGoal.currentAmount / (expenses * 3 || 1)) * 100) : 40;

  const healthParts = [
    { label: "Savings behaviour", value: clamp((savingsRate / 30) * 100), color: "#34d399" },
    { label: "Income consistency", value: clamp(100 - incomeCV * 140), color: "#34d399" },
    { label: "Debt ratio", value: clamp(100 - debtRatio * 300), color: "#3b82f6" },
    { label: "Spending volatility", value: clamp(100 - spendCV * 60), color: "#f59e0b" },
    { label: "Cashflow stability", value: clamp(100 - netCV * 80), color: "#22d3ee" },
    { label: "Recurring expenses", value: clamp(100 - Math.max(0, recurringRatio - 0.12) * 250), color: "#a371f7" },
    { label: "Emergency fund", value: emergencyCoverage, color: "#f87171" },
  ];
  const weights = [0.22, 0.16, 0.14, 0.14, 0.14, 0.1, 0.1];
  const score = Math.round(healthParts.reduce((s, p, i) => s + p.value * weights[i], 0));

  // ---------- financial stress index (inverse framing of the same signals) ----------
  const stressParts = [
    { label: "Debt pressure", value: clamp(debtRatio * 300), color: "#f87171" },
    { label: "Income instability", value: clamp(incomeCV * 140), color: "#f59e0b" },
    { label: "Cashflow instability", value: clamp(netCV * 80), color: "#f59e0b" },
    { label: "Low savings buffer", value: clamp(100 - (savingsRate / 30) * 100), color: "#fb923c" },
    { label: "Weak emergency fund", value: clamp(100 - emergencyCoverage), color: "#f87171" },
    { label: "Fixed obligation load", value: clamp(Math.max(0, recurringRatio - 0.12) * 250), color: "#a371f7" },
  ];
  const stressWeights = [0.22, 0.16, 0.16, 0.18, 0.16, 0.12];
  const stressScore = Math.round(stressParts.reduce((s, p, i) => s + p.value * stressWeights[i], 0));
  const stressLevel: "Low" | "Moderate" | "High" | "Critical" =
    stressScore >= 75 ? "Critical" : stressScore >= 55 ? "High" : stressScore >= 30 ? "Moderate" : "Low";
  const topStressFactor = [...stressParts].sort((a, b) => b.value - a.value)[0];
  const stressExplanation =
    stressScore < 30
      ? "Your finances are in a stable place this month — no single pressure point stands out."
      : `Your biggest pressure point is ${topStressFactor.label.toLowerCase()} — easing that would do the most to lower your stress score.`;

  // ---------- money leak detector ----------
  const leaks = detectLeaks(curTxns, txns, expenses);

  // ---------- last known balance (from most recent transaction with a recorded balance) ----------
  let lastKnownBalance: number | null = null;
  for (let i = txns.length - 1; i >= 0; i--) {
    if (txns[i].balanceAfter != null) {
      lastKnownBalance = txns[i].balanceAfter;
      break;
    }
  }

  // ---------- categories ----------
  const catMap = new Map<string, number>();
  for (const t of curTxns) {
    if (t.direction !== "out") continue;
    catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount);
  }
  const catEntries = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries[0]?.[1] ?? 1;
  const categories = catEntries.slice(0, 6).map(([name, amount]) => ({
    name,
    amount,
    widthPct: clamp((amount / maxCat) * 100),
    color: CATEGORY_COLORS[name] ?? "#64748b",
  }));

  // ---------- M-PESA breakdown ----------
  const channelTxns = curTxns.filter((t) => t.channel);
  const chanMap = new Map<string, number>();
  for (const t of channelTxns) chanMap.set(t.channel!, (chanMap.get(t.channel!) ?? 0) + 1);
  const mpesaBreakdown = Array.from(chanMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, pct: Math.round((count / channelTxns.length) * 100), color: CHANNEL_COLORS[label] ?? "#64748b" }));

  // ---------- top merchants ----------
  const merchMap = new Map<string, { amount: number; count: number; category: string }>();
  for (const t of curTxns) {
    if (t.direction !== "out") continue;
    const name = t.counterparty || t.description;
    if (!merchMap.has(name)) merchMap.set(name, { amount: 0, count: 0, category: t.category });
    const b = merchMap.get(name)!;
    b.amount += t.amount;
    b.count += 1;
  }
  const merchants = Array.from(merchMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 6)
    .map(([name, v], i) => ({
      rank: i + 1,
      name,
      tag: v.category,
      amount: v.amount,
      count: `${v.count} txn${v.count === 1 ? "" : "s"}`,
      color: CATEGORY_COLORS[v.category] ?? "#64748b",
    }));

  // ---------- anomalies ----------
  const anomalies = curTxns
    .filter((t) => t.isAnomaly)
    .sort((a) => (a.anomalySeverity === "high" ? -1 : 1))
    .slice(0, 6)
    .map((t) => ({
      title: t.anomalyReason?.split(" — ")[0] ?? "Unusual transaction",
      body: `${t.anomalyReason?.split(" — ")[1] ?? t.anomalyReason ?? ""} (${t.description}, ${kesShort(t.amount)})`,
      severity: (t.anomalySeverity as "high" | "medium" | "low") ?? "low",
    }));

  // ---------- goals ----------
  const goalsOut = goals.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    color: g.color,
    current: g.currentAmount,
    target: g.targetAmount,
    progressPct: clamp((g.currentAmount / g.targetAmount) * 100),
  }));

  // ---------- insights ----------
  const insights = buildInsights({ income, expenses, savingsRate, recurringSpend, curTxns });

  // ---------- sunburst (category -> top merchants as sub-slices) ----------
  const sunburst = categories.map((c) => {
    const subMap = new Map<string, number>();
    for (const t of curTxns) {
      if (t.direction !== "out" || t.category !== c.name) continue;
      const key = t.counterparty || t.description;
      subMap.set(key, (subMap.get(key) ?? 0) + t.amount);
    }
    const subs = Array.from(subMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value]) => ({ name, value }));
    return { name: c.name, value: c.amount, color: c.color, subs };
  });

  // ---------- sankey ----------
  const incomeSources = new Map<string, number>();
  for (const t of curTxns) {
    if (t.direction !== "in") continue;
    incomeSources.set(t.category, (incomeSources.get(t.category) ?? 0) + t.amount);
  }
  const sankeyIncome = Array.from(incomeSources.entries()).map(([name, value], i) => ({
    name,
    value,
    color: ["#34d399", "#22d3ee", "#a371f7", "#2f81f7"][i % 4],
  }));
  const sankeyOutflow = [
    ...categories.slice(0, 5).map((c) => ({ name: c.name, value: c.amount, color: c.color })),
    { name: "Saved", value: Math.max(0, net), color: "#34d399" },
  ];

  // ---------- heatmap (last 35 days) ----------
  const heatEnd = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const heatmap: { date: string; amount: number }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(heatEnd);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const amt = txns
      .filter((t) => t.direction === "out" && t.date.toISOString().slice(0, 10) === key)
      .reduce((s, t) => s + t.amount, 0);
    heatmap.push({ date: key, amount: amt });
  }

  // ---------- galaxy ----------
  const galaxy = curTxns.map((t) => ({ amount: t.amount }));

  // ---------- DNA radar ----------
  const dna = buildDna({ savingsRate, curTxns, expenses, income, healthParts, goalsOut });

  // ---------- forecast ----------
  const dailyNet = net / daysInMonth(curY, curM);
  const netVol = stddev(monthlyNets) || Math.abs(net) * 0.15;
  const baseline = riverMonths.reduce((s, r) => s + (r.income - r.expenses), 0);
  const forecast = [7, 30, 90].map((h) => {
    const projected = baseline + dailyNet * h;
    const band = (netVol / 30) * Math.sqrt(h);
    return { horizonDays: h, projected, low: projected - band, high: projected + band };
  });

  return {
    hasData: true,
    periodLabel: `${MONTH_NAMES[curM].toUpperCase()} ${curY}`,
    userName: user.name,
    businessName: user.businessName,
    streakMonths: user.streakMonths,
    kpis: {
      income,
      expenses,
      net,
      burnRate,
      incomeDeltaPct: prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : null,
      expenseDeltaPct: prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null,
    },
    savingsRate,
    netWorth: baseline,
    health: { score, parts: healthParts.slice(0, 4) },
    stress: { score: stressScore, level: stressLevel, parts: stressParts, explanation: stressExplanation },
    leaks,
    lastKnownBalance,
    cashflowRiver: {
      labels: riverMonths.map((r) => MONTH_LABELS[r.m]),
      income: riverMonths.map((r) => r.income),
      expenses: riverMonths.map((r) => r.expenses),
    },
    categories,
    mpesaBreakdown,
    merchants,
    anomalies,
    goals: goalsOut,
    insights,
    sunburst,
    sankey: { income: sankeyIncome, outflow: sankeyOutflow },
    heatmap,
    galaxy,
    dna,
    forecast,
  };
}

function kesShort(n: number) {
  return "KES " + Math.round(n).toLocaleString("en-US");
}

function buildInsights(args: {
  income: number;
  expenses: number;
  savingsRate: number;
  recurringSpend: number;
  curTxns: Transaction[];
}): { text: string; color: string }[] {
  const { income, expenses, savingsRate, recurringSpend, curTxns } = args;
  const out: { text: string; color: string }[] = [];

  if (income > 0) {
    out.push({
      text:
        savingsRate >= 20
          ? `Your savings rate hit ${savingsRate.toFixed(0)}% — above the 20% healthy benchmark.`
          : `Your savings rate is ${savingsRate.toFixed(0)}% — below the 20% healthy benchmark. Small cuts to your top categories would close the gap.`,
      color: savingsRate >= 20 ? "#34d399" : "#f59e0b",
    });
  }

  if (recurringSpend > 0) {
    out.push({
      text: `Recurring subscriptions & bills cost ${kesShort(recurringSpend)}/month. Cancelling two unused ones could save ${kesShort(recurringSpend * 0.25 * 12)} a year.`,
      color: "#f59e0b",
    });
  }

  const nightOut = curTxns.filter((t) => t.direction === "out" && hasReliableTime(t.date) && (t.date.getHours() >= 19 || t.date.getHours() < 1));
  const nightTotal = nightOut.reduce((s, t) => s + t.amount, 0);
  if (expenses > 0 && nightTotal > 0) {
    out.push({
      text: `Evening spending (7PM–1AM) is ${Math.round((nightTotal / expenses) * 100)}% of this month's expenses — your main impulse window.`,
      color: "#a371f7",
    });
  }

  const topCat = [...curTxns]
    .filter((t) => t.direction === "out")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});
  const [topName, topAmt] = Object.entries(topCat).sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  if (topName) {
    out.push({
      text: `${topName} is your biggest outflow at ${kesShort(topAmt)} this month — keep an eye on it as the business grows.`,
      color: "#3b82f6",
    });
  }

  return out.slice(0, 4);
}

function buildDna(args: {
  savingsRate: number;
  curTxns: Transaction[];
  expenses: number;
  income: number;
  healthParts: { label: string; value: number }[];
  goalsOut: { progressPct: number }[];
}) {
  const { savingsRate, curTxns, expenses, income, healthParts, goalsOut } = args;
  const out = curTxns.filter((t) => t.direction === "out");

  const investSpend = out.filter((t) => t.category === "Investments").reduce((s, t) => s + t.amount, 0);
  const bizSpend = out.filter((t) => ["Inventory & Stock", "Staff Salaries", "Business Income"].includes(t.category)).reduce((s, t) => s + t.amount, 0);
  const luxurySpend = out.filter((t) => ["Entertainment", "Shopping", "Travel", "Restaurants"].includes(t.category)).reduce((s, t) => s + t.amount, 0);
  const nightSpend = out.filter((t) => hasReliableTime(t.date) && (t.date.getHours() >= 22 || t.date.getHours() < 5)).reduce((s, t) => s + t.amount, 0);
  const disciplineVal = healthParts.find((p) => p.label === "Spending volatility")?.value ?? 50;
  const plannerVal = goalsOut.length ? clamp(mean(goalsOut.map((g) => g.progressPct))) : 40;

  const traits = [
    { name: "Saver", value: clamp((savingsRate / 30) * 100) },
    { name: "Investor", value: clamp(income > 0 ? (investSpend / income) * 500 : 15) },
    { name: "Discipline", value: clamp(disciplineVal) },
    { name: "Impulse", value: clamp(expenses > 0 ? (nightSpend / expenses) * 260 : 20) },
    { name: "Business", value: clamp(expenses > 0 ? (bizSpend / expenses) * 140 : 20) },
    { name: "Luxury", value: clamp(expenses > 0 ? (luxurySpend / expenses) * 260 : 15) },
    { name: "Planner", value: clamp(plannerVal) },
  ];

  const t = Object.fromEntries(traits.map((x) => [x.name, x.value]));
  let typeName = "The Balanced Spender";
  let explanation = "Your spending is spread evenly across essentials, lifestyle and saving — no single trait dominates.";

  if (t.Discipline >= 65 && t.Business >= 55 && t.Impulse < 45) {
    typeName = "The Disciplined Builder";
    explanation = "You reinvest in your business, resist impulse buys, and consistently set money aside.";
  } else if (t.Impulse >= 60) {
    typeName = "The Spontaneous Spender";
    explanation = "A large share of your spending happens late at night or on impulse — small guardrails could unlock real savings.";
  } else if (t.Investor >= 55) {
    typeName = "The Growth Investor";
    explanation = "You consistently move money into investments — your wealth is working as hard as you are.";
  } else if (t.Luxury >= 55) {
    typeName = "The Lifestyle Enthusiast";
    explanation = "Dining, shopping and travel take a meaningful share of your budget — intentional, as long as savings keep pace.";
  } else if (t.Saver >= 70) {
    typeName = "The Diligent Saver";
    explanation = "You consistently keep a healthy share of income aside, month after month.";
  } else if (t.Planner >= 65) {
    typeName = "The Master Planner";
    explanation = "Your goals are well funded and on track — you plan ahead rather than react.";
  }

  if (t.Impulse >= 40 && typeName !== "The Spontaneous Spender") {
    explanation += " Your one watch-out: late-night spending nudges your impulse score up.";
  }

  return { traits, typeName, explanation };
}
