"use client";

import { useState } from "react";
import type { Blueprint } from "@/lib/salaryBlueprint";
import { kes } from "@/lib/format";

interface ApiResp {
  blueprint: Blueprint;
  narrative: string;
  detectedIncome: number;
}

export default function BlueprintView({ detectedIncome, userName }: { detectedIncome: number; userName: string }) {
  const [salary, setSalary] = useState<string>(detectedIncome ? String(detectedIncome) : "");
  const [irregular, setIrregular] = useState(false);
  const [debt, setDebt] = useState(false);
  const [dependents, setDependents] = useState(false);
  const [emergencyFunded, setEmergencyFunded] = useState(false);
  const [ageStr, setAgeStr] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResp | null>(null);

  async function generate() {
    const s = Number(salary.replace(/[^\d]/g, ""));
    if (!s || s <= 0) {
      setError("Enter your monthly income to build a blueprint.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary: s,
          context: {
            incomeType: irregular ? "irregular" : "salaried",
            highInterestDebt: debt,
            dependents,
            emergencyMonthsSaved: emergencyFunded ? 3 : 0,
            age: ageStr ? Number(ageStr) : undefined,
          },
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const bp = data?.blueprint;

  return (
    <div style={{ padding: "34px 40px", maxWidth: 960, margin: "0 auto" }}>
      <div className="font-mono-jb" style={{ color: "#7fe9c4", fontSize: 12, letterSpacing: ".5px", marginBottom: 6 }}>
        ✦ SALARY BLUEPRINT™
      </div>
      <h1 className="font-space" style={{ fontSize: 30, fontWeight: 700, margin: "0 0 6px" }}>
        You just got paid, {userName}. Here's the plan.
      </h1>
      <p style={{ color: "#8a97ad", fontSize: 15, margin: "0 0 24px", lineHeight: 1.5 }}>
        Enter your monthly income and I'll turn it into a personalised plan — what to save, invest, and spend — in seconds.
      </p>

      {/* Input card */}
      <div
        style={{
          borderRadius: 16,
          padding: "22px 24px",
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.09)",
          marginBottom: 22,
        }}
      >
        <label style={{ color: "#a7b2c4", fontSize: 13.5, fontWeight: 600 }}>Monthly income (KES)</label>
        <input
          inputMode="numeric"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="e.g. 80000"
          style={{
            width: "100%",
            marginTop: 8,
            padding: "13px 15px",
            borderRadius: 11,
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.14)",
            color: "#e8edf6",
            fontSize: 18,
            fontWeight: 600,
            outline: "none",
          }}
        />
        {detectedIncome > 0 && (
          <div style={{ color: "#7a8699", fontSize: 12, marginTop: 6 }}>
            Prefilled from your statement ({kes(detectedIncome)}). Change it anytime.
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Toggle on={irregular} set={setIrregular} label="Irregular income" />
          <Toggle on={debt} set={setDebt} label="I have high-interest debt (Fuliza/Tala…)" />
          <Toggle on={dependents} set={setDependents} label="I support family" />
          <Toggle on={emergencyFunded} set={setEmergencyFunded} label="Emergency fund already set (3+ mo)" />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ color: "#a7b2c4", fontSize: 13, fontWeight: 600 }}>Your age (optional — for a freedom age)</label>
          <input
            inputMode="numeric"
            value={ageStr}
            onChange={(e) => setAgeStr(e.target.value)}
            placeholder="e.g. 27"
            style={{
              width: 120,
              display: "block",
              marginTop: 6,
              padding: "9px 12px",
              borderRadius: 9,
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.14)",
              color: "#e8edf6",
              fontSize: 15,
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="font-space"
          style={{
            marginTop: 18,
            width: "100%",
            padding: "13px",
            borderRadius: 11,
            border: "none",
            cursor: loading ? "default" : "pointer",
            fontWeight: 700,
            fontSize: 15.5,
            color: "#05110c",
            background: loading ? "rgba(52,211,153,.5)" : "linear-gradient(135deg,#34d399,#22d3ee)",
          }}
        >
          {loading ? "Building your blueprint…" : "Generate my Blueprint"}
        </button>
        {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>

      {/* Result */}
      {bp && (
        <div style={{ animation: "mdFadeUp .4s ease both" }}>
          {/* Headline + freedom */}
          <div
            style={{
              borderRadius: 16,
              padding: "22px 24px",
              background: "linear-gradient(150deg,rgba(52,211,153,.13),rgba(47,129,247,.07))",
              border: "1px solid rgba(52,211,153,.2)",
              marginBottom: 18,
            }}
          >
            <div className="font-space" style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
              {bp.headline}
            </div>
            {bp.freedom.reachable && bp.freedom.baseYears != null ? (
              <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
                <Big label="Financial freedom in" value={`${bp.freedom.baseYears}–${bp.freedom.highYears} yrs`} />
                {bp.freedom.ageRange && <Big label="Around age" value={`${bp.freedom.ageRange[0]}–${bp.freedom.ageRange[1]}`} />}
                <Big label="Invested / month" value={kes(bp.freedom.monthlyInvestable)} />
              </div>
            ) : (
              <div style={{ color: "#cbd5e1", fontSize: 14 }}>{bp.freedom.note}</div>
            )}
            <div style={{ color: "#8a97ad", fontSize: 12, marginTop: 12 }}>{bp.freedom.note}</div>
          </div>

          {/* AI companion note */}
          {data?.narrative && (
            <div
              style={{
                borderRadius: 14,
                padding: "16px 18px",
                background: "rgba(163,113,247,.08)",
                border: "1px solid rgba(163,113,247,.2)",
                marginBottom: 20,
                display: "flex",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>✦</span>
              <div style={{ color: "#e2e6ee", fontSize: 14.5, lineHeight: 1.55 }}>{data.narrative}</div>
            </div>
          )}

          {/* Allocation bar */}
          <div style={{ display: "flex", height: 16, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            {bp.allocations
              .filter((a) => a.pct > 0)
              .map((a) => (
                <div key={a.key} title={`${a.label} ${a.pct}%`} style={{ width: `${a.pct}%`, background: a.color }} />
              ))}
          </div>

          {/* Allocation list */}
          <div style={{ display: "grid", gap: 10 }}>
            {bp.allocations
              .filter((a) => a.pct > 0)
              .map((a) => (
                <div
                  key={a.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "13px 15px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid rgba(255,255,255,.07)",
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: a.color, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 14.5 }}>{a.label}</span>
                      <span className="font-space" style={{ fontWeight: 700, fontSize: 14.5, color: a.color, whiteSpace: "nowrap" }}>
                        {kes(a.amount)} · {a.pct}%
                      </span>
                    </div>
                    <div style={{ color: "#8a97ad", fontSize: 12.5, marginTop: 3, lineHeight: 1.45 }}>{a.rationale}</div>
                  </div>
                </div>
              ))}
          </div>

          {/* Cautions */}
          {bp.cautions.length > 0 && (
            <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
              {bp.cautions.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 11,
                    background: "rgba(245,158,11,.08)",
                    border: "1px solid rgba(245,158,11,.22)",
                    color: "#fcd9a0",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  ⚠ {c}
                </div>
              ))}
            </div>
          )}

          {/* Assumptions */}
          <div style={{ marginTop: 18, color: "#6b7688", fontSize: 11.5, lineHeight: 1.55 }}>
            {bp.assumptions.map((a, i) => (
              <div key={i}>• {a}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => set(!on)}
      style={{
        cursor: "pointer",
        padding: "8px 13px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        background: on ? "rgba(52,211,153,.15)" : "rgba(255,255,255,.04)",
        border: `1px solid ${on ? "rgba(52,211,153,.35)" : "rgba(255,255,255,.1)"}`,
        color: on ? "#7fe9c4" : "#a7b2c4",
      }}
    >
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "#8a97ad", fontSize: 12 }}>{label}</div>
      <div className="font-space" style={{ fontSize: 24, fontWeight: 800, color: "#34d399" }}>
        {value}
      </div>
    </div>
  );
}
