"use client";

import { useState } from "react";
import { DISCOVERY, type DiscoveryAnswers } from "@/lib/companion/discovery";

interface RevealData {
  dna: { label: string; emoji: string; coreDriver: string; strength: string; traits: string[] };
  summary: string;
  confidence: number;
}

export default function DiscoverView({
  alreadyDone,
  existingDna,
}: {
  alreadyDone: boolean;
  existingDna: { label: string; summary: string; confidence: number } | null;
}) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiscoveryAnswers>({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState<RevealData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Returning user who already has a DNA — show it, offer to redo.
  if (alreadyDone && existingDna && !started && !reveal) {
    return (
      <Shell>
        <RevealCard
          label={existingDna.label}
          emoji={"\u2728"}
          summary={existingDna.summary}
          confidence={existingDna.confidence}
        />
        <button onClick={() => { setStarted(true); setStep(0); setAnswers({}); }} style={ghostBtn}>
          Retake the discovery
        </button>
      </Shell>
    );
  }

  // Intro
  if (!started && !reveal) {
    return (
      <Shell>
        <div style={{ textAlign: "center", maxWidth: 520 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>{"\u{1F9EC}"}</div>
          <h1 className="font-space" style={{ fontSize: 30, fontWeight: 800, margin: "0 0 12px" }}>
            First, let me get to know you
          </h1>
          <p style={{ color: "#8a97ad", fontSize: 15.5, lineHeight: 1.6, marginBottom: 26 }}>
            Before we talk about money, I want to understand who you are. A few gentle questions —
            no statements, no numbers — and I'll reveal your <b style={{ color: "#e8edf6" }}>Financial DNA</b>.
            I'll remember it from then on.
          </p>
          <button onClick={() => setStarted(true)} style={primaryBtn}>
            Begin {"\u2192"}
          </button>
        </div>
      </Shell>
    );
  }

  // Reveal
  if (reveal) {
    return (
      <Shell>
        <RevealCard
          label={reveal.dna.label}
          emoji={reveal.dna.emoji}
          summary={reveal.summary}
          confidence={reveal.confidence}
          traits={reveal.dna.traits}
        />
        <div style={{ color: "#7a8699", fontSize: 12.5, marginTop: 4, textAlign: "center", maxWidth: 460 }}>
          This is a first read. As you use MoneyDNA, it gets to know you better and your DNA sharpens.
        </div>
      </Shell>
    );
  }

  // Conversation
  const q = DISCOVERY[step];
  const progress = Math.round((step / DISCOVERY.length) * 100);

  function commit(value: string | boolean) {
    const next = { ...answers, [q.id]: value } as DiscoveryAnswers;
    setAnswers(next);
    setText("");
    if (step < DISCOVERY.length - 1) setStep(step + 1);
    else submit(next);
  }

  async function submit(final: DiscoveryAnswers) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(final),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setReveal(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <div style={{ width: "100%", maxWidth: 540 }}>
        {/* progress */}
        <div style={{ height: 5, background: "rgba(255,255,255,.07)", borderRadius: 3, marginBottom: 26 }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg,#34d399,#22d3ee)", borderRadius: 3, transition: "width .3s" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 34, marginBottom: 12 }}>{"\u{1F9EC}"}</div>
            <div className="font-space" style={{ fontSize: 18, fontWeight: 700 }}>Reading your Financial DNA\u2026</div>
            <div style={{ color: "#8a97ad", fontSize: 13.5, marginTop: 6 }}>Getting to know who you are.</div>
          </div>
        ) : (
          <div key={step} style={{ animation: "mdFadeUp .35s ease both" }}>
            <div style={{ color: "#7fe9c4", fontSize: 13.5, marginBottom: 8 }}>{q.companionLine}</div>
            <h2 className="font-space" style={{ fontSize: 23, fontWeight: 700, margin: "0 0 22px", lineHeight: 1.3 }}>
              {q.prompt}
            </h2>

            {q.kind === "choice" && (
              <div style={{ display: "grid", gap: 10 }}>
                {q.options!.map((o) => (
                  <button key={o.value} onClick={() => commit(o.value)} style={optionBtn}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {q.kind === "boolean" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => commit(true)} style={{ ...optionBtn, flex: 1 }}>Yes</button>
                <button onClick={() => commit(false)} style={{ ...optionBtn, flex: 1 }}>No</button>
              </div>
            )}

            {q.kind === "text" && (
              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  style={{
                    width: "100%", padding: "13px 15px", borderRadius: 12,
                    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.14)",
                    color: "#e8edf6", fontSize: 15.5, outline: "none", resize: "vertical", fontFamily: "inherit",
                  }}
                />
                <button onClick={() => commit(text.trim())} disabled={!text.trim()} style={{ ...primaryBtn, marginTop: 14, width: "100%", opacity: text.trim() ? 1 : 0.5 }}>
                  Reveal my Financial DNA {"\u2728"}
                </button>
              </div>
            )}

            {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{error}</div>}
          </div>
        )}
      </div>
    </Shell>
  );
}

function RevealCard({ label, emoji, summary, confidence, traits }: { label: string; emoji: string; summary: string; confidence: number; traits?: string[] }) {
  return (
    <div style={{ width: "100%", maxWidth: 520, textAlign: "center", animation: "mdFadeUp .5s ease both" }}>
      <div style={{ color: "#7fe9c4", fontSize: 13, letterSpacing: ".5px", marginBottom: 6 }}>YOUR FINANCIAL DNA</div>
      <div style={{ fontSize: 52, marginBottom: 6 }}>{emoji}</div>
      <h1 className="font-space" style={{ fontSize: 34, fontWeight: 800, margin: "0 0 16px", color: "#34d399" }}>{label}</h1>
      {traits && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 18 }}>
          {traits.map((t) => (
            <span key={t} style={{ padding: "5px 12px", borderRadius: 20, background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.25)", color: "#7fe9c4", fontSize: 12.5 }}>{t}</span>
          ))}
        </div>
      )}
      <p style={{ color: "#dbe2ec", fontSize: 16, lineHeight: 1.65, marginBottom: 20 }}>{summary}</p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 20, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)" }}>
        <span style={{ color: "#8a97ad", fontSize: 12.5 }}>DNA confidence</span>
        <span className="font-space" style={{ color: "#34d399", fontWeight: 700, fontSize: 14 }}>{confidence}%</span>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "40px 24px" }}>
      {children}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  cursor: "pointer", padding: "13px 28px", borderRadius: 12, border: "none", fontWeight: 700,
  fontSize: 15.5, color: "#05110c", background: "linear-gradient(135deg,#34d399,#22d3ee)", fontFamily: "inherit",
};
const optionBtn: React.CSSProperties = {
  cursor: "pointer", textAlign: "left", padding: "14px 16px", borderRadius: 12,
  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)",
  color: "#e8edf6", fontSize: 15, fontFamily: "inherit",
};
const ghostBtn: React.CSSProperties = {
  cursor: "pointer", padding: "10px 18px", borderRadius: 10, background: "transparent",
  border: "1px solid rgba(255,255,255,.14)", color: "#8a97ad", fontSize: 13.5, fontFamily: "inherit",
};
