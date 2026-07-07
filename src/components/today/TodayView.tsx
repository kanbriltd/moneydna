"use client";

import { useEffect, useState } from "react";
import { kes } from "@/lib/format";

interface Decision {
  id: string;
  kind: string;
  title: string;
  body: string;
  insight: string;
  why: string;
  basedOn: string; // JSON array of strings
  band: string; // high | medium | low
  historyNote: string | null;
  estimatedImpact: number;
  goalName: string | null;
  status: string;
}

const SKIP_REASONS = [
  { value: "forgot", label: "Forgot" },
  { value: "couldnt_afford", label: "Couldn't afford it" },
  { value: "disagreed", label: "Didn't agree" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" },
] as const;

const BAND: Record<string, { color: string; label: string; note: string }> = {
  high: { color: "#49e6b3", label: "High confidence", note: "Grounded in your own repeated behaviour." },
  medium: { color: "#e8c987", label: "Medium confidence", note: "Based on your situation and some history." },
  low: { color: "#9aa7b8", label: "Low confidence", note: "This is based mostly on your goals and Financial DNA — we don't have enough history yet." },
};

const GOLD = "#d9b36c";
const GOLD_SOFT = "#e8c987";
const HOPE = "#49e6b3";
const INK_TEXT = "#f5f6fa";

export default function TodayView({
  firstName,
  needsDiscovery,
  needsSituation,
  dnaLabel,
  discipline,
  showWeekly,
  dayTogether,
  memoryQuote,
}: {
  firstName: string;
  needsDiscovery: boolean;
  needsSituation: boolean;
  dnaLabel: string | null;
  discipline: number;
  showWeekly: boolean;
  dayTogether: number;
  memoryQuote: string | null;
}) {
  const [situationDone, setSituationDone] = useState(!needsSituation);

  if (needsDiscovery) {
    return (
      <Shell firstName={firstName}>
        <div style={{ textAlign: "center", padding: "48px 10px 20px", animation: "mdFadeUp .6s ease both" }}>
          <div style={{ fontSize: 36, marginBottom: 20 }}>🧬</div>
          <h1 className="font-serif-display" style={{ fontSize: 34, fontWeight: 500, color: INK_TEXT, margin: "0 0 14px", lineHeight: 1.2 }}>
            Before your first move,
            <br />
            let me get to know you.
          </h1>
          <p style={{ color: "#93a0b4", fontSize: 15.5, lineHeight: 1.7, margin: "0 auto 30px", maxWidth: 400 }}>
            Your story, your temperament, what a good life looks like to you. Two minutes — no numbers required.
          </p>
          <a href="/discover" className="md-btn-primary" style={goldBtn}>
            Discover my Financial DNA →
          </a>
        </div>
      </Shell>
    );
  }

  if (!situationDone) {
    return (
      <Shell firstName={firstName}>
        <SituationForm firstName={firstName} onDone={() => setSituationDone(true)} />
      </Shell>
    );
  }

  return (
    <Shell firstName={firstName} dayTogether={dayTogether} memoryQuote={memoryQuote}>
      <BestMove dnaLabel={dnaLabel} discipline={discipline} />
      {showWeekly && <WeeklyCard />}
    </Shell>
  );
}

/* ------------------------------- Shell -------------------------------- */
function Shell({
  firstName,
  dayTogether,
  memoryQuote,
  children,
}: {
  firstName: string;
  dayTogether?: number;
  memoryQuote?: string | null;
  children: React.ReactNode;
}) {
  const day = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div style={{ position: "relative", minHeight: "100%" }}>
      <HelixBackdrop />
      <div style={{ position: "relative", zIndex: 1, padding: "26px 22px 70px", maxWidth: 620, margin: "0 auto" }}>
        {/* Quiet hello */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, animation: "mdFadeUp .5s ease both" }}>
          <div>
            <div className="font-mono-jb" style={{ color: GOLD, fontSize: 11.5, letterSpacing: "2.5px", fontWeight: 600 }}>
              A QUIET HELLO, {firstName.toUpperCase()}
            </div>
            <div style={{ color: "#7d8aa0", fontSize: 13, marginTop: 5 }}>{day}</div>
          </div>
          <span style={{ color: GOLD, fontSize: 17, opacity: 0.85 }}>✧</span>
        </div>

        {/* Memory line */}
        {dayTogether != null && memoryQuote && (
          <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: 22, animation: "mdFadeUp .55s ease .06s both", flexWrap: "wrap" }}>
            <span className="font-num" style={{ color: HOPE, fontSize: 11, letterSpacing: "1.8px", fontWeight: 600, flexShrink: 0 }}>
              DAY {dayTogether} TOGETHER
            </span>
            <span className="font-serif-display" style={{ color: "#a8b3c5", fontSize: 14, fontStyle: "italic", lineHeight: 1.6, flex: 1, minWidth: 220 }}>
              You once told us: &ldquo;{memoryQuote}&rdquo; — we haven&rsquo;t forgotten.
            </span>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

/** A faint double-helix behind the hero — identity woven into the page. */
function HelixBackdrop() {
  return (
    <svg
      viewBox="0 0 320 900"
      preserveAspectRatio="xMidYMin slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none" }}
    >
      <path d="M110 0 C 240 110, 240 210, 110 320 C -20 430, -20 530, 110 640 C 240 750, 240 850, 110 960" stroke={GOLD_SOFT} strokeWidth="2" fill="none" />
      <path d="M210 0 C 80 110, 80 210, 210 320 C 340 430, 340 530, 210 640 C 80 750, 80 850, 210 960" stroke={HOPE} strokeWidth="2" fill="none" />
      {[60, 160, 260, 380, 480, 580, 700, 800].map((y) => (
        <line key={y} x1="120" y1={y} x2="200" y2={y} stroke="#9aa7b8" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* --------------------------- Today's Best Move --------------------------- */
function BestMove({ dnaLabel, discipline }: { dnaLabel: string | null; discipline: number }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [askReason, setAskReason] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/decision");
        const j = await res.json();
        setDecision(j.decision);
        setAnswered(j.alreadyAnswered);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function respond(followed: boolean, reason?: string) {
    setAnswered(true);
    setAskReason(false);
    try {
      await fetch("/api/decision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ followed, reason }) });
    } catch {
      /* optimistic */
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "#8a97ad", fontSize: 16 }}>
        <div style={{ marginBottom: 14, fontSize: 20, color: HOPE, opacity: 0.85, animation: "mdStarBreathe 2.4s ease-in-out infinite" }}>✦</div>
        <span className="font-display" style={{ fontStyle: "italic", fontSize: 19 }}>
          Finding today&rsquo;s best move…
        </span>
      </div>
    );
  }
  if (!decision) return null;

  const band = BAND[decision.band] ?? BAND.low;
  let basedOn: string[] = [];
  try {
    basedOn = JSON.parse(decision.basedOn || "[]");
  } catch {
    basedOn = [];
  }

  return (
    <div style={{ textAlign: "center" }}>
      {/* Label */}
      <div className="font-mono-jb" style={{ color: GOLD, fontSize: 11.5, letterSpacing: "3px", fontWeight: 600, margin: "26px 0 20px", animation: "mdFadeUp .55s ease .1s both" }}>
        TODAY&apos;S BEST MOVE
      </div>

      {/* Serif headline */}
      <h1
        className="font-serif-display"
        style={{ fontSize: "clamp(30px, 6vw, 42px)", fontWeight: 500, color: INK_TEXT, lineHeight: 1.18, margin: "0 0 18px", letterSpacing: "-.3px", animation: "mdFadeUp .6s ease .15s both" }}
      >
        {decision.title}
      </h1>

      {/* Body */}
      {decision.body && (
        <p style={{ color: "#93a0b4", fontSize: 15.5, lineHeight: 1.7, margin: "0 auto 30px", maxWidth: 430, animation: "mdFadeUp .6s ease .2s both" }}>
          {decision.body}
        </p>
      )}

      {/* Impact — the golden number */}
      {decision.estimatedImpact > 0 && (
        <div
          className="md-gold-glow"
          style={{
            display: "inline-block",
            padding: "24px 48px",
            borderRadius: 22,
            background: "linear-gradient(180deg,rgba(20,26,40,.92),rgba(13,18,30,.92))",
            border: "1px solid rgba(201,163,92,.28)",
            margin: "0 0 28px",
            animation: "mdFadeUp .6s ease .25s both",
          }}
        >
          <div className="font-num" style={{ fontSize: 34, fontWeight: 600, color: GOLD_SOFT, letterSpacing: "0" }}>
            {kes(decision.estimatedImpact)}
          </div>
          <div style={{ color: "#8a97ad", fontSize: 12.5, marginTop: 6 }}>
            <span style={{ color: HOPE }}>↗</span> → {decision.goalName ? decision.goalName : "your future"}
          </div>
        </div>
      )}

      {/* Insight line */}
      {decision.insight && (
        <div className="font-serif-display" style={{ color: "#c6cfdc", fontSize: 15, fontStyle: "italic", margin: "0 0 34px", animation: "mdFadeUp .6s ease .3s both" }}>
          <span style={{ color: GOLD, fontStyle: "normal" }}>✧</span> {decision.insight}
        </div>
      )}

      {/* Why this matters */}
      <div
        style={{
          textAlign: "left",
          borderRadius: 24,
          padding: "26px 28px",
          background: "linear-gradient(180deg,rgba(17,23,37,.85),rgba(12,17,28,.85))",
          border: "1px solid rgba(255,255,255,.07)",
          boxShadow: "0 30px 70px -30px rgba(0,0,0,.7)",
          animation: "mdFadeUp .6s ease .35s both",
        }}
      >
        <div className="font-mono-jb" style={{ color: "#8a97ad", fontSize: 10.5, letterSpacing: "2.5px", marginBottom: 14 }}>
          WHY THIS MATTERS
        </div>

        <div style={{ color: "#7d8aa0", fontSize: 12.5, marginBottom: 6 }}>Today&apos;s move helps because:</div>
        <p style={{ color: "#d5dce7", fontSize: 14.5, lineHeight: 1.75, margin: "0 0 18px" }}>{decision.why}</p>

        {decision.estimatedImpact > 0 && (
          <>
            <div style={{ color: "#7d8aa0", fontSize: 12.5, marginBottom: 4 }}>Potential impact:</div>
            <p style={{ color: "#d5dce7", fontSize: 14.5, margin: "0 0 18px" }}>
              ≈ {kes(decision.estimatedImpact)} stays aligned with your future.
            </p>
          </>
        )}

        <div style={{ height: 1, background: "rgba(255,255,255,.07)", margin: "4px 0 16px" }} />

        {/* Confidence */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
          <span style={{ color: band.color, fontSize: 13, marginTop: 1 }}>⛨</span>
          <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
            <span style={{ color: band.color, fontWeight: 700 }}>{band.label}</span>
            <span style={{ color: "#8a97ad" }}> · {decision.historyNote || band.note}</span>
          </div>
        </div>

        {/* Based on */}
        <div style={{ display: "grid", gap: 5 }}>
          {basedOn.map((line, i) => (
            <div key={i} style={{ color: "#9aa7bd", fontSize: 12.5, lineHeight: 1.5 }}>
              {line.startsWith("✓") ? line : `✓ ${line}`}
            </div>
          ))}
        </div>
      </div>

      {/* The decision */}
      {answered ? (
        <div className="font-serif-display" style={{ color: "#93a0b4", fontSize: 15, fontStyle: "italic", margin: "30px 0 6px", animation: "mdFadeUp .5s ease both" }}>
          Done — that&rsquo;s a step taken. See you tomorrow.
        </div>
      ) : !askReason ? (
        <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "center", animation: "mdFadeUp .6s ease .4s both" }}>
          <button onClick={() => respond(true)} className="md-btn-primary" style={goldBtn}>
            I&apos;ll do it
          </button>
          <button onClick={() => setAskReason(true)} className="md-btn-ghost" style={quietBtn}>
            Not today
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 26, animation: "mdFadeUp .3s ease both" }}>
          <div style={{ color: "#8a97ad", fontSize: 13, marginBottom: 10 }}>No worries — what got in the way?</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {SKIP_REASONS.map((r) => (
              <button key={r.value} onClick={() => respond(false, r.value)} className="md-btn-ghost" style={chipBtn}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Identity footnote */}
      {dnaLabel && (
        <div style={{ color: "#5d6b80", fontSize: 12, marginTop: 34 }}>
          {dnaLabel} · Discipline {discipline}/100
        </div>
      )}
    </div>
  );
}

/* --------------------------- Situation form --------------------------- */
function SituationForm({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [payday, setPayday] = useState("");
  const [exp1, setExp1] = useState("");
  const [hasDebt, setHasDebt] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome: income ? Number(income.replace(/[^\d]/g, "")) : undefined,
          monthlySavings: savings ? Number(savings.replace(/[^\d]/g, "")) : undefined,
          paydayDay: payday ? Number(payday) : undefined,
          topExpense1: exp1 || undefined,
          hasDebt: hasDebt ?? false,
        }),
      });
      if (!res.ok) throw new Error("Could not save. Try again.");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ animation: "mdFadeUp .55s ease both" }}>
      <h1 className="font-serif-display" style={{ fontSize: 30, fontWeight: 500, color: INK_TEXT, margin: "18px 0 10px", textAlign: "center", lineHeight: 1.25 }}>
        A little about your money, {firstName}
      </h1>
      <p style={{ color: "#93a0b4", fontSize: 14.5, lineHeight: 1.65, margin: "0 auto 28px", textAlign: "center", maxWidth: 400 }}>
        Just enough for a real move each morning — no statements needed. You can change these anytime.
      </p>
      <div
        style={{
          borderRadius: 24,
          padding: "26px 26px",
          background: "linear-gradient(180deg,rgba(17,23,37,.85),rgba(12,17,28,.85))",
          border: "1px solid rgba(255,255,255,.07)",
        }}
      >
        <Field label="Roughly, your monthly income (KES)">
          <Input value={income} onChange={setIncome} placeholder="e.g. 60000" />
        </Field>
        <Field label="About how much do you save a month? (KES)">
          <Input value={savings} onChange={setSavings} placeholder="e.g. 8000" />
        </Field>
        <Field label="What day of the month are you usually paid?">
          <Input value={payday} onChange={setPayday} placeholder="e.g. 28" />
        </Field>
        <Field label="Your biggest monthly expense">
          <Input value={exp1} onChange={setExp1} placeholder="e.g. Rent, Food, Transport" text />
        </Field>
        <Field label="Do you currently have any debt?">
          <div style={{ display: "flex", gap: 8 }}>
            <Choice active={hasDebt === true} onClick={() => setHasDebt(true)}>
              Yes
            </Choice>
            <Choice active={hasDebt === false} onClick={() => setHasDebt(false)}>
              No
            </Choice>
          </div>
        </Field>
        <button onClick={save} disabled={saving} className="md-btn-primary" style={{ ...goldBtn, width: "100%", marginTop: 8, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "Show me today's best move →"}
        </button>
        {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>
    </div>
  );
}

