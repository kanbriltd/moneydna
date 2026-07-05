import Anthropic from "@anthropic-ai/sdk";
import type { AnalyticsResult } from "@/lib/analytics";
import { kes } from "@/lib/format";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Converts **bold** markdown to <b> tags; everything else is escaped plain text. */
function mdBoldToHtml(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts
    .map((p) => (p.startsWith("**") && p.endsWith("**") ? `<b>${escapeHtml(p.slice(2, -2))}</b>` : escapeHtml(p)))
    .join("");
}

function summarize(a: AnalyticsResult): string {
  if (!a.hasData) return "The user has not uploaded any statement yet — encourage them to upload one.";
  const topCats = a.categories.slice(0, 5).map((c) => `${c.name}: ${kes(c.amount)}`).join(", ");
  const goals = a.goals.map((g) => `${g.name} (${kes(g.current)} of ${kes(g.target)})`).join(", ") || "none set";
  const anomalies = a.anomalies.map((x) => `${x.title}: ${x.body}`).join("; ") || "none";
  return [
    `Period: ${a.periodLabel}.`,
    `Income: ${kes(a.kpis.income)}. Expenses: ${kes(a.kpis.expenses)}. Net saved: ${kes(a.kpis.net)}.`,
    `Savings rate: ${a.savingsRate.toFixed(0)}% (target 20%). Financial health score: ${a.health.score}/100.`,
    `Top spending categories: ${topCats}.`,
    `Savings goals: ${goals}.`,
    `Patterns worth knowing about this month: ${anomalies}.`,
    `Financial DNA type: ${a.dna.typeName} — ${a.dna.explanation}`,
  ].join(" ");
}

const COMPANION_VOICE = `You are MoneyDNA's Financial Companion — not a chatbot, not a financial advisor, a trusted companion who helps people understand the financial choices available to them. You never judge, shame, lecture, or command. You never say "you should" or "you need to" — say "you could" or "one possibility is". You never say "wrong" — say "another approach may lead to". You show possibilities and respect that the decision always belongs to the user. Every interaction should leave them feeling more hopeful and confident, never guilty.`;

export async function answerCoachQuestion(
  question: string,
  analytics: AnalyticsResult,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await answerWithClaude(question, analytics, history, apiKey);
    } catch (err) {
      // Log the real reason so failures are visible in the server console
      // instead of silently degrading to the rule-based fallback.
      console.error("[coachEngine] Claude API call failed, falling back to rule-based engine:", err);
    }
  }
  return ruleBasedAnswer(question, analytics);
}

async function answerWithClaude(
  question: string,
  analytics: AnalyticsResult,
  history: { role: "user" | "assistant"; content: string }[],
  apiKey: string
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const system = `${COMPANION_VOICE} Answer the user's question about their money using ONLY the financial summary below — be concrete, cite real numbers from it, and keep replies under 90 words. Frame possibilities like pay-yourself-first, automatic transfers and emergency funds as options, not instructions. Use **double asterisks** for the 2-4 most important numbers/phrases so they render bold. Do not invent numbers not implied by the summary.\n\nFINANCIAL SUMMARY:\n${summarize(analytics)}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 400,
    system,
    messages: [...history.slice(-8).map((h) => ({ role: h.role, content: h.content })), { role: "user" as const, content: question }],
  });
  const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
  return mdBoldToHtml(text || "I couldn't come up with an answer just now — try rephrasing?");
}

export interface DailyBriefing {
  cashAvailable: number;
  runwayDays: number | null;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  headline: string;
  alerts: string[];
  advice: string;
}

/** Deterministic facts (cash, runway, alerts) computed directly from analytics — no LLM involved, so they can't be fabricated. */
export async function getDailyBriefing(analytics: AnalyticsResult): Promise<DailyBriefing> {
  const cashAvailable = analytics.lastKnownBalance ?? Math.max(0, analytics.netWorth);
  const runwayDays = analytics.kpis.burnRate > 0 ? Math.round(cashAvailable / analytics.kpis.burnRate) : null;
  const riskLevel = analytics.stress.level;

  const alerts: string[] = [];
  if (runwayDays !== null && runwayDays <= 14) {
    alerts.push(`At this pace, your available cash could cover about <b>${runwayDays} more days</b> — worth keeping an eye on.`);
  }
  if (analytics.anomalies[0]) {
    alerts.push(`Worth knowing: <b>${analytics.anomalies[0].title}</b> — ${analytics.anomalies[0].body}`);
  }
  if (analytics.leaks[0]) {
    alerts.push(`One possibility worth exploring: <b>${analytics.leaks[0].title}</b> — an estimated ${kes(analytics.leaks[0].annualEstimate)}/year if the pattern continues.`);
  }

  const headline =
    riskLevel === "Critical" || riskLevel === "High"
      ? `A few things are worth your attention today — no pressure, just possibilities to consider.`
      : `Good morning — things look steady today.`;

  const advice = await getDailyAdvice(analytics);

  return { cashAvailable, runwayDays, riskLevel, headline, alerts: alerts.slice(0, 3), advice };
}

async function getDailyAdvice(a: AnalyticsResult): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await adviceWithClaude(a, apiKey);
    } catch (err) {
      console.error("[coachEngine] Daily briefing Claude call failed, falling back to rule-based advice:", err);
    }
  }
  return ruleBasedAdvice(a);
}

async function adviceWithClaude(a: AnalyticsResult, apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const system = `${COMPANION_VOICE} Offer ONE short, specific possibility worth considering today, based ONLY on the financial summary below — max 25 words, no greeting or preamble. Frame it as an option, not an instruction (e.g. "one possibility is..." not "you should"). Use **double asterisks** around the single most important number or idea. Do not invent numbers not implied by the summary.\n\nFINANCIAL SUMMARY:\n${summarize(a)}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 120,
    system,
    messages: [{ role: "user", content: "What's one possibility worth thinking about today?" }],
  });
  const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
  return mdBoldToHtml(text || ruleBasedAdvice(a));
}

