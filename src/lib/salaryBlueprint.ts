/**
 * MoneyDNA — Salary Blueprint™ (pure, deterministic allocation engine)
 * -------------------------------------------------------------------
 * Takes a monthly income (+ optional context) and returns an explainable,
 * auditable allocation across savings/investment/essentials/lifestyle, plus a
 * "financial freedom" estimate as a RANGE (never a single fake-precise number).
 *
 * It BRANCHES on the user's real situation instead of blindly saying "save 20%":
 *   - lowIncome    : survival-first, tiny wins, no shaming
 *   - debtFirst    : high-interest debt triage before investing
 *   - irregular    : buffer-first, "% of whatever lands" framing
 *   - standard     : classic pay-yourself-first waterfall
 *
 * Pure & deterministic: no network, safe to import on client or server.
 */

export type IncomeType = "salaried" | "irregular";
export type BlueprintMode = "standard" | "lowIncome" | "debtFirst" | "irregular";

export interface BlueprintContext {
  incomeType?: IncomeType;
  highInterestDebt?: boolean; // Fuliza / Tala / Branch / shylock / credit-card style debt
  emergencyMonthsSaved?: number; // months of expenses already banked (0 if none)
  dependents?: boolean; // supports family / "black tax"
  age?: number; // optional, used only to express freedom as an age range
}

export interface Allocation {
  key: string;
  label: string;
  amount: number;
  pct: number; // % of income
  group: "save" | "essential" | "lifestyle" | "debt";
  color: string;
  rationale: string;
}

export interface FreedomEstimate {
  reachable: boolean;
  monthlyInvestable: number;
  fiNumber: number; // target nest-egg (25× annual essentials)
  lowYears: number | null; // optimistic-return path
  baseYears: number | null;
  highYears: number | null; // conservative-return path
  ageRange: [number, number] | null; // if age provided
  note: string;
}

export interface Blueprint {
  income: number;
  mode: BlueprintMode;
  headline: string;
  allocations: Allocation[];
  savingsPct: number; // total going to save+debt (money not consumed)
  freedom: FreedomEstimate;
  cautions: string[];
  assumptions: string[];
}

const COLORS = {
  emergency: "#34d399",
  mmf: "#2f81f7",
  sacco: "#a371f7",
  invest: "#22d3ee",
  debt: "#f87171",
  rent: "#f59e0b",
  food: "#fbbf24",
  transport: "#60a5fa",
  utilities: "#94a3b8",
  insurance: "#5eead4",
  lifestyle: "#c084fc",
};

/** % of income by bucket for each income band (standard salaried profile). */
function bandProfile(income: number) {
  if (income < 25_000)
    return { emergency: 5, mmf: 3, sacco: 2, rent: 30, food: 18, transport: 10, utilities: 7, insurance: 3 };
  if (income < 60_000)
    return { emergency: 6, mmf: 6, sacco: 4, rent: 28, food: 14, transport: 9, utilities: 6, insurance: 5 };
  if (income < 120_000)
    return { emergency: 5, mmf: 9, sacco: 4, rent: 26, food: 12, transport: 8, utilities: 5, insurance: 6 };
  return { emergency: 4, mmf: 12, sacco: 5, rent: 24, food: 10, transport: 7, utilities: 4, insurance: 6 };
}

