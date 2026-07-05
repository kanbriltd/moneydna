"use client";

import type { AnalyticsResult } from "@/lib/analytics";
import DnaRadar from "@/components/charts/DnaRadar";
import Sunburst from "@/components/charts/Sunburst";
import Sankey from "@/components/charts/Sankey";
import Heatmap from "@/components/charts/Heatmap";
import Galaxy from "@/components/charts/Galaxy";

const card: React.CSSProperties = {
  borderRadius: 18,
  padding: 22,
  background: "linear-gradient(180deg,rgba(17,24,39,.7),rgba(10,16,28,.5))",
  border: "1px solid rgba(255,255,255,.07)",
};

function kfmt(n: number) {
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(2) + "M" : Math.round(n / 1000) + "K";
}

export default function AnalyticsView({ data }: { data: AnalyticsResult }) {
  const totalSpent = data.categories.reduce((s, c) => s + c.amount, 0);
  const sunburstLegend = data.categories.map((c) => ({
    name: c.name,
    pct: totalSpent > 0 ? Math.round((c.amount / totalSpent) * 100) : 0,
    color: c.color,
  }));

  return (
    <div style={{ padding: "28px 34px 60px" }}>
      <div style={{ marginBottom: 24 }}>
        <div className="font-mono-jb" style={{ fontSize: 12.5, color: "#a371f7", letterSpacing: ".5px", marginBottom: 6 }}>
          DEEP DIVE
        </div>
        <h1 className="font-space" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-.5px" }}>
          Spending DNA &amp; flows
        </h1>
        <p style={{ color: "#8a97ad", fontSize: 14.5, marginTop: 5 }}>The shape of your money — every shilling, mapped.</p>
      </div>

      {/* DNA + sunburst */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ borderRadius: 18, padding: 22, background: "linear-gradient(160deg,rgba(163,113,247,.09),rgba(10,16,28,.5))", border: "1px solid rgba(163,113,247,.18)" }}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            Your spending DNA
          </div>
          <div style={{ fontSize: 12.5, color: "#8a97ad", marginBottom: 6 }}>Behavioural fingerprint across 7 traits</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="font-space" style={{ fontWeight: 700, fontSize: 22, color: "#c4a8ff" }}>
              {data.dna.typeName}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <DnaRadar traits={data.dna.traits} />
          </div>
          <div style={{ fontSize: 13, color: "#cdd6e4", lineHeight: 1.55, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", padding: "13px 15px", borderRadius: 12, marginTop: 8 }}>
            {data.dna.explanation}
          </div>
        </div>

        <div style={card}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            Spending sunburst
          </div>
          <div style={{ fontSize: 12.5, color: "#8a97ad", marginBottom: 6 }}>Categories &amp; top merchants, by share</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ flexShrink: 0 }}>
              <Sunburst categories={data.sunburst} centerLabel={kfmt(totalSpent)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, minWidth: 160 }}>
              {sunburstLegend.map((l) => (
                <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{l.name}</span>
                  <span className="font-mono-jb" style={{ color: "#9aa7bd" }}>
                    {l.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* sankey */}
      <div style={{ ...card, marginBottom: 14 }}>
        <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
          Money flow — Sankey
        </div>
        <div style={{ fontSize: 12.5, color: "#8a97ad", marginBottom: 10 }}>From income sources, through your spending, into savings</div>
        <div style={{ overflowX: "auto" }}>
          <Sankey income={data.sankey.income} outflow={data.sankey.outflow} />
        </div>
      </div>

      {/* heatmap + galaxy */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 14 }}>
        <div style={card}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            Daily spending heatmap
          </div>
          <div style={{ fontSize: 12.5, color: "#8a97ad", marginBottom: 14 }}>Darker green = a heavier spend day</div>
          <Heatmap cells={data.heatmap} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", marginTop: 12, fontSize: 11.5, color: "#7a8699" }}>
            Less
            <span style={{ width: 11, height: 11, borderRadius: 3, background: "rgba(52,211,153,.18)" }} />
            <span style={{ width: 11, height: 11, borderRadius: 3, background: "rgba(52,211,153,.45)" }} />
            <span style={{ width: 11, height: 11, borderRadius: 3, background: "rgba(52,211,153,.75)" }} />
            <span style={{ width: 11, height: 11, borderRadius: 3, background: "#34d399" }} />
            More
          </div>
        </div>
        <div style={{ borderRadius: 18, padding: 22, background: "radial-gradient(500px 260px at 60% 40%,rgba(47,129,247,.1),transparent 70%),linear-gradient(180deg,rgba(13,18,30,.8),rgba(7,10,18,.7))", border: "1px solid rgba(255,255,255,.07)" }}>
          <div className="font-space" style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            Spending galaxy
          </div>
          <div style={{ fontSize: 12.5, color: "#8a97ad", marginBottom: 8 }}>Each star is a transaction · bigger = larger spend</div>
          <Galaxy amounts={data.galaxy.map((g) => g.amount)} />
        </div>
      </div>
    </div>
  );
}
