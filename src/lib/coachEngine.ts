import Anthropic from "@anthropic-ai/sdk";
import type { AnalyticsResult } from "@/lib/analytics";
import { kes } from "@/lib/format";
import { guardrailFor, type GuardrailCategory } from "@/lib/coachGuardrails";

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

const COMPANION_VOICE = `You are MoneyDNA's Financial Companion — not a chatbot, not a financial advisor, a trusted companion who helps people understand the financial choices available to them. You never judge, shame, lecture, or command. You never say "you should" or "you need to" — say "you could" or "one possibility is". You never say "wrong" — say "another approach may lead to". You show possibilities and respect that the decision always belongs to the user. Every interaction should leave them feeling more hopeful and confident, never guilty.`;

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
    `Flagged anomalies this month: ${anomalies}.`,
    `Spending DNA type: ${a.dna.typeName} — ${a.dna.explanation}`,
  ].join(" ");
}

export async function answerCoachQuestion(
  question: string,
  analytics: AnalyticsResult,
  history: { role: "user" | "assistant"; content: string }[],
  memoryContext?: string
): Promise<string> {
  // ---- GUARDRAILS run first (safety + intelligence layer) ----
  const guard = guardrailFor(question);
  if (guard?.blockLLM && guard.response) {
    // Hard guardrail (e.g. crisis): return the safe reply without calling the model.
    return mdBoldToHtml(guard.response);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await answerWithClaude(question, analytics, history, apiKey, guard?.systemNote, memoryContext);
    } catch (err) {
      console.error("[coachEngine] Claude API call failed, falling back to rule-based engine:", err);
    }
  }

  // If a soft guardrail applied but the model is unavailable, use a safe category
  // fallback instead of the generic rule-based engine (which could over-advise).
  if (guard && !guard.blockLLM) return mdBoldToHtml(softFallback(guard.category, analytics));

  return ruleBasedAnswer(question, analytics);
}

async function answerWithClaude(
  question: string,
  analytics: AnalyticsResult,
  history: { role: "user" | "assistant"; content: string }[],
  apiKey: string,
  guardNote?: string,
  memoryContext?: string
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const base = `You are the Wealth Coach inside MoneyDNA AI, a personal/small-business finance app. Answer the user's question about their money using ONLY the financial summary below — be concrete, cite real numbers from it, and keep replies under 90 words. You are a warm, encouraging COMPANION, not a judge and not a licensed advisor: guide and educate, never dictate. Promote a strong saving culture (pay-yourself-first, automatic transfers, emergency funds). Use **double asterisks** for the 2-4 most important numbers/phrases so they render bold. Do not invent numbers not implied by the summary.`;
  const system =
    base +
    (memoryContext ? `\n\n${memoryContext}` : "") +
    (guardNote ? `\n\n${guardNote}` : "") +
    `\n\nFINANCIAL SUMMARY:\n${summarize(analytics)}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 400,
    system,
    messages: [...history.slice(-8).map((h) => ({ role: h.role, content: h.content })), { role: "user" as const, content: question }],
  });
  const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
  return mdBoldToHtml(text || "I couldn't come up with an answer just now — try rephrasing?");
}

/** Safe, guardrail-respecting replies used only when the LLM is unavailable. */
function softFallback(category: GuardrailCategory, a: AnalyticsResult): string {
  switch (category) {
    case "REGULATED_ADVICE":
      return `I can't tell you to buy any specific product — I'm a guide, not a licensed advisor. What I can do is help you weigh the trade-offs (fees, risk, liquidity, whether it's CMA-regulated, and scam red-flags). For a specific pick tailored to you, a licensed advisor is the right call.`;
    case "BLIND_SPOT":
      return `From the statement I can see, you saved **${a.savingsRate.toFixed(0)}%** this period. But I only see this one statement — not your other accounts, cash, SACCO, assets or any mobile loans — so treat this as a trendline, not your full net worth. Add your other accounts and I'll sharpen it.`;
    case "FALSE_PRECISION":
      return `I can't give an exact figure — the future depends on returns, income and life that nobody can predict. I can show a **range** with clear assumptions instead. Want me to sketch a low/likely/high path?`;
    case "BLACK_TAX":
      return `Supporting family is real and valid — the goal isn't to stop, it's to make it **intentional**. Decide a set monthly family-support amount in advance so your own goals still get funded and giving stops being an unplanned leak.`;
    case "EMOTIONAL_DISTRESS":
      return `That's a heavy feeling, and struggling with money is far more common than it looks — it's not a character flaw. Let's not fix everything today; just pick **one small step**. If it feels bigger than money alone, talking to someone you trust really helps.`;
    case "DEBT_TRAP":
      return `If high-interest loans are in the mix, don't worry about investing yet — clearing them **is** your best return. Stop new borrowing, list the balances, and attack the priciest one first, keeping just a small buffer. This is a cycle to break, not a failing.`;
    default:
      return ruleBasedAnswer("", a);
  }
}