export function buildBlueprint(incomeRaw: number, ctx: BlueprintContext = {}): Blueprint {
  const income = Math.max(0, Math.round(incomeRaw));
  const mode: BlueprintMode =
    income > 0 && income < 20_000
      ? "lowIncome"
      : ctx.highInterestDebt
      ? "debtFirst"
      : ctx.incomeType === "irregular"
      ? "irregular"
      : "standard";

  const p = bandProfile(income);
  const emergencyFunded = (ctx.emergencyMonthsSaved ?? 0) >= 3;

  // If the emergency fund is already stocked, redirect that share into investing.
  if (emergencyFunded) {
    p.mmf += p.emergency;
    p.emergency = 0;
  }

  const cautions: string[] = [];
  const alloc = (key: string, label: string, pct: number, group: Allocation["group"], color: string, rationale: string): Allocation => ({
    key,
    label,
    pct: round1(pct),
    amount: Math.round((pct / 100) * income),
    group,
    color,
    rationale,
  });

  const items: Allocation[] = [];

  // ---- essentials (shared across modes, capped) ----
  const essentials = [
    alloc("rent", "Rent / Housing", p.rent, "essential", COLORS.rent, "Kept at/under ~30% so housing never crowds out your future."),
    alloc("food", "Food", p.food, "essential", COLORS.food, "Groceries first, eating-out second — the cheapest lever you fully control."),
    alloc("transport", "Transport", p.transport, "essential", COLORS.transport, "Commute and fuel/fare."),
    alloc("utilities", "Utilities & Airtime", p.utilities, "essential", COLORS.utilities, "Power, water, data, airtime."),
    alloc("insurance", "Insurance & Health", p.insurance, "essential", COLORS.insurance, "SHA/medical + a small life/health cover — protection before wealth."),
  ];

  if (mode === "debtFirst") {
    // Redirect the would-be investment pool into clearing high-interest debt.
    const debtPct = p.mmf + p.sacco + 4; // investing share + a little from lifestyle
    items.push(
      alloc("emergency", "Mini Emergency Buffer", 5, "save", COLORS.emergency, "A small KES buffer so an emergency doesn't send you back to Fuliza."),
      alloc("debt", "High-Interest Debt Payoff", debtPct, "debt", COLORS.debt, "Clearing 100%+ APR debt is a GUARANTEED return no investment can beat — this comes before investing."),
      ...essentials
    );
    cautions.push(
      "You flagged high-interest debt (e.g. Fuliza/Tala). Paying it down beats investing — no fund reliably returns what those loans charge. Kill the debt first, then redirect this bucket into your MMF."
    );
  } else if (mode === "lowIncome") {
    items.push(
      alloc("emergency", "Emergency Fund", 5, "save", COLORS.emergency, "Even KES 500–1,000/month builds the buffer that keeps you off expensive loans."),
      alloc("mmf", "Money-Market Fund", 3, "save", COLORS.mmf, "Small, automatic, earning — the habit matters more than the amount right now."),
      ...essentials
    );
    cautions.push(
      "At this income, 'save 20%' isn't realistic or fair. The win here is a tiny, automatic amount that never stops — consistency now beats big numbers later."
    );
  } else if (mode === "irregular") {
    items.push(
      alloc("emergency", "Income Buffer", 15, "save", COLORS.emergency, "Irregular income needs a bigger cushion — bank a fat buffer in good months to cover lean ones."),
      alloc("mmf", "Money-Market Fund", 7, "save", COLORS.mmf, "Invest a % of whatever lands, the day it lands — not a fixed monthly figure."),
      alloc("sacco", "SACCO", 3, "save", COLORS.sacco, "Steady long-term savings + access to credit."),
      ...essentials
    );
    cautions.push(
      "Your income is irregular, so treat every bucket as a % of whatever actually lands that month — not a fixed monthly salary. Pay yourself the moment money arrives."
    );
  } else {
    items.push(
      alloc("emergency", emergencyFunded ? "Emergency Fund (funded ✓)" : "Emergency Fund", p.emergency, "save", COLORS.emergency, emergencyFunded ? "Already at 3+ months — redirected into investing." : "Priority #1: build 3–6 months of expenses before heavy investing."),
      alloc("mmf", "Money-Market Fund", p.mmf, "save", COLORS.mmf, "Liquid, ~9–11%/yr, ideal for the emergency fund and near-term goals."),
      alloc("sacco", "SACCO", p.sacco, "save", COLORS.sacco, "Long-term savings, dividends, and access to affordable credit."),
      ...essentials
    );
  }

  // ---- lifestyle absorbs the remainder so the plan always sums to 100% ----
  const usedPct = items.reduce((s, a) => s + a.pct, 0);
  let lifestylePct = round1(100 - usedPct);
  if (lifestylePct < 0) {
    cautions.push(
      "Your essentials alone exceed your income in this plan — the biggest lever is housing/transport. Trim there first; there's no lifestyle room until essentials fit."
    );
    lifestylePct = 0;
  }
  items.push(
    alloc("lifestyle", "Lifestyle & Fun", lifestylePct, "lifestyle", COLORS.lifestyle, "Guilt-free spending — a plan you can't enjoy is a plan you won't keep.")
  );
  if (ctx.dependents) {
    cautions.push(
      "You support family. That's real and valid — build a set 'family support' amount into your Lifestyle bucket so giving is intentional, not a leak that quietly sinks your own goals."
    );
  }

  const savingsPct = round1(items.filter((a) => a.group === "save" || a.group === "debt").reduce((s, a) => s + a.pct, 0));
  const monthlyInvestable = items.filter((a) => a.group === "save").reduce((s, a) => s + a.amount, 0);
  const annualEssentials = items.filter((a) => a.group === "essential").reduce((s, a) => s + a.amount, 0) * 12;

  const freedom = estimateFreedom(monthlyInvestable, annualEssentials, ctx.age);

  const headline =
    mode === "debtFirst"
      ? "Clear the debt first — then this plan builds real wealth"
      : mode === "lowIncome"
      ? "Small, automatic, unstoppable — your starter blueprint"
      : freedom.reachable && freedom.baseYears != null
      ? `On this plan, financial freedom in roughly ${freedom.baseYears}–${freedom.highYears} years`
      : "Your personalised money blueprint";

  return {
    income,
    mode,
    headline,
    allocations: items,
    savingsPct,
    freedom,
    cautions,
    assumptions: [
      "Allocation is a starting template based on income band and Kenyan norms — adjust to your real rent and commitments.",
      "Freedom estimate assumes you invest the full savings/investment buckets every month and reinvest returns.",
      "Uses the 25× annual-essentials rule (~4% withdrawal) with 7%/10%/13% return paths; figures are nominal and illustrative, not a promise.",
    ],
  };
}

/** Years for monthlyInvestable to reach 25× annual essentials, across return paths. */
function estimateFreedom(monthlyInvestable: number, annualEssentials: number, age?: number): FreedomEstimate {
  const fiNumber = Math.round(annualEssentials * 25);
  const yearsAt = (annualPct: number): number | null => {
    if (monthlyInvestable <= 0 || fiNumber <= 0) return null;
    const r = annualPct / 100 / 12;
    let balance = 0;
    for (let m = 1; m <= 60 * 12; m++) {
      balance = balance * (1 + r) + monthlyInvestable;
      if (balance >= fiNumber) return Math.round((m / 12) * 10) / 10;
    }
    return null; // not reachable within 60 years at this pace
  };

  const high = yearsAt(13); // optimistic return → fewer years
  const base = yearsAt(10);
  const low = yearsAt(7); // conservative return → more years
  const reachable = base != null;

  let ageRange: [number, number] | null = null;
  if (age && high != null && low != null) ageRange = [Math.round(age + high), Math.round(age + low)];

  return {
    reachable,
    monthlyInvestable: Math.round(monthlyInvestable),
    fiNumber,
    lowYears: low,
    baseYears: base,
    highYears: high,
    ageRange,
    note: reachable
      ? "This is one possible path, not a promise — the range reflects different market returns."
      : "At this monthly amount freedom is a long way off. Increasing what you invest each month is the single biggest lever.",
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