/* --------------------------- Weekly story ---------------------------- */
function WeeklyCard() {
  const [data, setData] = useState<{ headline: string; story: string[] } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/weekly");
        setData(await res.json());
      } catch {
        /* ignore */
      }
    })();
  }, []);
  if (!data) return null;
  return (
    <div
      style={{
        marginTop: 26,
        textAlign: "left",
        borderRadius: 24,
        padding: "26px 28px",
        background: "linear-gradient(180deg,rgba(24,19,38,.85),rgba(14,12,24,.85))",
        border: "1px solid rgba(163,113,247,.16)",
      }}
    >
      <div className="font-mono-jb" style={{ color: "#c4a8ff", fontSize: 10.5, letterSpacing: "2.5px", marginBottom: 12 }}>
        YOUR WEEK
      </div>
      <h3 className="font-serif-display" style={{ fontSize: 21, fontWeight: 500, color: INK_TEXT, margin: "0 0 12px" }}>
        {data.headline}
      </h3>
      {data.story.map((line, i) => (
        <p key={i} style={{ color: "#c3cddb", fontSize: 14.5, lineHeight: 1.7, margin: "0 0 7px" }}>
          {line}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------ atoms ------------------------------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <label style={{ display: "block", color: "#a7b2c4", fontSize: 13.5, fontWeight: 600, marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder, text }: { value: string; onChange: (v: string) => void; placeholder?: string; text?: boolean }) {
  return (
    <input
      inputMode={text ? "text" : "numeric"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="md-input"
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.12)",
        color: "#e8edf6",
        fontSize: 15,
        outline: "none",
      }}
    />
  );
}
function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="md-btn-ghost"
      style={{
        flex: 1,
        cursor: "pointer",
        padding: "11px",
        borderRadius: 12,
        fontSize: 14.5,
        fontWeight: 600,
        background: active ? "rgba(201,163,92,.14)" : "rgba(255,255,255,.04)",
        border: `1px solid ${active ? "rgba(201,163,92,.4)" : "rgba(255,255,255,.12)"}`,
        color: active ? GOLD_SOFT : "#a7b2c4",
      }}
    >
      {children}
    </button>
  );
}

const goldBtn: React.CSSProperties = {
  cursor: "pointer",
  display: "inline-block",
  padding: "14px 30px",
  borderRadius: 13,
  border: "1px solid rgba(201,163,92,.5)",
  fontWeight: 700,
  fontSize: 15,
  color: "#0a0d14",
  background: `linear-gradient(135deg,${GOLD_SOFT},${GOLD})`,
  textDecoration: "none",
  fontFamily: "inherit",
  boxShadow: "0 10px 30px -8px rgba(201,163,92,.4)",
};
const quietBtn: React.CSSProperties = {
  cursor: "pointer",
  padding: "14px 30px",
  borderRadius: 13,
  background: "transparent",
  border: "1px solid rgba(255,255,255,.14)",
  color: "#a7b2c4",
  fontSize: 15,
  fontWeight: 600,
  fontFamily: "inherit",
};
const chipBtn: React.CSSProperties = {
  cursor: "pointer",
  padding: "9px 15px",
  borderRadius: 10,
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "#a7b2c4",
  fontSize: 13,
  fontFamily: "inherit",
};
