"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { kes } from "@/lib/format";
import NewGoalModal from "@/components/dashboard/NewGoalModal";

interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
}

export default function GoalsView({ goals }: { goals: Goal[] }) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div style={{ padding: "34px 22px 60px", maxWidth: 640, margin: "0 auto", display: "grid", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="font-space" style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-.5px" }}>
            Goals
          </h1>
          <div style={{ color: "#8a97ad", fontSize: 14.5, marginTop: 6 }}>
            What you&rsquo;re building toward — every daily move feeds these.
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="font-space md-btn-primary" style={primaryBtn}>
          + New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div
          className="md-hero-card"
          style={{
            borderRadius: 20,
            padding: "44px 30px",
            textAlign: "center",
            background: "rgba(255,255,255,.035)",
            border: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <div style={{ fontSize: 34, marginBottom: 14 }}>🎯</div>
          <h2 className="font-space" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            No goals yet
          </h2>
          <p style={{ color: "#8a97ad", fontSize: 14.5, lineHeight: 1.65, margin: "0 auto 22px", maxWidth: 380 }}>
            A goal gives every daily move a direction. Start with one — an emergency fund is a great first pick.
          </p>
          <button onClick={() => setShowNew(true)} className="font-space md-btn-primary" style={primaryBtn}>
            Create your first goal
          </button>
        </div>
      ) : (
        goals.map((g) => <GoalCard key={g.id} goal={g} />)
      )}

      {showNew && <NewGoalModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const done = pct >= 100;

  async function addSavings() {
    const delta = parseFloat(amount.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(delta) || delta <= 0) {
      setError("Enter an amount to add.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmount: goal.currentAmount + delta }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't save — try again.");
      return;
    }
    setAdding(false);
    setAmount("");
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete the goal "${goal.name}"?`)) return;
    const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div
      className="md-hero-card"
      style={{
        borderRadius: 20,
        padding: "20px 24px",
        background: "rgba(255,255,255,.035)",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            background: `${goal.color}1f`,
            border: `1px solid ${goal.color}45`,
            flexShrink: 0,
          }}
        >
          {goal.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-space" style={{ fontSize: 16.5, fontWeight: 700 }}>
            {goal.name} {done && "🎉"}
          </div>
          <div style={{ color: "#8a97ad", fontSize: 12.5, marginTop: 2 }}>
            {kes(goal.currentAmount)} of {kes(goal.targetAmount)}
          </div>
        </div>
        <div className="font-space" style={{ color: done ? "#34d399" : goal.color, fontSize: 18, fontWeight: 800 }}>
          {pct.toFixed(0)}%
        </div>
      </div>

      <div style={{ height: 8, borderRadius: 6, background: "rgba(255,255,255,.06)", overflow: "hidden", marginTop: 14 }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 6,
            background: done ? "linear-gradient(90deg,#34d399,#22d3ee)" : goal.color,
            transition: "width .6s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
        {!adding ? (
          <>
            <button onClick={() => setAdding(true)} className="md-btn-ghost" style={smallBtn}>
              + Add savings
            </button>
            <button onClick={remove} className="md-btn-ghost" style={{ ...smallBtn, color: "#f87171", marginLeft: "auto" }}>
              Delete
            </button>
          </>
        ) : (
          <>
            <input
              autoFocus
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (KES)"
              className="md-input"
              style={{
                flex: 1,
                minWidth: 120,
                padding: "9px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.14)",
                color: "#e8edf6",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button onClick={addSavings} disabled={busy} className="font-space md-btn-primary" style={{ ...smallBtn, ...primarySmall, opacity: busy ? 0.7 : 1 }}>
              {busy ? "Saving…" : "Add"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setError("");
              }}
              className="md-btn-ghost"
              style={smallBtn}
            >
              Cancel
            </button>
          </>
        )}
      </div>
      {error && <div style={{ color: "#f87171", fontSize: 12.5, marginTop: 8 }}>{error}</div>}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  cursor: "pointer",
  padding: "12px 20px",
  borderRadius: 12,
  border: "none",
  fontWeight: 700,
  fontSize: 14.5,
  color: "#05110c",
  background: "linear-gradient(135deg,#34d399,#22d3ee)",
  fontFamily: "inherit",
  boxShadow: "0 10px 26px -6px rgba(52,211,153,.35)",
};
const primarySmall: React.CSSProperties = {
  border: "none",
  color: "#05110c",
  background: "linear-gradient(135deg,#34d399,#22d3ee)",
  fontWeight: 700,
};
const smallBtn: React.CSSProperties = {
  cursor: "pointer",
  padding: "9px 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "#a7b2c4",
  fontSize: 13,
  fontFamily: "inherit",
};
