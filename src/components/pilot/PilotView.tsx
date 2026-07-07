"use client";

import { useEffect, useState } from "react";

interface Metrics {
  totalUsers: number;
  discoveryCompleted: number;
  weeklyActiveUsers: number;
  decisionsGenerated: number;
  decisionsFollowed: number;
  decisionsSkipped: number;
  openRatePct: number;
  followThroughPct: number;
}

export default function PilotView() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pilot");
        setM(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: "34px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div className="font-mono-jb" style={{ color: "#7fe9c4", fontSize: 12, letterSpacing: ".5px", marginBottom: 6 }}>
        &#9670; PILOT DASHBOARD
      </div>
      <h1 className="font-space" style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>
        Hypothesis 001, live
      </h1>
      <p style={{ color: "#8a97ad", fontSize: 14.5, margin: "0 0 26px", lineHeight: 1.5 }}>
        People will trust a companion that helps them make one better financial decision every day. These three numbers prove it or break it.
      </p>

      {loading || !m ? (
        <div style={{ color: "#8a97ad" }}>Loading pilot metrics&hellip;</div>
      ) : (
        <>
          {/* THE THREE NUMBERS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14, marginBottom: 26 }}>
            <BigMetric n={1} label="Morning Brief open rate" value={`${m.openRatePct}%`} target=">60% = a daily habit" tone={m.openRatePct >= 60 ? "good" : "watch"} sub="Do they come back?" />
            <BigMetric n={2} label="Decision follow-through" value={`${m.followThroughPct}%`} target="rising = behaviour change" tone={m.followThroughPct >= 50 ? "good" : "watch"} sub="Does it change behaviour?" />
            <BigMetric n={3} label="Weekly active users" value={`${m.weeklyActiveUsers}`} target="growing every week" tone="neutral" sub="Is it becoming a habit?" />
          </div>

          {/* Funnel */}
          <div style={{ borderRadius: 16, padding: 20, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)" }}>
            <div className="font-mono-jb" style={{ color: "#8a97ad", fontSize: 11, letterSpacing: ".5px", marginBottom: 14 }}>THE FUNNEL (last 7 days)</div>
            <Row label="Total users" value={m.totalUsers} />
            <Row label="Completed discovery (have a Financial DNA)" value={m.discoveryCompleted} />
            <Row label="Decisions generated" value={m.decisionsGenerated} />
            <Row label="Decisions followed" value={m.decisionsFollowed} good />
            <Row label="Decisions skipped" value={m.decisionsSkipped} />
          </div>

          <p style={{ color: "#6b7688", fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
            The 3rd proof &mdash; &ldquo;would you miss it?&rdquo; &mdash; is asked directly of pilot users at ~30 days and read alongside whether week-4+ retention holds above ~40%.
          </p>
        </>
      )}
    </div>
  );
}

function BigMetric({ n, label, value, target, tone, sub }: { n: number; label: string; value: string; target: string; tone: "good" | "watch" | "neutral"; sub: string }) {
  const color = tone === "good" ? "#34d399" : tone === "watch" ? "#f5b942" : "#60a5fa";
  return (
    <div style={{ borderRadius: 16, padding: "20px", background: "rgba(255,255,255,.03)", border: `1px solid ${color}33` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: "#8a97ad", fontSize: 12.5 }}>{sub}</span>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: `${color}22`, color, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      </div>
      <div className="font-space" style={{ fontSize: 40, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#e8edf6", fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>{label}</div>
      <div style={{ color: "#7a8699", fontSize: 12, marginTop: 3 }}>{target}</div>
    </div>
  );
}

function Row({ label, value, good }: { label: string; value: number; good?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <span style={{ color: "#a7b2c4", fontSize: 14 }}>{label}</span>
      <span className="font-space" style={{ color: good ? "#34d399" : "#e8edf6", fontWeight: 700, fontSize: 15 }}>{value}</span>
    </div>
  );
}
