function ringSeg(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(r1, a0),
    [x1, y1] = p(r1, a1),
    [x2, y2] = p(r0, a1),
    [x3, y3] = p(r0, a0);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r1} ${r1} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} A ${r0} ${r0} 0 ${large} 0 ${x3.toFixed(1)} ${y3.toFixed(1)} Z`;
}

export interface SunburstCat {
  name: string;
  value: number;
  color: string;
  subs: { name: string; value: number }[];
}

export default function Sunburst({ categories, centerLabel }: { categories: SunburstCat[]; centerLabel: string }) {
  const S = 230,
    c = S / 2;
  const tot = categories.reduce((s, x) => s + x.value, 0) || 1;
  let a = -Math.PI / 2;
  const inner: React.ReactNode[] = [];
  const outer: React.ReactNode[] = [];

  categories.forEach((ct, k) => {
    const span = (ct.value / tot) * 2 * Math.PI;
    const a0 = a,
      a1 = a + span;
    inner.push(<path key={"i" + k} d={ringSeg(c, c, 42, 72, a0, a1)} fill={ct.color} opacity={0.92} stroke="#05070e" strokeWidth={1.5} />);
    const subsTotal = ct.subs.reduce((s, sb) => s + sb.value, 0) || ct.value;
    let sa = a0;
    ct.subs.forEach((sb, j) => {
      const ss = (sb.value / subsTotal) * span;
      outer.push(<path key={`o${k}_${j}`} d={ringSeg(c, c, 74, 106, sa, sa + ss)} fill={ct.color} opacity={0.45} stroke="#05070e" strokeWidth={1.5} />);
      sa += ss;
    });
    a = a1;
  });

  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      {inner}
      {outer}
      <circle cx={c} cy={c} r={40} fill="#0b1220" stroke="rgba(255,255,255,.08)" />
      <text x={c} y={c - 3} fill="#e8edf6" fontSize={13} fontWeight={700} textAnchor="middle" fontFamily="var(--font-space-grotesk)">
        {centerLabel}
      </text>
      <text x={c} y={c + 12} fill="#8a97ad" fontSize={9} textAnchor="middle" fontFamily="var(--font-jetbrains-mono)">
        SPENT
      </text>
    </svg>
  );
}
