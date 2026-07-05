export interface SankeyNode {
  name: string;
  value: number;
  color: string;
}

export default function Sankey({ income, outflow }: { income: SankeyNode[]; outflow: SankeyNode[] }) {
  const W = 820,
    H = 320,
    lx = 40,
    mx = 300,
    rx = 560,
    nw = 16;
  const totI = income.reduce((s, x) => s + x.value, 0) || 1;
  const totO = outflow.reduce((s, x) => s + x.value, 0) || 1;
  const scale = (H - 60) / Math.max(totI, totO, 1);

  let y = 30;
  const incPos = income.map((n) => {
    const h = Math.max(4, n.value * scale);
    const o = { ...n, y, h };
    y += h + 10;
    return o;
  });
  const hubH = totI * scale;
  const hubY = 30;

  y = 30;
  const outPos = outflow.map((n) => {
    const h = Math.max(4, n.value * scale);
    const o = { ...n, y, h };
    y += h + 8;
    return o;
  });

  const links: React.ReactNode[] = [];
  let hubFillL = hubY;
  incPos.forEach((n, i) => {
    const y0 = n.y + n.h / 2,
      y1 = hubFillL + n.h / 2;
    hubFillL += n.h;
    links.push(
      <path
        key={"li" + i}
        d={`M ${lx + nw} ${y0} C ${(lx + mx) / 2} ${y0}, ${(lx + mx) / 2} ${y1}, ${mx} ${y1}`}
        fill="none"
        stroke={n.color}
        strokeWidth={Math.max(2, n.h)}
        opacity={0.32}
      />
    );
  });
  let hubFillR = hubY;
  outPos.forEach((n, i) => {
    const yy0 = hubFillR + n.h / 2;
    hubFillR += n.h;
    const y1 = n.y + n.h / 2;
    links.push(
      <path
        key={"lo" + i}
        d={`M ${mx + nw} ${yy0} C ${(mx + rx) / 2} ${yy0}, ${(mx + rx) / 2} ${y1}, ${rx} ${y1}`}
        fill="none"
        stroke={n.color}
        strokeWidth={Math.max(2, n.h)}
        opacity={0.32}
      />
    );
  });

  const nodes: React.ReactNode[] = [];
  incPos.forEach((n, i) => {
    nodes.push(<rect key={"ni" + i} x={lx} y={n.y} width={nw} height={n.h} rx={3} fill={n.color} />);
    nodes.push(
      <text key={"ti" + i} x={lx - 8} y={n.y + n.h / 2 + 4} fill="#cdd6e4" fontSize={11.5} textAnchor="end" fontFamily="var(--font-manrope)">
        {n.name}
      </text>
    );
  });
  nodes.push(<rect key="hub" x={mx} y={hubY} width={nw} height={hubH} rx={3} fill="#e8edf6" />);
  nodes.push(
    <text key="hubt" x={mx + nw / 2} y={hubY - 8} fill="#8a97ad" fontSize={11} textAnchor="middle" fontFamily="var(--font-jetbrains-mono)">
      {`INCOME ${(totI / 1000).toFixed(0)}K`}
    </text>
  );
  outPos.forEach((n, i) => {
    nodes.push(<rect key={"no" + i} x={rx} y={n.y} width={nw} height={n.h} rx={3} fill={n.color} />);
    nodes.push(
      <text key={"to" + i} x={rx + nw + 8} y={n.y + n.h / 2 + 4} fill="#cdd6e4" fontSize={11.5} fontFamily="var(--font-manrope)">
        {`${n.name}  ${(n.value / 1000).toFixed(0)}K`}
      </text>
    );
  });

  return (
    <svg width={W + 110} height={H} viewBox={`-100 0 ${W + 120} ${H}`} style={{ minWidth: W + 110 }}>
      {links}
      {nodes}
    </svg>
  );
}
