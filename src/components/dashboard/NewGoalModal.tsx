"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ICONS = ["🛡️", "🏪", "🌍", "🎓", "🚗", "🏠", "✈️", "💍"];
const COLORS = ["#34d399", "#3b82f6", "#a371f7", "#f59e0b", "#f87171", "#22d3ee"];

export default function NewGoalModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const targetAmount = parseFloat(target);
    const currentAmount = parseFloat(current || "0");
    if (!name.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      setError("Give your goal a name and a target amount.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), icon, color, targetAmount, currentAmount: currentAmount || 0 }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't save that goal — try again.");
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 380,
          maxWidth: "92vw",
          borderRadius: 18,
          padding: 26,
          background: "linear-gradient(180deg,#111827,#0b1220)",
          border: "1px solid rgba(255,255,255,.1)",
        }}
      >
        <div className="font-space" style={{ fontWeight: 700, fontSize: 18, marginBottom: 18 }}>
          New savings goal
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ICONS.map((ic) => (
              <button
                type="button"
                key={ic}
                onClick={() => setIcon(ic)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  fontSize: 16,
                  cursor: "pointer",
                  background: icon === ic ? "rgba(52,211,153,.18)" : "rgba(255,255,255,.05)",
                  border: `1px solid ${icon === ic ? "rgba(52,211,153,.5)" : "rgba(255,255,255,.08)"}`,
                }}
              >
                {ic}
              </button>
            ))}
          </div>
          <input placeholder="Goal name (e.g. New laptop)" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <input placeholder="Target amount (KES)" type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} style={inputStyle} />
          <input placeholder="Already saved (optional)" type="number" min="0" value={current} onChange={(e) => setCurrent(e.target.value)} style={inputStyle} />
          <div style={{ display: "flex", gap: 6 }}>
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  cursor: "pointer",
                  background: c,
                  border: color === c ? "2px solid #fff" : "2px solid transparent",
                }}
              />
            ))}
          </div>
          {error && <div style={{ color: "#f87171", fontSize: 12.5 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, cursor: "pointer", padding: 12, borderRadius: 11, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#cdd6e4" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                flex: 1,
                cursor: "pointer",
                padding: 12,
                borderRadius: 11,
                border: "none",
                fontWeight: 700,
                color: "#05070e",
                background: "linear-gradient(135deg,#34d399,#2f81f7)",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Saving…" : "Create goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 10,
  padding: "11px 13px",
  color: "#e8edf6",
  fontFamily: "var(--font-manrope)",
  fontSize: 14,
  outline: "none",
};
