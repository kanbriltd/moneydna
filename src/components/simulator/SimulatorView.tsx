"use client";

import { useState } from "react";
import type { WhatIfResult, WhatIfScenario } from "@/lib/whatIf";
import { kes } from "@/lib/format";
import River from "@/components/charts/River";

const card: React.CSSProperties = {
  borderRadius: 18,
  padding: 22,
  background: "linear-gradient(180deg,rgba(17,24,39,.7),rgba(10,16,28,.5))",
  border: "1px solid rgba(255,255,255,.07)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.1)",
  color: "#e8edf6",
  fontSize: 13.5,
  fontFamily: "var(--font-manrope)",
};

const DEFAULT_SCENARIO: WhatIfScenario = {
  extraMonthlySavings: 0,
  stopFuliza: false,
  incomeChangePct: 0,
  rentChangePct: 0,
  monthlyInvestment: 0,
  investmentAnnualReturnPct: 10,
};

export default function SimulatorView({ initial }: { initial: WhatIfResult }) {
  const [scenario, setScenario] = useState<WhatIfScenario>(DEFAULT_SCENARIO);
  const [result, setResult] = useState<WhatIfResult>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof WhatIfScenario>(key: K, value: WhatIfScenario[K]) => setScenario((s) => ({ ...s, [key]: value }));

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario),
      });
      if (!res.ok) throw new Error("Simulation failed.");
      setResult(await res.json());
    } catch {
      setError("Couldn't run that simulation — try again.");
    } finally {
      setLoading(false);
    }
  }

  const labels = result.trajectory.map((t) => `M${t.month}`);
  const positive = result.summary.delta >= 0;

  return (
    <div style={{ padding: "28px 34px 60px" }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono-jb" style={{ fontSize: 12.5, color: "#2f81f7", letterSpacing: ".5px", marginBottom: 6 }}>
          WHAT-IF SIMULATOR
        </div>
        <h1 className="font-space" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-.5px" }}>
          Play out your next 12 months
        </h1>
        <p style={{ color: "#8a97ad", fontSize: 14.5, marginTop: 5 }}>
          Baseline uses your last {result.hasData ? "3 months'" : ""} real average income &amp; expenses — change the levers below and re-run.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14 }}>
        {/* controls */}
        <div style={card}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
            Scenario levers
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label>
              <div style={{ fontSize: 13, color: "#cdd6e4", marginBottom: 6 }}>Extra monthly savings (KES)</div>
              <input
                type="number"
                min={0}
                style={inputStyle}
                value={scenario.extraMonthlySavings}
                onChange={(e) => set("extraMonthlySavings", Math.max(0, Number(e.target.value) || 0))}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#cdd6e4" }}>
              <input type="checkbox" checked={scenario.stopFuliza} onChange={(e) => set("stopFuliza", e.target.checked)} />
              Stop using Fuliza {result.fulizaMonthlyAvg > 0 && <span style={{ color: "#7a8699" }}>(avg {kes(result.fulizaMonthlyAvg)}/mo)</span>}
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#cdd6e4", marginBottom: 6 }}>
                Income change: <span style={{ color: scenario.incomeChangePct >= 0 ? "#34d399" : "#f87171" }}>{scenario.incomeChangePct}%</span>
              </div>
              <input
                type="range"
                min={-50}
                max={100}
                step={5}
                style={{ width: "100%" }}
                value={scenario.incomeChangePct}
                onChange={(e) => set("incomeChangePct", Number(e.target.value))}
              />
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#cdd6e4", marginBottom: 6 }}>
                Rent change: <span style={{ color: scenario.rentChangePct <= 0 ? "#34d399" : "#f87171" }}>{scenario.rentChangePct}%</span>
              </div>
              <input
                type="range"
                min={-50}
                max={100}
                step={5}
                style={{ width: "100%" }}
                value={scenario.rentChangePct}
                onChange={(e) => set("rentChangePct", Number(e.target.value))}
              />
              {result.rentMonthlyAvg > 0 && <div style={{ fontSize: 11.5, color: "#7a8699", marginTop: 4 }}>Current avg rent: {kes(result.rentMonthlyAvg)}/mo</div>}
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#cdd6e4", marginBottom: 6 }}>Monthly investment (KES)</div>
              <input
                type="number"
                min={0}
                style={inputStyle}
                value={scenario.monthlyInvestment}
                onChange={(e) => set("monthlyInvestment", Math.max(0, Number(e.target.value) || 0))}
              />
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#cdd6e4", marginBottom: 6 }}>Assumed annual return on investment</div>
              <input
                type="number"
                min={0}
                max={100}
                style={inputStyle}
                value={scenario.investmentAnnualReturnPct}
                onChange={(e) => set("investmentAnnualReturnPct", Math.max(0, Number(e.target.value) || 0))}
              />
            </label>

            <button
              onClick={run}
              disabled={loading}
              style={{
                cursor: loading ? "default" : "pointer",
                fontFamily: "var(--font-manrope)",
                fontWeight: 600,
                fontSize: 14,
                color: "#05070e",
                background: "linear-gradient(135deg,#34d399,#2f81f7)",
                border: "none",
                padding: "12px 18px",
                borderRadius: 11,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Simulating…" : "Run simulation"}
            </button>
            {error && <div style={{ fontSize: 12.5, color: "#f87171" }}>{error}</div>}
          </div>
        </div>

        {/* results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div className="font-space" style={{ fontWeight: 600, fontSize: 16 }}>
                Net worth trajectory — {result.horizonMonths} months
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#8a97ad" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: "#34d399" }} />
                  Current path
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: "#3b82f6" }} />
                  With changes
                </span>
              </div>
            </div>
            {result.hasData ? (
              <div style={{ marginTop: 8 }}>
                <River labels={labels} income={result.trajectory.map((t) => t.baseline)} expenses={result.trajectory.map((t) => t.projected)} />
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#7a8699", padding: "20px 0" }}>Not enough transaction history to simulate yet.</div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div style={card}>
              <div style={{ fontSize: 12, color: "#8a97ad", marginBottom: 8 }}>Baseline in {result.horizonMonths}mo</div>
              <div className="font-space" style={{ fontWeight: 700, fontSize: 21 }}>
                {kes(result.summary.baselineTotal)}
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 12, color: "#8a97ad", marginBottom: 8 }}>With changes in {result.horizonMonths}mo</div>
              <div className="font-space" style={{ fontWeight: 700, fontSize: 21, color: "#3b82f6" }}>
                {kes(result.summary.projectedTotal)}
              </div>
            </div>
            <div style={{ ...card, borderColor: positive ? "rgba(52,211,153,.25)" : "rgba(248,113,113,.25)" }}>
              <div style={{ fontSize: 12, color: "#8a97ad", marginBottom: 8 }}>Difference</div>
              <div className="font-space" style={{ fontWeight: 700, fontSize: 21, color: positive ? "#34d399" : "#f87171" }}>
                {positive ? "+" : ""}
                {kes(result.summary.delta)}
              </div>
            </div>
          </div>

          {scenario.monthlyInvestment > 0 && (
            <div style={{ ...card, background: "linear-gradient(160deg,rgba(47,129,247,.08),rgba(10,16,28,.5))", border: "1px solid rgba(47,129,247,.16)" }}>
              <div style={{ fontSize: 13, color: "#cdd6e4" }}>
                Investing {kes(scenario.monthlyInvestment)}/month at {scenario.investmentAnnualReturnPct}%/yr grows to{" "}
                <b style={{ color: "#7fb2ff" }}>{kes(result.summary.investmentValue)}</b> after {result.horizonMonths} months.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
