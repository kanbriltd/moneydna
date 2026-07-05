import { prisma } from "@/lib/prisma";

export interface WhatIfScenario {
  extraMonthlySavings: number;
  stopFuliza: boolean;
  incomeChangePct: number;
  rentChangePct: number;
  monthlyInvestment: number;
  investmentAnnualReturnPct: number;
}

export const DEFAULT_SCENARIO: WhatIfScenario = {
  extraMonthlySavings: 0,
  stopFuliza: false,
  incomeChangePct: 0,
  rentChangePct: 0,
  monthlyInvestment: 0,
  investmentAnnualReturnPct: 10,
};

export interface WhatIfPoint {
  month: number;
  baseline: number;
  projected: number;
}

export interface WhatIfResult {
  hasData: boolean;
  horizonMonths: number;
  incomeMonthlyAvg: number;
  fulizaMonthlyAvg: number;
  rentMonthlyAvg: number;
  baselineMonthlyNet: number;
  /** Total monthly amount added to net worth under the scenario (cash + diverted investment, before compounding). */
  scenarioMonthlyNet: number;
  trajectory: WhatIfPoint[];
  summary: {
    baselineTotal: number;
    projectedTotal: number;
    delta: number;
    investmentValue: number;
  };
}

function emptyResult(horizonMonths: number): WhatIfResult {
  return {
    hasData: false,
    horizonMonths,
    incomeMonthlyAvg: 0,
    fulizaMonthlyAvg: 0,
    rentMonthlyAvg: 0,
    baselineMonthlyNet: 0,
    scenarioMonthlyNet: 0,
    trajectory: [],
    summary: { baselineTotal: 0, projectedTotal: 0, delta: 0, investmentValue: 0 },
  };
}

/**
 * Projects a 12-month (default) net-worth trajectory under a user-chosen scenario,
 * averaged off the last up-to-3 calendar months of real transaction history.
 * `baseline` = current pattern held constant. `projected` = cash contribution
 * (after scenario levers) plus a separately-compounding monthly investment.
 */
export async function runWhatIf(userId: string, scenario: Partial<WhatIfScenario>, horizonMonths = 12): Promise<WhatIfResult> {
  const s: WhatIfScenario = { ...DEFAULT_SCENARIO, ...scenario };
  const txns = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: "asc" } });
  if (txns.length === 0) return emptyResult(horizonMonths);

  const monthKeys = Array.from(new Set(txns.map((t) => `${t.date.getFullYear()}-${t.date.getMonth()}`))).sort();
  const windowKeys = new Set(monthKeys.slice(-3));
  const windowTxns = txns.filter((t) => windowKeys.has(`${t.date.getFullYear()}-${t.date.getMonth()}`));
  const nMonths = windowKeys.size || 1;

  const sum = (pred: (t: (typeof txns)[number]) => boolean) => windowTxns.filter(pred).reduce((acc, t) => acc + t.amount, 0);

  const incomeMonthlyAvg = sum((t) => t.direction === "in") / nMonths;
  const expensesMonthlyAvg = sum((t) => t.direction === "out") / nMonths;
  const fulizaMonthlyAvg = sum((t) => t.direction === "out" && t.channel === "Fuliza") / nMonths;
  const rentMonthlyAvg = sum((t) => t.direction === "out" && t.category === "Rent") / nMonths;

  const baselineMonthlyNet = incomeMonthlyAvg - expensesMonthlyAvg;

  const incomeDelta = incomeMonthlyAvg * (s.incomeChangePct / 100);
  const rentDelta = rentMonthlyAvg * (s.rentChangePct / 100);
  const fulizaRemoved = s.stopFuliza ? fulizaMonthlyAvg : 0;

  const scenarioMonthlyNet = baselineMonthlyNet + incomeDelta - rentDelta + fulizaRemoved + s.extraMonthlySavings;
  const cashMonthlyNet = scenarioMonthlyNet - s.monthlyInvestment;
  const monthlyReturn = s.investmentAnnualReturnPct / 100 / 12;

  const trajectory: WhatIfPoint[] = [];
  let baselineCum = 0;
  let cashCum = 0;
  let investmentValue = 0;
  for (let m = 1; m <= horizonMonths; m++) {
    baselineCum += baselineMonthlyNet;
    cashCum += cashMonthlyNet;
    investmentValue = (investmentValue + s.monthlyInvestment) * (1 + monthlyReturn);
    trajectory.push({ month: m, baseline: baselineCum, projected: cashCum + investmentValue });
  }

  const projectedTotal = cashCum + investmentValue;
  return {
    hasData: true,
    horizonMonths,
    incomeMonthlyAvg,
    fulizaMonthlyAvg,
    rentMonthlyAvg,
    baselineMonthlyNet,
    scenarioMonthlyNet,
    trajectory,
    summary: {
      baselineTotal: baselineCum,
      projectedTotal,
      delta: projectedTotal - baselineCum,
      investmentValue,
    },
  };
}
