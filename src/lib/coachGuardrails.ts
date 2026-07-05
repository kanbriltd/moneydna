/**
 * MoneyDNA — Coach Guardrails
 * ---------------------------
 * The "when the user asks X → respond like Y" safety + intelligence layer that
 * sits IN FRONT of the AI coach. It does two jobs:
 *
 *   1. HARD guardrails  → return a safe, pre-written reply WITHOUT calling the LLM
 *                         (crisis, specific regulated advice). blockLLM = true.
 *   2. SOFT guardrails  → let the LLM answer, but inject a `systemNote` that forces
 *                         the right framing (honesty about blind spots, ranges not
 *                         promises, cultural sensitivity). blockLLM = false.
 *
 * This is the core of "safer AND smarter": the product wins on how gracefully it
 * handles what it CANNOT see, CANNOT promise, and SHOULD NOT advise.
 */

export type GuardrailCategory =
  | "CRISIS"
  | "REGULATED_ADVICE"
  | "BLIND_SPOT"
  | "FALSE_PRECISION"
  | "BLACK_TAX"
  | "EMOTIONAL_DISTRESS"
  | "DEBT_TRAP";

export interface GuardrailHit {
  category: GuardrailCategory;
  blockLLM: boolean;
  /** Used directly as the reply when blockLLM is true. */
  response?: string;
  /** Appended to the LLM system prompt when blockLLM is false. */
  systemNote?: string;
}

const has = (k: string, ...words: string[]) => words.some((w) => k.includes(w));
const re = (k: string, r: RegExp) => r.test(k);

/**
 * Returns the first matching guardrail, or null if the question is ordinary.
 * Order matters: crisis and regulated advice are checked before softer cases.
 */
