"use client";

import { useMemo, useState } from "react";
import { projectWealth } from "@/lib/wealthSimulator";
import { kes, kfmt } from "@/lib/format";

const PRESETS = [2000, 5000, 10000, 20000];

export default function SimulatorView({ suggestedMonthly }: { suggestedMonthly: number }) {
  const [monthly, setMonthly] = useState(suggestedMonthly);
  const [years, setYears] = useState(30);
  const [ret, setRet] = useState(10);

  const proj = useMemo(() => projectWealth({ monthly, years, annualReturnPct: ret }), [monthly, years, ret]);

  return (
    <div style={{ padding: "34px 40px", maxWidth: 980, margin: "0 auto" }}>
      <div className="font-mono-jb" style={{ color: "#7fe9c4", fontSize: 12, letterSpacing: ".5px", marginBottom: 6 }}>
        ✦ FUTURE WEALTH SIMULATOR
      </div>
      <h1 className="font-space" style={{ fontSize: 30, fontWeight: 700, margin: "0 0 6px" }}>
        See what future-you could be worth
      </h1>
      <p style={{ color: "#8a97ad", fontSize: 15, margin: "0 0 26px", lineHeight: 1.5 }}>
        Small amounts become large over time — that&rsquo;s compounding. Move the sliders and watch it.
      </p>

      {/* Headline */}
      <div
        style={{
          borderRadius: 18,
          padding: "26px 28px",
          background: "linear-gradient(150deg,rgba(52,211,153,.14),rgba(47,129,247,.08))",
          border: "1px solid rgba(52,211,153,.22)",
          marginBottom: 24,
        }}
      >
        <div style={{ color: "#8a97ad", fontSize: 13, marginBottom: 6 }}>
          Investing {kes(monthly)}/month for {years} years could grow to
        </div>
        <div className="font-space" style={{ fontSize: 46, fontWeight: 800, color: "#34d399", lineHeight: 1.05 }}>
          {kes(proj.base)}
        </div>
        <div style={{ color: "#a7b2c4", fontSize: 13.5, marginTop: 8 }}>
          Likely range <b style={{ color: "#e8edf6" }}>{kfmt(proj.low)}</b> – <b style={{ color: "#e8edf6" }}>{kfmt(proj.high)}</b> depending on returns
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
          <Stat label="You put in" value={kes(proj.totalContributed)} color="#8a97ad" />
          <Stat label="Growth (free money)" value={kes(proj.growth)} color="#34d399" />
        </div>
      </div>

      {/* Chart */}
      <GrowthChart series={proj.series} />

      {/* Controls */}
      <div style={{ display: "grid", gap: 22, marginTop: 26 }}>
        <Slider
          label="Monthly investment"
          value={monthly}
          display={kes(monthly)}
          min={500}
          max={100000}
          step={500}
          onChange={setMonthly}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setMonthly(p)}
              style={{
                cursor: "pointer",
                padding: "7px 13px",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                background: monthly === p ? "rgba(52,211,153,.16)" : "rgba(255,255,255,.05)",
                border: `1px solid ${monthly === p ? "rgba(52,211,153,.35)" : "rgba(255,255,255,.1)"}`,
                color: monthly === p ? "#7fe9c4" : "#a7b2c4",
              }}
            >
              {kfmt(p)}/mo
            </button>
          ))}
        </div>
        <Slider label="Years invested" value={years} display={`${years} years`} min={1} max={45} step={1} onChange={setYears} />
        <Slider label="Assumed annual return" value={ret} display={`${ret}%`} min={1} max={20} step={1} onChange={setRet} />
      </div>

      {/* Assumptions */}
      <div
        style={{
          marginTop: 26,
          padding: "16px 18px",
          borderRadius: 12,
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div className="font-mono-jb" style={{ fontSize: 11, color: "#8a97ad", letterSpacing: ".5px", marginBottom: 8 }}>
          ASSUMPTIONS — THIS IS ONE POSSIBLE PATH, NOT A PROMISE
        </div>
        {proj.assumptions.map((a, i) => (
          <div key={i} style={{ color: "#a7b2c4", fontSize: 12.5, lineHeight: 1.55, marginBottom: 3 }}>
            • {a}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ color: "#8a97ad", fontSize: 12 }}>{label}</div>
      <div className="font-space" style={{ fontSize: 20, fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#a7b2c4", fontSize: 13.5, fontWeight: 600 }}>{label}</span>
        <span className="font-space" style={{ color: "#34d399", fontSize: 15, fontWeight: 700 }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#34d399", cursor: "pointer" }}
      />
    </div>
  );
}

function GrowthChart({ series }: { series: { year: number; contributed: number; value: number }[] }) {
  const W = 700;
  const H = 260;
  const PAD = { l: 8, r: 8, t: 14, b: 22 };
  const maxV = Math.max(...series.map((s) => s.value), 1);
  const maxYear = series[series.length - 1].year || 1;
  const x = (yr: number) => PAD.l + (yr / maxYear) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / maxV) * (H - PAD.t - PAD.b);

  const valueLine = series.map((s) => `${x(s.year)},${y(s.value)}`).join(" ");
  const valueArea = `${x(0)},${y(0)} ${valueLine} ${x(maxYear)},${y(0)}`;
  const contribLine = series.map((s) => `${x(s.year)},${y(s.contributed)}`).join(" ");
  const contribArea = `${x(0)},${y(0)} ${contribLine} ${x(maxYear)},${y(0)}`;

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="mdGrowth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={valueArea} fill="url(#mdGrowth)" />
        <polygon points={contribArea} fill="rgba(138,151,173,.16)" />
        <polyline points={contribLine} fill="none" stroke="#8a97ad" strokeWidth="1.5" strokeDasharray="4 4" />
        <polyline points={valueLine} fill="none" stroke="#34d399" strokeWidth="2.5" />
        {series
          .filter((_, i) => i % Math.ceil(series.length / 6) === 0 || i === series.length - 1)
          .map((s) => (
            <text key={s.year} x={x(s.year)} y={H - 6} fill="#6b7688" fontSize="10" textAnchor="middle">
              {s.year}y
            </text>
          ))}
      </svg>
      <div style={{ display: "flex", gap: 18, marginTop: 6, paddingLeft: 4 }}>
        <Legend color="#34d399" label="Projected value" />
        <Legend color="#8a97ad" label="Money you put in" dashed />
      </div>
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 16, height: 0, borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }} />
      <span style={{ color: "#8a97ad", fontSize: 12 }}>{label}</span>
    </div>
  );
}
