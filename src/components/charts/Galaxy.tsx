function mulberry(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function Galaxy({ amounts }: { amounts: number[] }) {
  const W = 560,
    H = 260;
  const cols = ["#34d399", "#3b82f6", "#a371f7", "#f59e0b", "#22d3ee", "#f87171"];
  const rnd = mulberry(99);
  const max = Math.max(...amounts, 1);
  const list = amounts.length ? amounts : [1];

  const stars = list.slice(0, 120).map((amt, i) => ({
    x: 18 + rnd() * (W - 36),
    y: 16 + rnd() * (H - 32),
    r: 2 + Math.sqrt(amt / max) * 13,
    col: cols[Math.floor(rnd() * cols.length)],
    d: (rnd() * 4).toFixed(2),
    key: i,
  }));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {stars.map((st) => (
        <g key={st.key}>
          <circle cx={st.x} cy={st.y} r={st.r + 3} fill={st.col} opacity={0.13} />
          <circle
            cx={st.x}
            cy={st.y}
            r={st.r}
            fill={st.col}
            opacity={0.9}
            style={{ animation: `mdTwinkle ${2 + +st.d}s ease-in-out ${st.d}s infinite`, filter: `drop-shadow(0 0 5px ${st.col})` }}
          />
        </g>
      ))}
    </svg>
  );
}
