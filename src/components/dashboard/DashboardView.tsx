"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalyticsResult } from "@/lib/analytics";
import { kes } from "@/lib/format";
import { useAnimatedProgress } from "@/lib/useAnimatedProgress";
import Gauge from "@/components/charts/Gauge";
import River from "@/components/charts/River";
import NewGoalModal from "@/components/dashboard/NewGoalModal";

const card: React.CSSProperties = {
  borderRadius: 18,
  padding: 22,
  background: "linear-gradient(180deg,rgba(17,24,39,.7),rgba(10,16,28,.5))",
  border: "1px solid rgba(255,255,255,.07)",
};

export default function DashboardView({ data }: { data: AnalyticsResult }) {
  const p = useAnimatedProgress(1400);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const firstName = data.userName.split(" ")[0] || data.userName;

  const kpis = [
    { label: "TOTAL INCOME", value: kes(data.kpis.income * p), sub: deltaLabel(data.kpis.incomeDeltaPct, "vs last month"), accent: "#34d399", vcolor: "#e8edf6" },
    { label: "TOTAL EXPENSES", value: kes(data.kpis.expenses * p), sub: deltaLabel(data.kpis.expenseDeltaPct, "vs last month"), accent: "#3b82f6", vcolor: "#e8edf6" },
    { label: "NET CASHFLOW", value: (data.kpis.net >= 0 ? "+" : "") + kes(data.kpis.net * p), sub: "money you kept", accent: "#34d399", vcolor: "#7fe9c4" },
    { label: "BURN RATE", value: kes(data.kpis.burnRate * p) + "/d", sub: "daily spend", accent: "#f59e0b", vcolor: "#e8edf6" },
  ];

  return (
    <div style={{ padding: "28px 34px 60px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="font-mono-jb" style={{ fontSize: 12.5, color: "#34d399", letterSpacing: ".5px", marginBottom: 6 }}>
            COMMAND CENTER · {data.periodLabel}
          </div>
          <h1 className="font-space" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-.5px" }}>
            Good to see you, {firstName} 👋
          </h1>
          <p style={{ color: "#8a97ad", fontSize: 14.5, marginTop: 5 }}>
            {data.savingsRate >= 20
              ? "Your money grew stronger this month. Net cashflow is up and your saving streak is alive."
              : "Here's where your money went this month — a few tweaks and you'll be back above target."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="/api/export/report"
            download
            style={{
              cursor: "pointer",
              fontFamily: "var(--font-manrope)",
              fontWeight: 600,
              fontSize: 14,
              color: "#cdd6e4",
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.12)",
              padding: "11px 18px",
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            ⬇ Export Full Report
          </a>
          <Link
            href="/coach"
            style={{
              cursor: "pointer",
              fontFamily: "var(--font-manrope)",
              fontWeight: 600,
              fontSize: 14,
              color: "#05070e",
              background: "linear-gradient(135deg,#34d399,#2f81f7)",
              border: "none",
              padding: "11px 18px",
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 8px 22px rgba(52,211,153,.25)",
              textDecoration: "none",
            }}
          >
            ✦ Ask Wealth Coach
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 14 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ position: "relative", overflow: "hidden", borderRadius: 16, padding: "18px 18px 20px", ...card, border: card.border }}>
            <svg width="100%" height={3} style={{ position: "absolute", top: 0, left: 0 }}>
              <rect width="100%" height={3} fill={k.accent} opacity={0.85} />
            </svg>
            <div className="font-mono-jb" style={{ fontSize: 11.5, color: "#8a97ad", letterSpacing: ".5px", marginBottom: 11 }}>
              {k.label}
            </div>
            <div className="font-space" style={{ fontWeight: 700, fontSize: 25, letterSpacing: "-.5px", color: k.vcolor }}>
              {k.value}
            </div>
            <div style={{ fontSize: 12, color: "#7a8699", marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* river + health */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div className="font-space" style={{ fontWeight: 600, fontSize: 16 }}>
              Cashflow river · last 12 months
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#8a97ad" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#34d399" }} />
                Income
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "#3b82f6" }} />
                Expenses
              </span>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <River labels={data.cashflowRiver.labels} income={data.cashflowRiver.income} expenses={data.cashflowRiver.expenses} />
          </div>
        </div>

        <div style={{ ...card, display: "flex", flexDirection: "column" }}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            Financial health
          </div>
          <div style={{ fontSize: 12.5, color: "#8a97ad" }}>7 weighted signals</div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", margin: "8px 0 6px" }}>
            <Gauge value={data.health.score * p} max={100} size={190} stroke={15} color="#34d399" />
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div className="font-space" style={{ fontWeight: 700, fontSize: 42, lineHeight: 1 }}>
                {Math.round(data.health.score * p)}
              </div>
              <div className="font-mono-jb" style={{ fontSize: 12, color: "#34d399", letterSpacing: ".5px", marginTop: 2 }}>
                {healthLabel(data.health.score)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
            {data.health.parts.map((h) => (
              <div key={h.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
                <span style={{ color: "#8a97ad", width: 120 }}>{h.label}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${h.value * p}%`, background: h.color, transition: "width .3s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* categories + savings ring + mpesa */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr .85fr .85fr", gap: 14, marginBottom: 14 }}>
        <div style={card}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 18 }}>
            Where it went
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {data.categories.map((c) => (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span className="font-mono-jb" style={{ color: "#9aa7bd" }}>
                    {kes(c.amount)}
                  </span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, width: `${c.widthPct * p}%`, background: c.color, transition: "width .3s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, alignSelf: "flex-start", marginBottom: 2 }}>
            Savings rate
          </div>
          <div style={{ fontSize: 12.5, color: "#8a97ad", alignSelf: "flex-start" }}>of income kept</div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 14 }}>
            <Gauge value={Math.max(0, data.savingsRate) * p} max={100} size={150} stroke={13} color="#34d399" />
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div className="font-space" style={{ fontWeight: 700, fontSize: 34, color: "#34d399", lineHeight: 1 }}>
                {Math.round(data.savingsRate * p)}%
              </div>
              <div style={{ fontSize: 11, color: "#7a8699", marginTop: 2 }}>target 20%</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 12.5,
              color: "#7fe9c4",
              textAlign: "center",
              lineHeight: 1.45,
              background: "rgba(52,211,153,.08)",
              border: "1px solid rgba(52,211,153,.18)",
              padding: "10px 12px",
              borderRadius: 11,
            }}
          >
            {data.savingsRate >= 20
              ? <>You beat your target by <b>{Math.round(data.savingsRate - 20)} points</b>. That&apos;s <b>{kes(data.kpis.net)}</b> kept.</>
              : <>You&apos;re <b>{Math.round(20 - data.savingsRate)} points</b> under target — {kes(data.kpis.income * 0.2 - data.kpis.net)} more would get you there.</>}
          </div>
        </div>

        <div style={card}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
            M-PESA breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {data.mpesaBreakdown.length === 0 && <div style={{ fontSize: 13, color: "#7a8699" }}>No M-PESA channel data in this statement.</div>}
            {data.mpesaBreakdown.map((m) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1 }}>{m.label}</span>
                <span className="font-mono-jb" style={{ fontSize: 12.5, color: "#9aa7bd" }}>
                  {m.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* merchants + anomalies */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={card}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
            Top merchants
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.merchants.map((m) => (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div
                  className="font-space"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    background: "rgba(255,255,255,.05)",
                    border: "1px solid rgba(255,255,255,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 13,
                    color: m.color,
                  }}
                >
                  {m.rank}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: "#7a8699" }}>{m.tag}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="font-mono-jb" style={{ fontSize: 13, color: "#e8edf6" }}>
                    {kes(m.amount)}
                  </div>
                  <div style={{ fontSize: 11, color: "#7a8699" }}>{m.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
            <div className="font-space" style={{ fontWeight: 600, fontSize: 16 }}>
              Anomalies &amp; alerts
            </div>
            {data.anomalies.length > 0 && (
              <span className="font-mono-jb" style={{ fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,.12)", padding: "3px 8px", borderRadius: 6 }}>
                {data.anomalies.length} NEW
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {data.anomalies.length === 0 && <div style={{ fontSize: 13, color: "#7a8699" }}>Nothing unusual this month.</div>}
            {data.anomalies.map((a, i) => {
              const dot = a.severity === "high" ? "#f87171" : a.severity === "medium" ? "#f59e0b" : "#fbbf24";
              const bg = a.severity === "high" ? "rgba(248,113,113,.07)" : a.severity === "medium" ? "rgba(245,158,11,.07)" : "rgba(251,191,36,.06)";
              const bd = a.severity === "high" ? "rgba(248,113,113,.2)" : a.severity === "medium" ? "rgba(245,158,11,.2)" : "rgba(251,191,36,.18)";
              return (
                <div key={i} style={{ display: "flex", gap: 12, padding: "13px 14px", borderRadius: 12, background: bg, border: `1px solid ${bd}` }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot, marginTop: 5, flexShrink: 0, boxShadow: `0 0 9px ${dot}` }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{a.title}</div>
                    <div style={{ fontSize: 12.5, color: "#9aa7bd", lineHeight: 1.45 }}>{a.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* goals + insights */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div className="font-space" style={{ fontWeight: 600, fontSize: 16 }}>
              Savings goals
            </div>
            <span style={{ fontSize: 12.5, color: "#34d399", cursor: "pointer" }} onClick={() => setShowNewGoal(true)}>
              + New goal
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {data.goals.map((g) => (
              <div key={g.id} style={{ padding: 15, borderRadius: 13, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 17 }}>{g.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</span>
                </div>
                <div style={{ height: 8, borderRadius: 5, background: "rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: "100%", borderRadius: 5, width: `${g.progressPct * p}%`, background: g.color, transition: "width .3s" }} />
                </div>
                <div className="font-mono-jb" style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, gap: 8 }}>
                  <span style={{ color: "#9aa7bd" }}>{shortK(g.current)}</span>
                  <span style={{ color: "#5f6b80" }}>of {shortK(g.target)}</span>
                </div>
              </div>
            ))}
            {data.goals.length === 0 && <div style={{ fontSize: 13, color: "#7a8699" }}>No goals yet — add one to start tracking.</div>}
          </div>
        </div>

        <div style={{ borderRadius: 18, padding: 22, background: "linear-gradient(160deg,rgba(47,129,247,.08),rgba(10,16,28,.5))", border: "1px solid rgba(47,129,247,.16)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
            <span style={{ fontSize: 17 }}>✦</span>
            <div className="font-space" style={{ fontWeight: 600, fontSize: 16 }}>
              AI insights
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {data.insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", gap: 11 }}>
                <span style={{ color: ins.color, fontSize: 15, lineHeight: 1.4 }}>●</span>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#cdd6e4" }}>{ins.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNewGoal && <NewGoalModal onClose={() => setShowNewGoal(false)} />}
    </div>
  );
}

function deltaLabel(pct: number | null, suffix: string) {
  if (pct === null) return suffix;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% ${suffix}`;
}
function healthLabel(score: number) {
  if (score >= 75) return "STRONG";
  if (score >= 55) return "STEADY";
  if (score >= 35) return "SHAKY";
  return "AT RISK";
}
function shortK(v: number) {
  return v >= 1_000_000 ? (v / 1_000_000).toFixed(2) + "M" : Math.round(v / 1000) + "K";
}
