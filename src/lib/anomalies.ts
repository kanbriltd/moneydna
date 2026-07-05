import { hasReliableTime } from "./dateUtils";

export interface AnomalyInput {
  date: Date;
  description: string;
  amount: number;
  direction: "in" | "out";
}

export interface AnomalyFlag {
  index: number;
  reason: string;
  severity: "high" | "medium" | "low";
}

/** Rule-based anomaly scan: duplicate charges, odd-hour withdrawals, statistical outliers. */
export function detectAnomalies(txns: AnomalyInput[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const flaggedIdx = new Set<number>();

  // 1) Duplicate charges: same direction/amount/description within 10 minutes.
  for (let i = 0; i < txns.length; i++) {
    if (flaggedIdx.has(i)) continue;
    for (let j = i + 1; j < txns.length; j++) {
      if (flaggedIdx.has(j)) continue;
      const a = txns[i], b = txns[j];
      if (a.direction !== b.direction || a.amount !== b.amount) continue;
      if (a.description.trim().toLowerCase() !== b.description.trim().toLowerCase()) continue;
      const minutes = Math.abs(a.date.getTime() - b.date.getTime()) / 60000;
      if (minutes <= 10) {
        flags.push({ index: j, reason: `Duplicate charge — same amount billed twice within ${Math.max(1, Math.round(minutes))} min of a previous charge.`, severity: "high" });
        flaggedIdx.add(j);
      }
    }
  }

  // 2) Odd-hour large withdrawals/outflows (11pm–4:59am, KES 15,000+).
  for (let i = 0; i < txns.length; i++) {
    if (flaggedIdx.has(i)) continue;
    const t = txns[i];
    if (t.direction !== "out" || t.amount < 15000 || !hasReliableTime(t.date)) continue;
    const hour = t.date.getHours();
    if (hour >= 23 || hour < 5) {
      flags.push({ index: i, reason: "Large late-night transaction — well outside your usual spending hours.", severity: "medium" });
      flaggedIdx.add(i);
    }
  }

  // 3) Statistical outliers among outflows.
  const outAmounts = txns.filter((t) => t.direction === "out").map((t) => t.amount);
  if (outAmounts.length >= 5) {
    const mean = outAmounts.reduce((s, v) => s + v, 0) / outAmounts.length;
    const variance = outAmounts.reduce((s, v) => s + (v - mean) ** 2, 0) / outAmounts.length;
    const stddev = Math.sqrt(variance);
    const threshold = mean + 2.5 * stddev;
    txns.forEach((t, i) => {
      if (flaggedIdx.has(i)) return;
      if (t.direction === "out" && t.amount > threshold && t.amount > 5000) {
        flags.push({ index: i, reason: `Unusually large transaction — ${Math.round(t.amount).toLocaleString()} is well above your typical spend.`, severity: "medium" });
        flaggedIdx.add(i);
      }
    });
  }

  return flags;
}
