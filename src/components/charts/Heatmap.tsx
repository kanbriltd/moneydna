export default function Heatmap({ cells }: { cells: { date: string; amount: number }[] }) {
  const cell = 22,
    gap = 5;
  const max = Math.max(...cells.map((c) => c.amount), 1);
  const dl = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <svg width={(cell + gap) * 7} height={(cell + gap) * 5 + 18} viewBox={`0 0 ${(cell + gap) * 7} ${(cell + gap) * 5 + 18}`}>
      {dl.map((d, i) => (
        <text key={"d" + i} x={i * (cell + gap) + cell / 2} y={10} fill="#5f6b80" fontSize={9.5} textAnchor="middle" fontFamily="var(--font-jetbrains-mono)">
          {d}
        </text>
      ))}
      {cells.map((c, i) => {
        const col = i % 7,
          row = Math.floor(i / 7);
        const val = c.amount / max;
        return (
          <rect
            key={i}
            x={col * (cell + gap)}
            y={row * (cell + gap) + 18}
            width={cell}
            height={cell}
            rx={5}
            fill={`rgba(52,211,153,${(0.1 + val * 0.85).toFixed(2)})`}
            stroke="rgba(255,255,255,.04)"
          >
            <title>{`${c.date}: KES ${Math.round(c.amount).toLocaleString()}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
