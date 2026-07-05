import * as XLSX from "xlsx";
import type { Transaction } from "@prisma/client";

type Row = (string | number)[];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtDateTime(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fmtDateShort(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtMonthDay(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDateLong(d: Date) {
  return d.toDateString(); // "Wed Jan 01 2025"
}
function ksh(n: number, sym = "KSh") {
  return `${sym} ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
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
function stddev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((v) => (v - m) ** 2)));
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function weekStart(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}
function aoaSheet(rows: Row[]) {
  return XLSX.utils.aoa_to_sheet(rows);
}

function partyName(t: Transaction): string {
  if (t.counterparty) return t.counterparty;
  return t.description.length > 60 ? t.description.slice(0, 60) + "…" : t.description;
}

// ---------- 1. M-Pesa Transactions ----------
function buildTransactionsSheet(txns: Transaction[]) {
  const rows: Row[] = [["Receipt No", "Completion Time", "Details", "Transaction Status", "Paid In", "Withdrawn", "Balance"]];
  for (const t of txns) {
    rows.push([
      t.rawRef ?? "",
      fmtDateTime(t.date),
      t.description,
      "Completed",
      t.direction === "in" ? round2(t.amount) : "",
      t.direction === "out" ? round2(t.amount) : "",
      t.balanceAfter ?? "",
    ]);
  }
  return aoaSheet(rows);
}

// ---------- 2. Charges & Fees ----------
function buildChargesSheet(txns: Transaction[]) {
  const byRef = new Map<string, Transaction[]>();
  for (const t of txns) {
    if (!t.rawRef) continue;
    if (!byRef.has(t.rawRef)) byRef.set(t.rawRef, []);
    byRef.get(t.rawRef)!.push(t);
  }
  const rows: Row[] = [["Receipt No", "Date", "Full Details", "Charge Amount", "Related Transaction Amount", "Charge Percentage"]];
  for (const t of txns) {
    if (!/charge$/i.test(t.description.trim())) continue;
    const siblings = t.rawRef ? byRef.get(t.rawRef) ?? [] : [];
    const related = siblings.find((s) => s.id !== t.id && !/charge$/i.test(s.description.trim()));
    const relatedAmt = related?.amount ?? 0;
    const pct = relatedAmt > 0 ? ((t.amount / relatedAmt) * 100).toFixed(2) + "%" : "";
    rows.push([t.rawRef ?? "", fmtDateTime(t.date), t.description, round2(t.amount), round2(relatedAmt), pct]);
  }
  return aoaSheet(rows);
}

// ---------- 3. Financial Summary ----------
function buildFinancialSummarySheet(txns: Transaction[]) {
  const rows: Row[] = [];
  if (txns.length === 0) {
    rows.push(["FINANCIAL SUMMARY REPORT", "", ""], ["No transactions found.", "", ""]);
    return aoaSheet(rows);
  }
  const start = txns[0].date;
  const end = txns[txns.length - 1].date;
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const inTx = txns.filter((t) => t.direction === "in");
  const outTx = txns.filter((t) => t.direction === "out");
  const totalIn = inTx.reduce((s, t) => s + t.amount, 0);
  const totalOut = outTx.reduce((s, t) => s + t.amount, 0);
  const balances = txns.filter((t) => t.balanceAfter !== null).map((t) => t.balanceAfter as number);

  const dayCounts = new Map<string, number>();
  const dowCounts = new Map<string, number>();
  const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const t of txns) {
    const k = dayKey(t.date);
    dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1);
    const dow = DOW[t.date.getDay()];
    dowCounts.set(dow, (dowCounts.get(dow) ?? 0) + 1);
  }
  const mostActiveDayKey = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostActiveDay = txns.find((t) => dayKey(t.date) === mostActiveDayKey)?.date;
  const busiestDow = [...dowCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

  rows.push(
    ["FINANCIAL SUMMARY REPORT", "", ""],
    ["", "", ""],
    ["PERIOD OVERVIEW", "", ""],
    ["Start Date:", fmtDateLong(start), ""],
    ["End Date:", fmtDateLong(end), ""],
    ["Total Days:", totalDays, ""],
    ["Total Transactions:", txns.length, ""],
    ["", "", ""],
    ["CASH FLOW SUMMARY", "", ""],
    ["Total Money In (Income):", ksh(round2(totalIn)), ""],
    ["Total Money Out (Expenses):", ksh(round2(totalOut)), ""],
    ["Net Cash Flow:", ksh(round2(totalIn - totalOut)), ""],
    ["Average Daily Income:", ksh(round2(totalIn / totalDays)), ""],
    ["Average Daily Spending:", ksh(round2(totalOut / totalDays)), ""],
    ["", "", ""],
    ["BALANCE ANALYSIS", "", ""],
    ["Starting Balance:", balances.length ? ksh(round2(balances[0])) : "N/A", ""],
    ["Ending Balance:", balances.length ? ksh(round2(balances[balances.length - 1])) : "N/A", ""],
    ["Highest Balance:", balances.length ? ksh(round2(Math.max(...balances))) : "N/A", ""],
    ["Lowest Balance:", balances.length ? ksh(round2(Math.min(...balances))) : "N/A", ""],
    ["Average Balance:", balances.length ? ksh(round2(mean(balances))) : "N/A", ""],
    ["", "", ""],
    ["TRANSACTION PATTERNS", "", ""],
    ["Highest Single Income:", inTx.length ? ksh(round2(Math.max(...inTx.map((t) => t.amount)))) : "N/A", ""],
    ["Highest Single Expense:", outTx.length ? ksh(round2(Math.max(...outTx.map((t) => t.amount)))) : "N/A", ""],
    ["Most Active Day:", mostActiveDay ? fmtDateLong(mostActiveDay) : "N/A", ""],
    ["Busiest Day of Week:", busiestDow, ""],
    ["Average Transactions/Day:", (txns.length / totalDays).toFixed(1), ""]
  );
  return aoaSheet(rows);
}

// ---------- 4. Monthly & Weekly Breakdown ----------
function buildMonthlyWeeklySheet(txns: Transaction[]) {
  const rows: Row[] = [
    ["MONTHLY & WEEKLY BREAKDOWN", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["MONTHLY BREAKDOWN", "", "", "", "", ""],
    ["Month", "Inflows (KES)", "Outflows (KES)", "Net Change (KES)", "Avg Transaction (KES)", "Transaction Count"],
  ];
  const months = new Map<string, { label: string; inflow: number; outflow: number; count: number }>();
  for (const t of txns) {
    const k = monthKey(t.date);
    if (!months.has(k)) {
      months.set(k, { label: t.date.toLocaleDateString("en-US", { month: "long", year: "numeric" }), inflow: 0, outflow: 0, count: 0 });
    }
    const m = months.get(k)!;
    if (t.direction === "in") m.inflow += t.amount;
    else m.outflow += t.amount;
    m.count += 1;
  }
  for (const m of months.values()) {
    rows.push([m.label, round2(m.inflow), round2(m.outflow), round2(m.inflow - m.outflow), round2((m.inflow + m.outflow) / (m.count || 1)), m.count]);
  }

  rows.push(["", "", "", "", "", ""], ["", "", "", "", "", ""], ["WEEKLY BREAKDOWN", "", "", "", "", ""], [
    "Week",
    "Inflows (KES)",
    "Outflows (KES)",
    "Net Change (KES)",
    "Avg Transaction (KES)",
    "Transaction Count",
  ]);
  const weeks = new Map<string, { start: Date; inflow: number; outflow: number; count: number }>();
  for (const t of txns) {
    const ws = weekStart(t.date);
    const k = ws.toISOString();
    if (!weeks.has(k)) weeks.set(k, { start: ws, inflow: 0, outflow: 0, count: 0 });
    const w = weeks.get(k)!;
    if (t.direction === "in") w.inflow += t.amount;
    else w.outflow += t.amount;
    w.count += 1;
  }
  const sortedWeeks = [...weeks.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
  const recentWeeks = sortedWeeks.slice(-12); // most recent ~12 weeks, matches typical report scope
  for (const w of recentWeeks) {
    const end = new Date(w.start);
    end.setDate(end.getDate() + 6);
    const label = `${fmtMonthDay(w.start)} - ${fmtMonthDay(end)}, ${end.getFullYear()}`;
    rows.push([label, round2(w.inflow), round2(w.outflow), round2(w.inflow - w.outflow), round2((w.inflow + w.outflow) / (w.count || 1)), w.count]);
  }
  return aoaSheet(rows);
}

// ---------- 5. Daily Balance Tracker ----------
function buildDailyBalanceSheet(txns: Transaction[]) {
  const days = new Map<string, { date: Date; count: number; lastBalance: number; hasRealBalance: boolean }>();
  let running = 0;
  for (const t of txns) {
    const k = dayKey(t.date);
    running += t.direction === "in" ? t.amount : -t.amount;
    const balance = t.balanceAfter ?? running;
    if (!days.has(k)) days.set(k, { date: new Date(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()), count: 0, lastBalance: balance, hasRealBalance: t.balanceAfter !== null });
    const d = days.get(k)!;
    d.count += 1;
    d.lastBalance = balance;
    if (t.balanceAfter !== null) d.hasRealBalance = true;
  }
  const ordered = [...days.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  const balances = ordered.map((d) => d.lastBalance);
  const changes = ordered.map((d, i) => (i === 0 ? 0 : d.lastBalance - ordered[i - 1].lastBalance));
  const changeStd = stddev(changes.filter((c) => c !== 0));

  const highestBal = balances.length ? Math.max(...balances) : 0;
  const lowestBal = balances.length ? Math.min(...balances) : 0;
  const bestIdx = balances.indexOf(highestBal);
  const worstIdx = balances.indexOf(lowestBal);

  const rows: Row[] = [
    ["DAILY BALANCE TRACKER", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["BALANCE ANALYSIS SUMMARY", "", "", "", "", ""],
    ["Period:", ordered.length ? `${fmtDateShort(ordered[0].date)} to ${fmtDateShort(ordered[ordered.length - 1].date)}` : "N/A", "", "", "", ""],
    ["Total Days Tracked:", ordered.length, "", "", "", ""],
    ["Highest Balance:", ksh(round2(highestBal), "KES"), "", "", "", ""],
    ["Lowest Balance:", ksh(round2(lowestBal), "KES"), "", "", "", ""],
    ["Average Daily Balance:", ksh(round2(mean(balances)), "KES"), "", "", "", ""],
    ["Best Day:", bestIdx >= 0 ? fmtDateShort(ordered[bestIdx].date) : "N/A", "", "", "", ""],
    ["Worst Day:", worstIdx >= 0 ? fmtDateShort(ordered[worstIdx].date) : "N/A", "", "", "", ""],
    ["Balance Volatility:", mean(balances) ? Math.round((stddev(balances) / Math.abs(mean(balances))) * 100) + "%" : "0%", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["DAILY BALANCE HISTORY", "", "", "", "", ""],
    ["Date", "End of Day Balance (KES)", "Daily Change (KES)", "Transactions Count", "High/Low", "Notes"],
  ];

  ordered.forEach((d, i) => {
    const change = changes[i];
    let flag = "";
    let note = "";
    if (d.lastBalance === lowestBal) {
      flag = "LOWEST";
      note = "Lowest balance recorded";
    } else if (d.lastBalance === highestBal) {
      flag = "HIGHEST";
      note = "Highest balance recorded";
    } else if (changeStd > 0 && change > changeStd * 1.5) {
      note = "Big increase";
    } else if (changeStd > 0 && change < -changeStd * 1.5) {
      note = "Big decrease";
    }
    rows.push([fmtDateShort(d.date), round2(d.lastBalance), round2(change), d.count, flag, note]);
  });

  return aoaSheet(rows);
}

// ---------- 6. Transaction Amount Distribution ----------
function buildDistributionSheet(txns: Transaction[]) {
  const buckets: { label: string; min: number; max: number }[] = [
    { label: "< 100 KES", min: 0, max: 100 },
    { label: "100 - 500 KES", min: 100, max: 500 },
    { label: "501 - 1,000 KES", min: 501, max: 1000 },
    { label: "1,001 - 5,000 KES", min: 1001, max: 5000 },
    { label: "5,001 - 10,000 KES", min: 5001, max: 10000 },
    { label: "10,001 - 50,000 KES", min: 10001, max: 50000 },
    { label: "> 50,000 KES", min: 50000, max: Infinity },
  ];
  const inTx = txns.filter((t) => t.direction === "in");
  const outTx = txns.filter((t) => t.direction === "out");
  const totalInCount = inTx.length || 1;
  const totalOutCount = outTx.length || 1;

  const rows: Row[] = [
    ["Transaction Amount Distribution Analysis", "", "", "", "", "", "", "", ""],
    ["Excludes transaction charges and fees", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["Amount Range", "Inflow Count", "Inflow Total (KES)", "Inflow %", "Outflow Count", "Outflow Total (KES)", "Outflow %", "Total Count", "Total Amount (KES)"],
  ];
  for (const b of buckets) {
    const inMatches = inTx.filter((t) => t.amount >= b.min && (b.max === Infinity ? true : t.amount <= b.max));
    const outMatches = outTx.filter((t) => t.amount >= b.min && (b.max === Infinity ? true : t.amount <= b.max));
    const inTotal = inMatches.reduce((s, t) => s + t.amount, 0);
    const outTotal = outMatches.reduce((s, t) => s + t.amount, 0);
    rows.push([
      b.label,
      inMatches.length,
      round2(inTotal),
      ((inMatches.length / totalInCount) * 100).toFixed(1) + "%",
      outMatches.length,
      round2(outTotal),
      ((outMatches.length / totalOutCount) * 100).toFixed(1) + "%",
      inMatches.length + outMatches.length,
      round2(inTotal + outTotal),
    ]);
  }
  rows.push(
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["Summary", "", "", "", "", "", "", "", ""],
    ["Total Inflow Transactions:", inTx.length, "", "", "", "", "", "", ""],
    ["Total Inflow Amount:", round2(inTx.reduce((s, t) => s + t.amount, 0)), "", "", "", "", "", "", ""],
    ["Total Outflow Transactions:", outTx.length, "", "", "", "", "", "", ""],
    ["Total Outflow Amount:", round2(outTx.reduce((s, t) => s + t.amount, 0)), "", "", "", "", "", "", ""]
  );
  return aoaSheet(rows);
}

// ---------- 7. Top Contacts ----------
function buildTopContactsSheet(txns: Transaction[]) {
  const sent = new Map<string, { amount: number; count: number }>();
  const received = new Map<string, { amount: number; count: number }>();
  for (const t of txns) {
    const name = partyName(t);
    const map = t.direction === "out" ? sent : received;
    if (!map.has(name)) map.set(name, { amount: 0, count: 0 });
    const e = map.get(name)!;
    e.amount += t.amount;
    e.count += 1;
  }
  const topSent = [...sent.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 20);
  const topReceived = [...received.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 20);

  const rows: Row[] = [
    ["TOP CONTACTS", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["TOP 20 MONEY SENT TO", "", "", "", "TOP 20 MONEY RECEIVED FROM", "", ""],
    ["Party", "Total Amount", "Transactions", "", "Party", "Total Amount", "Transactions"],
  ];
  const maxLen = Math.max(topSent.length, topReceived.length);
  for (let i = 0; i < maxLen; i++) {
    const s = topSent[i];
    const r = topReceived[i];
    rows.push([
      s?.[0] ?? "",
      s ? ksh(round2(s[1].amount)) : "",
      s ? s[1].count : "",
      "",
      r?.[0] ?? "",
      r ? ksh(round2(r[1].amount)) : "",
      r ? r[1].count : "",
    ]);
  }
  return aoaSheet(rows);
}

// ---------- 8 & 9. Money In / Money Out ----------
function buildDirectionalLedger(txns: Transaction[], direction: "in" | "out") {
  const filtered = txns.filter((t) => t.direction === direction).sort((a, b) => b.date.getTime() - a.date.getTime());
  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const label = direction === "in" ? "Amount Received" : "Amount Spent";
  const summaryLabel = direction === "in" ? "Total Received:" : "Total Spent:";
  const rows: Row[] = [
    ["Receipt No", "Date & Time", "Details", label, "Balance After", "Status"],
    ["SUMMARY", "", summaryLabel, round2(total), `Transaction Count: ${filtered.length}`, ""],
  ];
  for (const t of filtered) {
    rows.push([t.rawRef ?? "", fmtDateTime(t.date), t.description, round2(t.amount), t.balanceAfter ?? "", "Completed"]);
  }
  return aoaSheet(rows);
}

// ---------- 10. Recurring Transactions ----------
function classifyFrequency(medianDays: number): string {
  if (medianDays > 100) return "Irregular (Repeated)";
  const periods: [string, number][] = [
    ["Weekly", 7],
    ["Bi-weekly", 14],
    ["Monthly", 30],
    ["Quarterly", 90],
  ];
  let best = periods[0];
  let bestDist = Infinity;
  for (const p of periods) {
    const dist = Math.abs(medianDays - p[1]);
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return best[0];
}

function buildRecurringSheet(txns: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const t of txns) {
    if (/charge$/i.test(t.description.trim())) continue;
    const key = t.description.trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  interface Rec {
    label: string;
    type: string;
    frequency: string;
    occurrences: number;
    avgAmount: number;
    totalAmount: number;
    pattern: string;
    last: Date;
    next: Date;
    medianInterval: number;
  }
  const recs: Rec[] = [];
  for (const [label, group] of groups) {
    if (group.length < 3) continue;
    const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) intervals.push((sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / 86400000);
    const medInterval = median(intervals);
    const amounts = sorted.map((t) => t.amount);
    const avgAmount = mean(amounts);
    const cv = avgAmount > 0 ? stddev(amounts) / avgAmount : 0;
    const allOut = sorted.every((t) => t.direction === "out");
    const allIn = sorted.every((t) => t.direction === "in");
    const last = sorted[sorted.length - 1].date;
    recs.push({
      label,
      type: allOut ? "Sent" : allIn ? "Received" : "Mixed",
      frequency: classifyFrequency(medInterval),
      occurrences: sorted.length,
      avgAmount,
      totalAmount: amounts.reduce((s, v) => s + v, 0),
      pattern: cv < 0.15 ? "Fixed" : "Variable",
      last,
      next: new Date(last.getTime() + medInterval * 86400000),
      medianInterval: medInterval,
    });
  }
  recs.sort((a, b) => b.totalAmount - a.totalAmount);

  const rows: Row[] = [
    ["RECURRING TRANSACTIONS", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    [
      "Transaction Details",
      "Type",
      "Frequency",
      "Occurrences",
      "Avg Amount (KSh)",
      "Total Amount (KSh)",
      "Amount Pattern",
      "Last Transaction",
      "Next Expected",
      "Median Interval (days)",
    ],
  ];
  for (const r of recs) {
    rows.push([
      r.label,
      r.type,
      r.frequency,
      r.occurrences,
      round2(r.avgAmount),
      round2(r.totalAmount),
      r.pattern,
      fmtDateShort(r.last),
      fmtDateShort(r.next),
      round2(r.medianInterval),
    ]);
  }
  rows.push(
    ["", "", "", "", "", "", "", "", "", ""],
    ["SUMMARY", "", "", "", "", "", "", "", "", ""],
    ["Recurring Patterns Found:", recs.length, "", "", "", "", "", "", "", ""],
    ["Total Amount in Recurring Transactions:", ksh(round2(recs.reduce((s, r) => s + r.totalAmount, 0))), "", "", "", "", "", "", "", ""]
  );
  return aoaSheet(rows);
}

// ---------- 11. Time-of-Day Activity ----------
function hourLabel(h: number) {
  const fmt = (hh: number) => {
    const period = hh < 12 ? "AM" : "PM";
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}:00 ${period}`;
  };
  return `${fmt(h)} – ${fmt((h + 1) % 24)}`;
}

function buildTimeOfDaySheet(txns: Transaction[]) {
  const hours = Array.from({ length: 24 }, () => ({ count: 0, inCount: 0, inAmt: 0, outCount: 0, outAmt: 0 }));
  for (const t of txns) {
    const h = hours[t.date.getHours()];
    h.count += 1;
    if (t.direction === "in") {
      h.inCount += 1;
      h.inAmt += t.amount;
    } else {
      h.outCount += 1;
      h.outAmt += t.amount;
    }
  }
  const rows: Row[] = [
    ["TIME-OF-DAY ACTIVITY", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["HOURLY BREAKDOWN", "", "", "", "", "", "", ""],
    ["Hour", "Time Slot", "Transactions", "Money In Count", "Money In (KSh)", "Money Out Count", "Money Out (KSh)", "Net Flow (KSh)"],
  ];
  hours.forEach((h, i) => {
    rows.push([i, hourLabel(i), h.count, h.inCount, round2(h.inAmt), h.outCount, round2(h.outAmt), round2(h.inAmt - h.outAmt)]);
  });

  const periods = [
    { name: "Night", range: "12 AM – 6 AM", hrs: [0, 1, 2, 3, 4, 5] },
    { name: "Morning", range: "6 AM – 12 PM", hrs: [6, 7, 8, 9, 10, 11] },
    { name: "Afternoon", range: "12 PM – 6 PM", hrs: [12, 13, 14, 15, 16, 17] },
    { name: "Evening", range: "6 PM – 12 AM", hrs: [18, 19, 20, 21, 22, 23] },
  ];
  const totalTxns = txns.length || 1;
  rows.push(
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["PERIOD SUMMARY", "", "", "", "", "", "", ""],
    ["Period", "Hours", "Transactions", "% of Total", "Money In (KSh)", "Money Out (KSh)", "Net Flow (KSh)", ""]
  );
  for (const p of periods) {
    const count = p.hrs.reduce((s, h) => s + hours[h].count, 0);
    const inAmt = p.hrs.reduce((s, h) => s + hours[h].inAmt, 0);
    const outAmt = p.hrs.reduce((s, h) => s + hours[h].outAmt, 0);
    rows.push([p.name, p.range, count, ((count / totalTxns) * 100).toFixed(1) + "%", round2(inAmt), round2(outAmt), round2(inAmt - outAmt), ""]);
  }

  const peakHour = hours.reduce((best, h, i) => (h.count > hours[best].count ? i : best), 0);
  const peakInHour = hours.reduce((best, h, i) => (h.inAmt > hours[best].inAmt ? i : best), 0);
  const peakOutHour = hours.reduce((best, h, i) => (h.outAmt > hours[best].outAmt ? i : best), 0);
  const quietestHour = hours.reduce((best, h, i) => (h.count < hours[best].count ? i : best), 0);
  const mostActivePeriod = periods.reduce((best, p) => {
    const count = p.hrs.reduce((s, h) => s + hours[h].count, 0);
    const bestCount = best.hrs.reduce((s, h) => s + hours[h].count, 0);
    return count > bestCount ? p : best;
  }, periods[0]);

  rows.push(
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["KEY INSIGHTS", "", "", "", "", "", "", ""],
    ["Peak Hour (most transactions):", hourLabel(peakHour), "", "", "", "", "", ""],
    ["Peak Money-In Hour:", hourLabel(peakInHour), "", "", "", "", "", ""],
    ["Peak Money-Out Hour:", hourLabel(peakOutHour), "", "", "", "", "", ""],
    ["Most Active Period:", mostActivePeriod.name, "", "", "", "", "", ""],
    ["Quietest Hour:", hourLabel(quietestHour), "", "", "", "", "", ""]
  );
  return aoaSheet(rows);
}

export function buildReportWorkbook(transactions: Transaction[]): XLSX.WorkBook {
  const txns = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildTransactionsSheet(txns), "M-Pesa Transactions");
  XLSX.utils.book_append_sheet(wb, buildChargesSheet(txns), "Charges & Fees");
  XLSX.utils.book_append_sheet(wb, buildFinancialSummarySheet(txns), "Financial Summary");
  XLSX.utils.book_append_sheet(wb, buildMonthlyWeeklySheet(txns), "Monthly & Weekly Breakdown");
  XLSX.utils.book_append_sheet(wb, buildDailyBalanceSheet(txns), "Daily Balance Tracker");
  XLSX.utils.book_append_sheet(wb, buildDistributionSheet(txns), "Transaction Amount Distribution");
  XLSX.utils.book_append_sheet(wb, buildTopContactsSheet(txns), "Top Contacts");
  XLSX.utils.book_append_sheet(wb, buildDirectionalLedger(txns, "in"), "Money In");
  XLSX.utils.book_append_sheet(wb, buildDirectionalLedger(txns, "out"), "Money Out");
  XLSX.utils.book_append_sheet(wb, buildRecurringSheet(txns), "Recurring Transactions");
  XLSX.utils.book_append_sheet(wb, buildTimeOfDaySheet(txns), "Time-of-Day Activity");
  return wb;
}
