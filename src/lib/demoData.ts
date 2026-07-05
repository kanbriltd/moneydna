import { prisma } from "@/lib/prisma";
import { detectAnomalies } from "@/lib/anomalies";
import type { Category } from "@/lib/categories";

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function daysInMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate();
}

function randomDateInMonth(rnd: () => number, year: number, month0: number, hourBias: () => number) {
  const day = 1 + Math.floor(rnd() * daysInMonth(year, month0));
  const hour = Math.floor(hourBias());
  const minute = Math.floor(rnd() * 60);
  const second = Math.floor(rnd() * 60);
  return new Date(year, month0, day, hour, minute, second);
}

function bizHour(rnd: () => number) {
  // Weighted toward 8am-9pm business hours, occasional evening/night tail.
  const r = rnd();
  if (r < 0.78) return 8 + rnd() * 13; // 8am-9pm
  if (r < 0.94) return 21 + rnd() * 3; // 9pm-midnight
  return rnd() * 5; // midnight-5am
}

/** Distributes `total` across `count` transactions with realistic jitter, summing exactly to total. */
function spread(rnd: () => number, total: number, count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [Math.round(total)];
  const raw = Array.from({ length: count }, () => 0.5 + rnd());
  const sumRaw = raw.reduce((s, v) => s + v, 0);
  const amounts = raw.map((v) => Math.round((v / sumRaw) * total));
  const diff = Math.round(total) - amounts.reduce((s, v) => s + v, 0);
  amounts[amounts.length - 1] += diff;
  return amounts;
}

interface DemoTxn {
  date: Date;
  description: string;
  counterparty: string | null;
  amount: number;
  direction: "in" | "out";
  category: Category;
  channel: string | null;
}

const MERCHANT_BUCKETS: {
  name: string;
  category: Category;
  channel: string;
  total: number;
  count: number;
  descTemplate: (n: string) => string;
}[] = [
  { name: "Bidco Suppliers", category: "Inventory & Stock", channel: "Buy Goods (Till)", total: 121000, count: 48, descTemplate: (n) => `Merchant Payment to ${n}` },
  { name: "General Wholesalers", category: "Inventory & Stock", channel: "Paybill", total: 191000, count: 42, descTemplate: (n) => `Pay Bill to ${n}` },
  { name: "Naivas Supermarket", category: "Groceries", channel: "Buy Goods (Till)", total: 84200, count: 31, descTemplate: (n) => `Merchant Payment to ${n}` },
  { name: "Shell Westlands", category: "Fuel", channel: "Buy Goods (Till)", total: 36400, count: 22, descTemplate: (n) => `Merchant Payment to ${n}` },
  { name: "Ola Energy", category: "Fuel", channel: "Buy Goods (Till)", total: 1600, count: 3, descTemplate: (n) => `Merchant Payment to ${n}` },
  { name: "Matatu & Bolt Rides", category: "Transport", channel: "Send Money", total: 40000, count: 34, descTemplate: () => "Transport fare" },
  { name: "Equity Bank", category: "Loans", channel: "Paybill", total: 72000, count: 1, descTemplate: (n) => `Pay Bill Online to ${n} Loan Repayment` },
  { name: "KPLC (Kenya Power)", category: "Utilities", channel: "Paybill", total: 38900, count: 2, descTemplate: (n) => `Pay Bill to ${n}` },
  { name: "Safaricom", category: "Airtime & Bundles", channel: "Airtime/Bundles", total: 22150, count: 18, descTemplate: () => "Airtime Purchase" },
  { name: "Estate Management", category: "Rent", channel: "Paybill", total: 95000, count: 1, descTemplate: (n) => `Pay Bill to ${n} Shop Rent` },
  { name: "DSTV", category: "Bills", channel: "Paybill", total: 9600, count: 1, descTemplate: (n) => `Pay Bill to ${n}` },
  { name: "Java House / Artcaffe", category: "Restaurants", channel: "Buy Goods (Till)", total: 24000, count: 14, descTemplate: (n) => `Merchant Payment to ${n}` },
  { name: "Miscellaneous", category: "Miscellaneous", channel: "Send Money", total: 34450, count: 18, descTemplate: () => "Customer Transfer" },
];

