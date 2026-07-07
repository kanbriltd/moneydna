"use client";

import { useMemo } from "react";

export interface Star {
  id: string;
  label?: string;
  /** 0..1 — drives size, brightness, and how bright the star shines. */
  brightness: number;
  /** Optional accent; defaults to the hope color. */
  color?: string;
  /** Optional fixed position (0..1). If omitted, a seeded organic layout is used. */
  x?: number;
  y?: number;
}

/**
 * A living constellation. Every star is a meaningful point (a trait, a decision);
 * important ones shine brighter. Connected by elegant lines, gently breathing.
 * Deterministic given the same stars + seed, so it is stable but unique per user.
 */
function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const HOPE = "#49e6b3";
const LAVENDER = "#8e8cff";
const GOLD = "#d9b36c";

/** Round to fixed precision so server and client serialize identical strings (avoids hydration mismatch). */
const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export default function Constellation({
  stars,
  seed = 3,
  height = 240,
  connect = true,
  showLabels = false,
}: {
  stars: Star[];
  seed?: number;
  height?: number;
  connect?: boolean;
  showLabels?: boolean;
}) {
  const W = 100;
  const H = 100;

  const placed = useMemo(() => {
    const rnd = mulberry(seed + stars.length * 31);
    const pts = stars.map((st, i) => {
      // Organic ring-ish scatter so it reads as a pattern, not a grid.
      const golden = 2.399963;
      const a = i * golden + rnd() * 0.7;
      const r = 16 + Math.sqrt(i + 1) * 12 + rnd() * 8;
      const x = st.x != null ? st.x * W : 50 + Math.cos(a) * r * (0.7 + rnd() * 0.3);
      const y = st.y != null ? st.y * H : 50 + Math.sin(a) * r * (0.6 + rnd() * 0.3);
      return {
        ...st,
        color: st.color ?? [HOPE, LAVENDER, GOLD][i % 3],
        x: r2(Math.max(8, Math.min(92, x))),
        y: r2(Math.max(10, Math.min(90, y))),
        brightness: r3(st.brightness),
        dur: (4 + rnd() * 5).toFixed(1),
        delay: (rnd() * 4).toFixed(1),
      };
    });
    return pts;
  }, [stars, seed]);

  // Connect each star to its 1–2 nearest neighbours for a woven look.
  const links = useMemo(() => {
    if (!connect) return [];
    const out: { x1: number; y1: number; x2: number; y2: number; o: number }[] = [];
    for (let i = 0; i < placed.length; i++) {
      const dists = placed
        .map((p, j) => ({ j, d: Math.hypot(p.x - placed[i].x, p.y - placed[i].y) }))
        .filter((p) => p.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const { j, d } of dists) {
        if (j > i) out.push({ x1: placed[i].x, y1: placed[i].y, x2: placed[j].x, y2: placed[j].y, o: r3(Math.max(0.05, 0.32 - d / 260)) });
      }
    }
    return out;
  }, [placed, connect]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height, display: "block" }}>
      <defs>
        {placed.map((p) => (
          <radialGradient key={`g-${p.id}`} id={`star-${seed}-${p.id}`}>
            <stop offset="0%" stopColor={p.color} stopOpacity="0.95" />
            <stop offset="45%" stopColor={p.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={p.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {links.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#aeb9cc" strokeWidth={0.28} strokeOpacity={l.o} />
      ))}

      {placed.map((p) => {
        const glow = r2(3.5 + p.brightness * 7);
        const core = r2(0.9 + p.brightness * 2.1);
        return (
          <g key={p.id} style={{ animation: `mdStarBreathe ${p.dur}s ease-in-out ${p.delay}s infinite`, transformOrigin: `${p.x}px ${p.y}px` }}>
            <circle cx={p.x} cy={p.y} r={glow} fill={`url(#star-${seed}-${p.id})`} />
            <circle cx={p.x} cy={p.y} r={core} fill="#fbfdff" opacity={r3(0.55 + p.brightness * 0.45)} />
            {showLabels && p.label && (
              <text
                x={p.x}
                y={r2(p.y + glow + 3.4)}
                textAnchor="middle"
                fontSize="3"
                fill="#a3b1c6"
                style={{ fontFamily: "var(--font-inter), sans-serif", letterSpacing: "0.02em" }}
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
