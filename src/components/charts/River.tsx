function smooth(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6,
      c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6,
      c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function River({ labels, income, expenses }: { labels: string[]; income: number[]; expenses: number[] }) {
  const W = 560,
    H = 240,
    pad = 14,
    top = 20,
    bot = H - 26;
  const n = Math.max(income.length, 1);
  const all = [...income, ...expenses];
  const dataMax = Math.max(...all, 1);
  const dataMin = Math.min(...all, 0);
  const range = dataMax - dataMin || 1;
  const max = dataMax + range * 0.08;
  const min = Math.max(0, dataMin - range * 0.08);

  const X = (i: number) => pad + i * ((W - 2 * pad) / Math.max(1, n - 1));
  const Y = (v: number) => top + (1 - (v - min) / (max - min || 1)) * (bot - top);

  const ip = income.map((v, i) => ({ x: X(i), y: Y(v) }));
  const ep = expenses.map((v, i) => ({ x: X(i), y: Y(v) }));
  const incLine = smooth(ip);
  const expLine = smooth(ep);
  const lastX = X(n - 1);
  const area = incLine ? `${incLine} L ${lastX} ${bot} L ${X(0)} ${bot} Z` : "";
  const earea = expLine ? `${expLine} L ${lastX} ${bot} L ${X(0)} ${bot} Z` : "";

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="rIn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="rEx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={top + (g * (bot - top)) / 3} y2={top + (g * (bot - top)) / 3} stroke="rgba(255,255,255,.05)" />
      ))}
      <path d={area} fill="url(#rIn)" />
      <path d={earea} fill="url(#rEx)" />
      <path d={expLine} fill="none" stroke="#3b82f6" strokeWidth={2.2} />
      <path d={incLine} fill="none" stroke="#34d399" strokeWidth={2.6} style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,.5))" }} />
      {ip.map((p, i) => (
        <circle key={"i" + i} cx={p.x} cy={p.y} r={i === n - 1 ? 4 : 0} fill="#34d399" />
      ))}
      {labels.map((m, i) => (
        <text key={"m" + i} x={X(i)} y={H - 7} fill="#5f6b80" fontSize={10} textAnchor="middle" fontFamily="var(--font-jetbrains-mono)">
          {m}
        </text>
      ))}
    </svg>
  );
}
