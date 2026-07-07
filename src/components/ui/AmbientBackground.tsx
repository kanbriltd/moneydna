"use client";

import { useMemo } from "react";

/**
 * The living atmosphere. Almost imperceptible movement — the user should feel
 * "the app is alive" without consciously noticing it. Two layers:
 *  1. Slow-drifting aurora blobs (hope / lavender / gold) behind everything.
 *  2. A faint, seeded starfield that breathes.
 * Deterministic (seeded) so there is no hydration mismatch.
 */
function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function AmbientBackground({ seed = 7 }: { seed?: number }) {
  const stars = useMemo(() => {
    const rnd = mulberry(seed);
    return Array.from({ length: 46 }, () => ({
      l: rnd() * 100,
      t: rnd() * 100,
      sz: 1 + rnd() * 1.8,
      dur: (5 + rnd() * 9).toFixed(1),
      delay: (rnd() * 8).toFixed(1),
    }));
  }, [seed]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Aurora blobs */}
      <div
        className="md-aurora"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(73,230,179,0.16), transparent 60%)",
          animation: "mdAuroraDrift 26s ease-in-out infinite",
        }}
      />
      <div
        className="md-aurora"
        style={{
          background: "radial-gradient(circle at 72% 24%, rgba(142,140,255,0.15), transparent 60%)",
          animation: "mdAuroraDrift 34s ease-in-out infinite reverse",
        }}
      />
      <div
        className="md-aurora"
        style={{
          background: "radial-gradient(circle at 50% 96%, rgba(217,179,108,0.08), transparent 55%)",
          animation: "mdAuroraDrift 40s ease-in-out infinite",
        }}
      />

      {/* Breathing starfield */}
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: s.l + "%",
            top: s.t + "%",
            width: s.sz,
            height: s.sz,
            borderRadius: "50%",
            background: "#dfe6f2",
            boxShadow: "0 0 6px rgba(223,230,242,0.7)",
            animation: `mdStarBreathe ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
