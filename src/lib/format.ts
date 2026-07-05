export function kes(n: number): string {
  const rounded = Math.round(n) || 0; // normalizes -0 to 0
  return "KES " + rounded.toLocaleString("en-US");
}

export function kfmt(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return sign + "KES " + (abs / 1_000_000).toFixed(2) + "M";
  return sign + "KES " + Math.round(abs / 1000) + "K";
}

export function shortK(v: number): string {
  return v >= 1000 ? (v / 1000).toFixed(2) + "M" : Math.round(v) + "K";
}

export function pct(n: number, digits = 0): string {
  return n.toFixed(digits) + "%";
}