function ruleBasedAnswer(question: string, a: AnalyticsResult): string {
  const k = question.toLowerCase().trim();
  const b = (s: string) => `<b>${s}</b>`;

  if (!a.hasData) {
    return `I don't have a statement to read yet — upload one (or use the sample dataset) and I'll ground every answer in your real numbers.`;
  }

  if (/^(hi|hello|hey|sup|yo|good (morning|afternoon|evening))\b/.test(k) || k.length <= 3) {
    return `Hey! I've read your ${a.periodLabel.toLowerCase()} statement — saved ${b(a.savingsRate.toFixed(0) + "%")} of income, health score ${b(a.health.score + "/100")}. Ask me about saving, spending, investing, or a goal — or tap a suggestion below.`;
  }

  if (/\binvest/.test(k)) {
    const investCat = a.categories.find((c) => c.name === "Investments");
    const idleCash = Math.max(0, a.kpis.net * 0.4);
    return investCat
      ? `You already put ${b(kes(investCat.amount))} into investments this month — solid. Beyond that, idle savings above your emergency-fund target could go into a money-market fund earning ~10%/year risk-free.`
      : `You're not investing yet, but you saved ${b(kes(a.kpis.net))} this month. Once your emergency fund covers 3 months of expenses, moving surplus (roughly ${b(kes(idleCash) + "/month")}) into a money-market fund or index tracker is a solid next step — low effort, real growth.`;
  }

  if (/\bsav\w*/.test(k) && /\d/.test(k)) {
    const target = parseInt(k.match(/\d[\d,]*/)?.[0].replace(/,/g, "") ?? "10000", 10);
    const cat = a.categories[0];
    return `To free up ${b(kes(target) + "/month")}: trimming ${cat ? cat.name : "your top category"} by 15% and cancelling one unused subscription gets you most of the way there. You're already saving ${b(a.savingsRate.toFixed(0) + "%")} of income — this would push it higher and compound to ${b(kes(target * 12))} a year.`;
  }

  if (/\bsav\w*/.test(k)) {
    const cat = a.categories[0];
    const headroom = Math.max(0, 30 - a.savingsRate);
    return a.savingsRate >= 25
      ? `You're already saving well — ${b(a.savingsRate.toFixed(0) + "%")} of income, above the 20% benchmark. To push further, ${cat ? `${cat.name} (${kes(cat.amount)})` : "your top category"} has the most room without touching essentials.`
      : `Yes — a realistic next step is trimming ${cat ? b(cat.name) : "your top category"}${cat ? ` (${kes(cat.amount)})` : ""} by 10-15%. That alone could lift your savings rate by roughly ${b(headroom.toFixed(0) + " points")}, worth ${b(kes((headroom / 100) * a.kpis.income))} a month.`;
  }

  if (k.includes("where") || k.includes("going")) {
    const top = a.categories.slice(0, 3).map((c) => `${c.name} (${kes(c.amount)})`).join(", ");
    return `Your biggest outflows this month: ${b(top)}. ${a.anomalies.length ? `Worth a look: ${a.anomalies[0].title.toLowerCase()}.` : "Nothing unusual jumps out."}`;
  }
  if (k.includes("overspend")) {
    return a.savingsRate >= 20
      ? `You're ${b("not overspending overall")} — you saved ${a.savingsRate.toFixed(0)}% of income, above the 20% benchmark. ${a.anomalies.length ? `One pocket to watch: ${a.anomalies[0].title.toLowerCase()}.` : ""}`
      : `Your savings rate is ${b(a.savingsRate.toFixed(0) + "%")}, below the 20% healthy benchmark — worth tightening ${a.categories[0]?.name ?? "your top category"}.`;
  }
  if (k.includes("continue") || k.includes("happen") || k.includes("lifestyle") || k.includes("future") || k.includes("projection")) {
    const yearly = a.kpis.net * 12;
    return `If you hold this exact pattern for 12 months, you'd save roughly ${b(kes(Math.max(0, yearly)))}. ${a.goals[0] ? `Redirect a little more toward ${a.goals[0].name} and you'd reach it faster.` : ""}`;
  }
  if (k.includes("cut") || k.includes("which expense") || k.includes("reduce") || k.includes("lower") || k.includes("trim")) {
    const cats = a.categories.slice(1, 4).map((c) => c.name).join(", ");
    return `I'd start with ${b(cats || "your discretionary categories")} — they're sizeable but usually have the most slack, with the least lifestyle impact.`;
  }
  if (k.includes("saving culture") || k.includes("habit") || k.includes("routine") || k.includes("discipline")) {
    return `Building a saving culture is about automation: ${b("pay yourself first")} — move a fixed % to savings the moment income lands, keep an emergency fund growing (${a.goals.find((g) => /emergency/i.test(g.name)) ? "yours is underway" : "start one this month"}), then route any surplus into something that earns. Small, automatic, relentless.`;
  }
  if (k.includes("build") && !k.includes("business")) {
    return `Building a saving culture is about automation: ${b("pay yourself first")} — move a fixed % to savings the moment income lands, keep an emergency fund growing, then route surplus into something that earns. Small, automatic, relentless.`;
  }
  if (k.includes("goal")) {
    if (!a.goals.length) return `You don't have any savings goals set up yet — add one from the Dashboard ("+ New goal") and I'll track your progress and pace toward it.`;
    const lines = a.goals.map((g) => `${g.name}: ${b(g.progressPct.toFixed(0) + "%")} there (${kes(g.current)} of ${kes(g.target)})`).join("; ");
    return `Your goals: ${lines}. At this month's saving pace you're moving in the right direction — want me to work out how many months are left on any one of them?`;
  }
  if (k.includes("health") || k.includes("score")) {
    const top = [...a.health.parts].sort((x, y) => y.value - x.value)[0];
    const bottom = [...a.health.parts].sort((x, y) => x.value - y.value)[0];
    return `Your financial health score is ${b(a.health.score + "/100")}. Strongest signal: ${b(top?.label ?? "savings behaviour")}. Weakest: ${b(bottom?.label ?? "spending volatility")} — that's the one to focus on next.`;
  }
  if (k.includes("net worth") || k.includes("networth")) {
    return `Based on your cumulative saved cashflow so far, you're sitting around ${b(kes(a.netWorth))}. That's an estimate from your transaction history, not a full asset/liability picture — treat it as a savings trendline rather than a bank statement.`;
  }
  if (/make more money|earn more|increase (my )?income|side hustle|extra income/.test(k)) {
    return `I can only see your spending side, not new income streams — that's a "you" call, not a numbers one. What I can say from your data: your biggest recurring drain is ${b(a.categories[0]?.name ?? "your top category")} (${kes(a.categories[0]?.amount ?? 0)}) — freeing that up has the same effect on your bottom line as earning more, without needing a new income source.`;
  }
  if (/^(can you |could you )?help( me)?\b|what can (you|i) (do|ask)|what do you do/.test(k)) {
    return `I can answer things like: ${b("where is my money going")}, ${b("am I overspending")}, ${b("how can I save KES X monthly")}, ${b("what are my goals")}, or ${b("how healthy is my score")} — all grounded in your real ${a.periodLabel.toLowerCase()} data. Try one, or tap a suggestion below.`;
  }

  return `Not sure I've got a specific answer for "${question}" — but here's where things stand: income ${b(kes(a.kpis.income))}, expenses ${b(kes(a.kpis.expenses))}, saved ${b(kes(a.kpis.net) + ` (${a.savingsRate.toFixed(0)}%)`)}, health score ${b(a.health.score + "/100")}. Try asking about saving, investing, cutting costs, or a specific goal.`;
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
