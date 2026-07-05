export default function DnaRadar({ traits }: { traits: { name: string; value: number }[] }) {
  const S = 300,
    c = S / 2,
    R = 92;
  const N = traits.length || 1;

  const pt = (val: number, i: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const r = (R * val) / 100;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const axPt = (i: number, k = 1): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [c + R * k * Math.cos(a), c + R * k * Math.sin(a)];
  };

  const poly = traits.map((t, i) => pt(t.value, i).join(",")).join(" ");
  const rings = [0.25, 0.5, 0.75, 1].map((k, i) => (
    <polygon key={"r" + i} points={traits.map((_, j) => axPt(j, k).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,.07)" />
  ));
  const axes = traits.map((_, i) => {
    const [x, y] = axPt(i);
    return <line key={"a" + i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,.06)" />;
  });
  const labels = traits.map((t, i) => {
    const [x, y] = axPt(i, 1.18);
    return (
      <text key={"l" + i} x={x} y={y + 3} fill="#9aa7bd" fontSize={10.5} textAnchor="middle" fontFamily="var(--font-jetbrains-mono)">
        {t.name}
      </text>
    );
  });
  const dots = traits.map((t, i) => {
    const [x, y] = pt(t.value, i);
    return <circle key={"d" + i} cx={x} cy={y} r={3} fill="#c4a8ff" />;
  });

  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <defs>
        <radialGradient id="dnaF">
          <stop offset="0%" stopColor="#a371f7" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#a371f7" stopOpacity={0.12} />
        </radialGradient>
      </defs>
      {rings}
      {axes}
      <polygon points={poly} fill="url(#dnaF)" stroke="#a371f7" strokeWidth={2} style={{ filter: "drop-shadow(0 0 8px rgba(163,113,247,.5))" }} />
      {dots}
      {labels}
    </svg>
  );
}
