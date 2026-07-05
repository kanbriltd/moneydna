"use client";

import type { FinancialTwin } from "@/lib/financialTwin";
import { kes } from "@/lib/format";
import Gauge from "@/components/charts/Gauge";

const card: React.CSSProperties = {
  borderRadius: 18,
  padding: 22,
  background: "linear-gradient(180deg,rgba(17,24,39,.7),rgba(10,16,28,.5))",
  border: "1px solid rgba(255,255,255,.07)",
};

function riskColor(level: string) {
  return level === "Critical" || level === "high" ? "#f87171" : level === "High" || level === "medium" ? "#f59e0b" : level === "Moderate" || level === "low" ? "#fbbf24" : "#34d399";
}

function TrajectoryChart({ points }: { points: FinancialTwin["savingsTrajectory"] }) {
  const W = 560,
    H = 220,
    pad = 14,
    top = 20,
    bot = H - 26;
  const all = points.flatMap((p) => [p.low, p.high]);
  const dataMax = Math.max(...all, 1);
  const dataMin = Math.min(...all, 0);
  const range = dataMax - dataMin || 1;
  const max = dataMax + range * 0.1;
  const min = dataMin - range * 0.1;
  const n = Math.max(points.length, 1);
  const X = (i: number) => pad + i * ((W - 2 * pad) / Math.max(1, n - 1));
  const Y = (v: number) => top + (1 - (v - min) / (max - min || 1)) * (bot - top);

  const projPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${X(i)} ${Y(p.projected)}`).join(" ");
  const bandTop = points.map((p, i) => `${i === 0 ? "M" : "L"} ${X(i)} ${Y(p.high)}`).join(" ");
  const bandBottom = [...points].reverse().map((p, i) => `L ${X(points.length - 1 - i)} ${Y(p.low)}`).join(" ");
  const bandPath = `${bandTop} ${bandBottom} Z`;
  const zeroY = Y(0);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {[0, 1, 2, 3].map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={top + (g * (bot - top)) / 3} y2={top + (g * (bot - top)) / 3} stroke="rgba(255,255,255,.05)" />
      ))}
      <line x1={pad} x2={W - pad} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,.15)" strokeDasharray="4 4" />
      <path d={bandPath} fill="rgba(163,113,247,.14)" />
      <path d={projPath} fill="none" stroke="#a371f7" strokeWidth={2.4} style={{ filter: "drop-shadow(0 0 6px rgba(163,113,247,.5))" }} />
      {points.map((p, i) => (
        <circle key={i} cx={X(i)} cy={Y(p.projected)} r={i === n - 1 ? 4 : 2.5} fill="#a371f7" />
      ))}
      {points.map((p, i) => (
        <text key={"l" + i} x={X(i)} y={H - 7} fill="#5f6b80" fontSize={10} textAnchor="middle" fontFamily="var(--font-jetbrains-mono)">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

export default function FinancialTwinView({ twin }: { twin: FinancialTwin }) {
  return (
    <div style={{ padding: "28px 34px 60px" }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono-jb" style={{ fontSize: 12.5, color: "#a371f7", letterSpacing: ".5px", marginBottom: 6 }}>
          FINANCIAL TWIN
        </div>
        <h1 className="font-space" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-.5px" }}>
          Your digital financial clone
        </h1>
        <p style={{ color: "#8a97ad", fontSize: 14.5, marginTop: 5 }}>{twin.explanation}</p>
      </div>

      {/* depletion + debt risk */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={card}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            Cash depletion forecast
          </div>
          <div style={{ fontSize: 12.5, color: "#8a97ad", marginBottom: 14 }}>Based on your average net cashflow, projected forward</div>
          {twin.depletionDate ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: riskColor(twin.depletionRisk), boxShadow: `0 0 10px ${riskColor(twin.depletionRisk)}`, flexShrink: 0 }} />
              <div>
                <div className="font-space" style={{ fontWeight: 700, fontSize: 22 }}>
                  {twin.depletionDate}
                </div>
                <div style={{ fontSize: 12.5, color: "#9aa7bd", marginTop: 3 }}>
                  A possibility worth knowing: available cash could run low around here at this pace ({twin.depletionRisk} sense of urgency).
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d399", flexShrink: 0 }} />
              <div style={{ fontSize: 13.5, color: "#cdd6e4" }}>Cash flow looks positive at your current pace — no depletion in sight.</div>
            </div>
          )}
        </div>

        <div style={{ ...card, display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Gauge value={twin.debtRiskScore} max={100} size={110} stroke={11} color={riskColor(twin.debtRiskLevel)} />
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div className="font-space" style={{ fontWeight: 700, fontSize: 24 }}>
                {twin.debtRiskScore}
              </div>
            </div>
          </div>
          <div>
            <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
              Debt risk trajectory
            </div>
            <div className="font-mono-jb" style={{ fontSize: 12, color: riskColor(twin.debtRiskLevel), marginBottom: 6 }}>
              {twin.debtRiskLevel.toUpperCase()}
            </div>
            <div style={{ fontSize: 12.5, color: "#9aa7bd", lineHeight: 1.4 }}>Built from your debt-to-income pressure and Fuliza usage trend.</div>
          </div>
        </div>
      </div>

      {/* trajectory */}
      <div style={{ ...card, marginBottom: 14 }}>
        <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
          6-month savings trajectory
        </div>
        <div style={{ fontSize: 12.5, color: "#8a97ad", marginBottom: 10 }}>Projected cumulative net, with a real-world variance band</div>
        <TrajectoryChart points={twin.savingsTrajectory} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* upcoming recurring */}
        <div style={card}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            Upcoming recurring payments
          </div>
          <div style={{ fontSize: 12.5, color: "#8a97ad", marginBottom: 14 }}>Predicted from your payment cadence — next 30 days</div>
          {twin.upcomingRecurring.length === 0 && <div style={{ fontSize: 13, color: "#7a8699" }}>No recurring pattern detected yet.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {twin.upcomingRecurring.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  <div style={{ fontSize: 11.5, color: "#7a8699" }}>
                    {r.category} · expected {r.expectedDate} · {r.confidence} confidence
                  </div>
                </div>
                <div className="font-mono-jb" style={{ fontSize: 13, color: "#e8edf6", flexShrink: 0 }}>
                  {kes(r.expectedAmount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* category forecast */}
        <div style={card}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            Next-month category forecast
          </div>
          <div style={{ fontSize: 12.5, color: "#8a97ad", marginBottom: 14 }}>Projected spend vs this month, by category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {twin.categoryForecast.map((c) => (
              <div key={c.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.category}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="font-mono-jb" style={{ fontSize: 12.5, color: "#9aa7bd" }}>
                    {kes(c.nextMonthProjected)}
                  </span>
                  <span style={{ fontSize: 12.5, color: c.trend === "up" ? "#f87171" : c.trend === "down" ? "#34d399" : "#7a8699" }}>
                    {c.trend === "up" ? "▲" : c.trend === "down" ? "▼" : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