const STAFF = ["James Otieno", "Faith Wambui", "Peter Mwangi", "Grace Achieng"];

export async function seedDemoData(userId: string) {
  const rnd = mulberry(42);
  const now = new Date();
  // Most recently completed full calendar month is the "detailed" month.
  const detailed = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const incomeTrendRatio = [980, 1040, 995, 1120, 1080, 1185, 1150, 1210, 1175, 1240, 1260, 1284.5];
  const expenseTrendRatio = [870, 910, 890, 940, 905, 980, 950, 1000, 960, 1010, 1020, 947.3];

  const detailedIncome = 1284500;
  const detailedExpense = 947300;

  const allTxns: DemoTxn[] = [];

  // ---- prior 11 months: lighter aggregate-level history for the cashflow trend ----
  for (let i = 0; i < 11; i++) {
    const m = new Date(detailed.getFullYear(), detailed.getMonth() - (11 - i), 1);
    const monthIncome = incomeTrendRatio[i] * 1000;
    const monthExpense = expenseTrendRatio[i] * 1000;

    const incomeParts = spread(rnd, monthIncome, 3);
    incomeParts.forEach((amt, idx) => {
      allTxns.push({
        date: randomDateInMonth(rnd, m.getFullYear(), m.getMonth(), () => 9 + rnd() * 8),
        description: idx === 0 ? "Business Sales Settlement" : "Customer Transfer of Funds",
        counterparty: null,
        amount: amt,
        direction: "in",
        category: "Business Income",
        channel: "Send Money",
      });
    });

    const weightTotal = MERCHANT_BUCKETS.reduce((s, b) => s + b.total, 0);
    for (const bucket of MERCHANT_BUCKETS) {
      const amt = Math.round((bucket.total / weightTotal) * monthExpense);
      if (amt < 10) continue;
      allTxns.push({
        date: randomDateInMonth(rnd, m.getFullYear(), m.getMonth(), () => bizHour(rnd)),
        description: bucket.descTemplate(bucket.name),
        counterparty: bucket.name,
        amount: amt,
        direction: "out",
        category: bucket.category,
        channel: bucket.channel,
      });
    }
  }

  // ---- detailed month: full transaction-level detail ----
  const y = detailed.getFullYear();
  const mo = detailed.getMonth();

  // Income
  const businessSales = spread(rnd, 985000, 30);
  businessSales.forEach((amt) => {
    allTxns.push({
      date: randomDateInMonth(rnd, y, mo, () => 9 + rnd() * 10),
      description: "Business Sales Settlement",
      counterparty: "Kamau Hardware POS",
      amount: amt,
      direction: "in",
      category: "Business Income",
      channel: "Buy Goods (Till)",
    });
  });
  spread(rnd, 210000, 10).forEach((amt) => {
    allTxns.push({
      date: randomDateInMonth(rnd, y, mo, () => 9 + rnd() * 10),
      description: "Funds received from Client Transfer",
      counterparty: "Client Transfer",
      amount: amt,
      direction: "in",
      category: "Business Income",
      channel: "Send Money",
    });
  });
  spread(rnd, 89500, 6).forEach((amt) => {
    allTxns.push({
      date: randomDateInMonth(rnd, y, mo, () => 9 + rnd() * 10),
      description: "Other Income Received",
      counterparty: null,
      amount: amt,
      direction: "in",
      category: "Miscellaneous",
      channel: "Send Money",
    });
  });

  // Expenses from merchant buckets (minus the 2 QuickMart duplicate + fuliza handled separately)
  for (const bucket of MERCHANT_BUCKETS) {
    const amounts = spread(rnd, bucket.total, bucket.count);
    amounts.forEach((amt) => {
      allTxns.push({
        date: randomDateInMonth(rnd, y, mo, () => bizHour(rnd)),
        description: bucket.descTemplate(bucket.name),
        counterparty: bucket.name,
        amount: amt,
        direction: "out",
        category: bucket.category,
        channel: bucket.channel,
      });
    });
  }

  // Staff salaries — 4 lump payments
  spread(rnd, 168000, STAFF.length).forEach((amt, i) => {
    allTxns.push({
      date: randomDateInMonth(rnd, y, mo, () => 9 + rnd() * 4),
      description: `Business Payment to ${STAFF[i]}`,
      counterparty: STAFF[i],
      amount: amt,
      direction: "out",
      category: "Staff Salaries",
      channel: "Send Money",
    });
  });

  // Fuliza usage x6 (small overdraft fees)
  for (let i = 0; i < 6; i++) {
    allTxns.push({
      date: randomDateInMonth(rnd, y, mo, () => bizHour(rnd)),
      description: "OverDraft of Credit Party (Fuliza M-PESA)",
      counterparty: null,
      amount: 120 + Math.round(rnd() * 60),
      direction: "out",
      category: "Loans",
      channel: "Fuliza",
    });
  }

  // Seeded anomalies: a duplicate QuickMart charge + a large late-night withdrawal.
  const dupDay = 5 + Math.floor(rnd() * 20);
  const dupBase = new Date(y, mo, dupDay, 13, 20, 10);
  allTxns.push({
    date: dupBase,
    description: "Merchant Payment to QuickMart",
    counterparty: "QuickMart",
    amount: 4500,
    direction: "out",
    category: "Groceries",
    channel: "Buy Goods (Till)",
  });
  allTxns.push({
    date: new Date(dupBase.getTime() + 3 * 60 * 1000),
    description: "Merchant Payment to QuickMart",
    counterparty: "QuickMart",
    amount: 4500,
    direction: "out",
    category: "Groceries",
    channel: "Buy Goods (Till)",
  });
  allTxns.push({
    date: new Date(y, mo, 14, 23, 42, 0),
    description: "Withdraw at Agent",
    counterparty: "M-PESA Agent",
    amount: 60000,
    direction: "out",
    category: "Miscellaneous",
    channel: "Withdrawal",
  });

  allTxns.sort((a, b) => a.date.getTime() - b.date.getTime());

  const flags = detectAnomalies(allTxns);
  const flagByIndex = new Map(flags.map((f) => [f.index, f]));

  const statement = await prisma.statement.create({
    data: {
      userId,
      fileName: "Wanjiru — M-PESA & Bank Statement (sample).pdf",
      sourceType: "demo",
      status: "done",
      txnCount: allTxns.length,
    },
  });

  await prisma.transaction.createMany({
    data: allTxns.map((t, i) => ({
      userId,
      statementId: statement.id,
      date: t.date,
      description: t.description,
      counterparty: t.counterparty,
      amount: t.amount,
      direction: t.direction,
      category: t.category,
      channel: t.channel,
      isAnomaly: flagByIndex.has(i),
      anomalyReason: flagByIndex.get(i)?.reason ?? null,
      anomalySeverity: flagByIndex.get(i)?.severity ?? null,
    })),
  });

  await prisma.goal.createMany({
    data: [
      { userId, name: "Emergency Fund", icon: "🛡️", color: "#34d399", targetAmount: 300000, currentAmount: 180000 },
      { userId, name: "Business Capital", icon: "🏪", color: "#3b82f6", targetAmount: 1000000, currentAmount: 420000 },
      { userId, name: "Plot of Land", icon: "🌍", color: "#a371f7", targetAmount: 2500000, currentAmount: 1250000 },
      { userId, name: "School Fees", icon: "🎓", color: "#f59e0b", targetAmount: 120000, currentAmount: 90000 },
    ],
  });

  await prisma.user.update({
    where: { id: userId },
    data: { demo: true, streakMonths: 4, businessName: "Kamau Hardware Ltd" },
  });

  return { txnCount: allTxns.length, income: detailedIncome, expense: detailedExpense };
}