export function guardrailFor(question: string): GuardrailHit | null {
  const k = question.toLowerCase();

  // 1) CRISIS — emotional safety always comes before money. Never do a budget here.
  if (
    re(k, /\b(kill myself|end (it|my life)|suicid|don'?t want to (live|be here)|no reason to live|harm myself|hopeless|can'?t go on|better off dead)\b/)
  ) {
    return {
      category: "CRISIS",
      blockLLM: true,
      response:
        "I'm really glad you told me, and I want to pause the money talk for a second — because you matter a lot more than any number here. " +
        "I'm just an app and not the right kind of help for how heavy this feels, but you don't have to carry it alone. " +
        "Please reach out to someone you trust, or talk to a professional who can properly support you. " +
        "If things feel unsafe right now, contacting a local mental-health or emergency line in Kenya is a real and okay step to take. " +
        "I'm here for your money whenever you're ready — but right now, your wellbeing comes first.",
    };
  }

  // 2) REGULATED / SPECIFIC-PRODUCT ADVICE — guide & educate, never direct or endorse.
  if (
    re(k, /\bshould i (buy|invest in|put my money in|get into)\b/) ||
    has(k, "which stock", "which fund", "which mmf", "which sacco", "which coin", "which crypto") ||
    re(k, /\b(bitcoin|crypto|forex|shares?|stocks?)\b.*\b(buy|invest|good|worth it)\b/) ||
    has(k, "avoid tax", "evade tax", "reduce my kra", "dodge kra", "less tax")
  ) {
    return {
      category: "REGULATED_ADVICE",
      blockLLM: false,
      systemNote:
        "GUARDRAIL (regulated advice): The user is asking for a specific investment/tax recommendation. You are a guide, NOT a licensed financial or tax advisor. " +
        "Do NOT endorse or tell them to buy any specific product, fund, stock, coin, or scheme. Instead: (a) explain how to evaluate that CATEGORY and its trade-offs/risks, " +
        "(b) name what to check (fees, regulation/CMA licensing, liquidity, track record, and scam red-flags), (c) end by noting this is education, not personalised advice, and a licensed advisor/tax professional can tailor it. Keep the warm companion tone.",
    };
  }

  // 3) BLIND SPOT — the app only sees ONE statement; be honest about what it can't see.
  if (
    has(k, "net worth", "networth", "how much am i worth", "on track", "am i on track", "financial freedom", "retire", "where did all my money", "where is all my money") ||
    re(k, /\b(am i doing (well|ok|fine)|will i be (ok|fine|rich))\b/)
  ) {
    return {
      category: "BLIND_SPOT",
      blockLLM: false,
      systemNote:
        "GUARDRAIL (blind spot): Answer ONLY from the visible statement data, then be explicitly honest that this is a partial picture. " +
        "State plainly that you can't see other accounts, cash spending, SACCO/chama, assets, or hidden debt (Fuliza/Tala/loans), so this is a trend from what was shared — not a full net-worth or life verdict. " +
        "Invite them to add other accounts to sharpen it. Never imply certainty you don't have.",
    };
  }

  // 4) FALSE PRECISION — the future is unknowable; give ranges, not prophecies.
  if (re(k, /\b(exactly|exact|precisely)\b/) && has(k, "free", "retire", "have", "worth", "when")) {
    return {
      category: "FALSE_PRECISION",
      blockLLM: false,
      systemNote:
        "GUARDRAIL (false precision): Never give a single exact future figure or date. Give a RANGE, state the key assumptions (return rate, that they keep saving, no shocks), and frame it as 'one possible path', not a guarantee.",
    };
  }

  // 5) BLACK TAX — family/dependant pressure. Honour the culture; don't shame.
  if (
    has(k, "black tax", "family keeps asking", "family asks me for money", "send money home", "support my family", "relatives ask", "everyone asks me for money", "can't say no")
  ) {
    return {
      category: "BLACK_TAX",
      blockLLM: false,
      systemNote:
        "GUARDRAIL (black tax): Family financial support is a deeply real, valid obligation in Kenya — acknowledge that FIRST and never say 'just stop giving'. " +
        "Offer STRUCTURE, not guilt: suggest a set monthly 'family support' amount they decide in advance so giving is intentional and their own goals still get funded. Warm, non-judgemental, practical.",
    };
  }

  // 6) EMOTIONAL DISTRESS (money-related, sub-crisis) — comfort first, one small step.
  if (
    has(k, "feel like a failure", "failure", "ashamed", "embarrassed", "stressed", "anxious", "can't sleep", "cant sleep", "overwhelmed", "drowning", "scared", "worried sick", "hate myself") ||
    re(k, /\bi (feel|am) (so )?(bad|terrible|stupid|worthless)\b/)
  ) {
    return {
      category: "EMOTIONAL_DISTRESS",
      blockLLM: false,
      systemNote:
        "GUARDRAIL (emotional distress): Lead with genuine acknowledgement of the FEELING before any numbers. Do NOT lecture, do NOT pile on data, do NOT give false praise. " +
        "Reframe gently toward progress-not-perfection, offer ONE small, doable next step, and remind them that struggling with money is common and not a character flaw. Keep it short and human. " +
        "If the feeling sounds heavier than money alone, gently suggest talking to someone they trust.",
    };
  }

  // 7) DEBT TRAP — don't tell someone in a loan spiral to 'save 20%'.
  if (
    (has(k, "fuliza", "tala", "branch", "shylock", "mshwari loan", "okoa", "loan app", "digital loan") && has(k, "save", "invest", "trap", "stuck", "spiral", "help")) ||
    re(k, /\b(stuck|trapped|spiral)\b.*\b(loan|debt|fuliza|tala)\b/)
  ) {
    return {
      category: "DEBT_TRAP",
      blockLLM: false,
      systemNote:
        "GUARDRAIL (debt trap): If the user is servicing high-interest mobile loans, do NOT advise investing or 'save 20%' first. Prioritise DEBT TRIAGE: stop new borrowing, list balances, attack the highest-interest one, keep only a tiny buffer. " +
        "Clearing 100%+ APR debt is a guaranteed return no fund beats. Be encouraging, not preachy — this is a cycle to break, not a moral failing.",
    };
  }

  return null;
}