function ruleBasedAdvice(a: AnalyticsResult): string {
  if (a.leaks[0]) {
    return `One possibility worth exploring today: <b>${a.leaks[0].title}</b> — an estimated ${kes(a.leaks[0].annualEstimate)}/year, if it's something you'd like to change.`;
  }
  if (a.savingsRate < 20) {
    return `One possibility: your savings rate is <b>${a.savingsRate.toFixed(0)}%</b> — even a small automatic transfer could move it closer to the 20% benchmark over time.`;
  }
  return `You're doing well — your <b>${a.streakMonths}-month</b> saving streak is something worth celebrating today.`;
}

function ruleBasedAnswer(question: string, a: AnalyticsResult): string {
  const k = question.toLowerCase().trim();
  const b = (s: string) => `<b>${s}</b>`;

  if (!a.hasData) {
    return `I don't have a statement to read yet — upload one (or use the sample dataset) and I'll ground every answer in your real numbers.`;
  }

  // Greeting — short, friendly, doesn't dump the full summary.
  if (/^(hi|hello|hey|sup|yo|good (morning|afternoon|evening))\b/.test(k) || k.length <= 3) {
    return `Hey! I've read your ${a.periodLabel.toLowerCase()} statement — you kept ${b(a.savingsRate.toFixed(0) + "%")} of income, health score ${b(a.health.score + "/100")}. Ask me about saving, spending, investing, or a goal — or tap a suggestion below.`;
  }

  // Investing
  if (/\binvest/.test(k)) {
    const investCat = a.categories.find((c) => c.name === "Investments");
    const idleCash = Math.max(0, a.kpis.net * 0.4);
    return investCat
      ? `You're already putting ${b(kes(investCat.amount))} into investments this month — that's real momentum. Beyond that, one possibility once your emergency fund is solid: idle savings could go into a money-market fund earning roughly 10%/year.`
      : `You haven't started investing yet, and that's completely fine — you kept ${b(kes(a.kpis.net))} this month. One possibility, once your emergency fund covers a few months of expenses: routing surplus (roughly ${b(kes(idleCash) + "/month")}) into a money-market fund or index tracker. No pressure — just an option worth knowing about.`;
  }

  // Explicit target amount ("save KES 10,000 monthly")
  if (/\bsav\w*/.test(k) && /\d/.test(k)) {
    const target = parseInt(k.match(/\d[\d,]*/)?.[0].replace(/,/g, "") ?? "10000", 10);
    const cat = a.categories[0];
    return `One possibility to free up ${b(kes(target) + "/month")}: trimming ${cat ? cat.name : "your top category"} by around 15%, plus reviewing one subscription you may not need. You're already keeping ${b(a.savingsRate.toFixed(0) + "%")} of income — this could push that higher, compounding to roughly ${b(kes(target * 12))} over a year.`;
  }

  // General "can I save more / saving more / how to save" — no specific number given.
  if (/\bsav\w*/.test(k)) {
    const cat = a.categories[0];
    const headroom = Math.max(0, 30 - a.savingsRate);
    return a.savingsRate >= 25
      ? `You're already doing well here — ${b(a.savingsRate.toFixed(0) + "%")} of income kept, above the 20% benchmark. If you wanted to push further, ${cat ? `${cat.name} (${kes(cat.amount)})` : "your top category"} has the most room without touching the essentials.`
      : `One possibility: trimming ${cat ? b(cat.name) : "your top category"}${cat ? ` (${kes(cat.amount)})` : ""} by around 10-15%. That alone could lift your savings rate by roughly ${b(headroom.toFixed(0) + " points")} — worth ${b(kes((headroom / 100) * a.kpis.income))} a month if it fits your life right now.`;
  }

  if (k.includes("where") || k.includes("going")) {
    const top = a.categories.slice(0, 3).map((c) => `${c.name} (${kes(c.amount)})`).join(", ");
    return `Your biggest outflows this month: ${b(top)}. ${a.anomalies.length ? `One thing worth a look: ${a.anomalies[0].title.toLowerCase()}.` : "Nothing unusual jumps out."}`;
  }
  if (k.includes("overspend")) {
    return a.savingsRate >= 20
      ? `From what I can see, things look ${b("on track overall")} — you kept ${a.savingsRate.toFixed(0)}% of income, above the 20% benchmark. ${a.anomalies.length ? `One pocket worth watching: ${a.anomalies[0].title.toLowerCase()}.` : ""}`
      : `Your savings rate is ${b(a.savingsRate.toFixed(0) + "%")}, below the 20% benchmark — one option worth considering is easing up on ${a.categories[0]?.name ?? "your top category"}, if that feels doable.`;
  }
  if (k.includes("continue") || k.includes("happen") || k.includes("lifestyle") || k.includes("future") || k.includes("projection")) {
    const yearly = a.kpis.net * 12;
    return `If this exact pattern continued for 12 months, you'd likely keep roughly ${b(kes(Math.max(0, yearly)))}. ${a.goals[0] ? `Putting a little more toward ${a.goals[0].name} could get you there sooner.` : ""}`;
  }
  if (k.includes("cut") || k.includes("which expense") || k.includes("reduce") || k.includes("lower") || k.includes("trim")) {
    const cats = a.categories.slice(1, 4).map((c) => c.name).join(", ");
    return `One place worth a look: ${b(cats || "your discretionary categories")} — they're sizeable, and often have the most room without much lifestyle impact.`;
  }
  if (k.includes("saving culture") || k.includes("habit") || k.includes("routine") || k.includes("discipline")) {
    return `One approach that tends to work well: automation — ${b("paying yourself first")} by moving a fixed % to savings the moment income lands, growing an emergency fund (${a.goals.find((g) => /emergency/i.test(g.name)) ? "yours is already underway" : "starting one whenever feels right"}), then letting any surplus go toward something that earns. Small and automatic beats willpower alone.`;
  }
  if (k.includes("build") && !k.includes("business")) {
    return `One approach that tends to work well: automation — ${b("paying yourself first")} by moving a fixed % to savings the moment income lands, growing an emergency fund, then routing surplus into something that earns. Small and automatic beats willpower alone.`;
  }
  if (k.includes("goal")) {
    if (!a.goals.length) return `You don't have any savings goals set up yet — whenever you're ready, add one from the Dashboard ("+ New goal") and I'll track your progress and pace toward it.`;
    const lines = a.goals.map((g) => `${g.name}: ${b(g.progressPct.toFixed(0) + "%")} there (${kes(g.current)} of ${kes(g.target)})`).join("; ");
    return `Your goals: ${lines}. At this month's pace you're moving in the right direction — want me to work out how many months are left on any one of them?`;
  }
  if (k.includes("health") || k.includes("score")) {
    const top = [...a.health.parts].sort((x, y) => y.value - x.value)[0];
    const bottom = [...a.health.parts].sort((x, y) => x.value - y.value)[0];
    return `Your financial health score is ${b(a.health.score + "/100")}. Strongest signal: ${b(top?.label ?? "savings behaviour")}. The one with the most room to grow: ${b(bottom?.label ?? "spending volatility")}.`;
  }
  if (k.includes("net worth") || k.includes("networth")) {
    return `Based on your cumulative saved cashflow so far, you're sitting around ${b(kes(a.netWorth))}. That's an estimate from your transaction history, not a full asset/liability picture — think of it as a savings trendline rather than a bank statement.`;
  }
  if (/make more money|earn more|increase (my )?income|side hustle|extra income/.test(k)) {
    return `I can only see your spending side, not new income streams — that's a decision that belongs entirely to you. What I can share from your data: your biggest recurring outflow is ${b(a.categories[0]?.name ?? "your top category")} (${kes(a.categories[0]?.amount ?? 0)}) — freeing that up could have a similar effect on your bottom line as earning more, without needing a new income source.`;
  }
  if (/^(can you |could you )?help( me)?\b|what can (you|i) (do|ask)|what do you do/.test(k)) {
    return `I can help with things like: ${b("where is my money going")}, ${b("am I overspending")}, ${b("how could I save KES X monthly")}, ${b("what are my goals")}, or ${b("how healthy is my score")} — all grounded in your real ${a.periodLabel.toLowerCase()} data. Try one, or tap a suggestion below.`;
  }

  return `I don't have a specific answer for "${question}" yet — but here's where things stand: income ${b(kes(a.kpis.income))}, expenses ${b(kes(a.kpis.expenses))}, kept ${b(kes(a.kpis.net) + ` (${a.savingsRate.toFixed(0)}%)`)}, health score ${b(a.health.score + "/100")}. Try asking about saving, investing, cutting costs, or a specific goal.`;
}
