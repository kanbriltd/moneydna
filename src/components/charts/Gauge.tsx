export default function Gauge({
  value,
  max,
  size,
  stroke,
  color,
  trackOnly = false,
}: {
  value: number;
  max: number;
  size: number;
  stroke: number;
  color: string;
  trackOnly?: boolean;
}) {
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, value / max)));
  const gid = `gg-${size}-${stroke}-${color.replace("#", "")}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#2f81f7" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={stroke} />
      {!trackOnly && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)`, transition: "stroke-dashoffset .3s ease" }}
        />
      )}
    </svg>
  );
}
