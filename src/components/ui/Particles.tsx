"use client";

import { useMemo } from "react";

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function Particles({ seed = 5, count = 34 }: { seed?: number; count?: number }) {
  const dots = useMemo(() => {
    const rnd = mulberry(seed);
    const cols = ["#34d399", "#2f81f7", "#a371f7"];
    return Array.from({ length: count }, () => ({
      l: rnd() * 100,
      t: rnd() * 100,
      sz: 2 + rnd() * 4,
      d: (rnd() * 8).toFixed(1),
      dur: (7 + rnd() * 8).toFixed(1),
      c: cols[Math.floor(rnd() * 3)],
      o: 0.2 + rnd() * 0.5,
    }));
  }, [seed, count]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.l + "%",
            top: d.t + "%",
            width: d.sz,
            height: d.sz,
            borderRadius: "50%",
            background: d.c,
            opacity: d.o,
            boxShadow: `0 0 ${d.sz * 3}px ${d.c}`,
            animation: `mdFloat ${d.dur}s ease-in-out ${d.d}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
