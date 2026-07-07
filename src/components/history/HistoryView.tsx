"use client";

import Link from "next/link";
import { kes } from "@/lib/format";

interface Decision {
  id: string;
  forDate: string; // YYYY-MM-DD
  title: string;
  status: string; // pending | followed | skipped
  band: string; // high | medium | low
  estimatedImpact: number;
  goalName: string | null;
  skipReason: string | null;
}

const STATUS: Record<string, { label: string; color: string; icon: string }> = {
  followed: { label: "Followed", color: "#34d399", icon: "✓" },
  skipped: { label: "Skipped", color: "#8a97ad", icon: "—" },
  pending: { label: "Pending", color: "#f5b942", icon: "…" },
};

const SKIP_LABEL: Record<string, string> = {
  forgot: "forgot",
  couldnt_afford: "couldn't afford it",
  disagreed: "didn't agree",
  emergency: "emergency",
  other: "other",
};

export default function HistoryView({ decisions }: { decisions: Decision[] }) {
  const total = decisions.length;
  const followed = decisions.filter((d) => d.status === "followed").length;
  const answered = decisions.filter((d) => d.status !== "pending").length;
  const followRate = answered > 0 ? Math.round((followed / answered) * 100) : null;
  const totalImpact = decisions.filter((d) => d.status === "followed").reduce((s, d) => s + d.estimatedImpact, 0);

  return (
    <div style={{ padding: "34px 22px 60px", maxWidth: 640, margin: "0 auto", display: "grid", gap: 18 }}>
      <div>
        <h1 className="font-space" style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-.5px" }}>
          History
        </h1>
        <div style={{ color: "#8a97ad", fontSize: 14.5, marginTop: 6 }}>
          Every move you&rsquo;ve been given — and what you did with it.
        </div>
      </div>

      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <Stat label="Moves so far" value={String(total)} />
          <Stat label="Followed" value={followRate !== null ? `${followed} (${followRate}%)` : String(followed)} accent />
          <Stat label="Est. impact kept" value={kes(totalImpact)} />
        </div>
      )}

      {total === 0 ? (
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
          <div style={{ fontSize: 34, marginBottom: 14 }}>📅</div>
          <h2 className="font-space" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            Nothing here yet
          </h2>
          <p style={{ color: "#8a97ad", fontSize: 14.5, lineHeight: 1.65, margin: "0 auto 22px", maxWidth: 380 }}>
            Your first move appears the first time you open{" "}
            <Link href="/today" style={{ color: "#7fe9c4" }}>
              Today&rsquo;s Best Move
            </Link>
            . Come back after a few mornings and this becomes the story of your follow-through.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {decisions.map((d) => {
            const st = STATUS[d.status] ?? STATUS.pending;
            return (
              <div
                key={d.id}
                style={{
                  borderRadius: 16,
                  padding: "15px 18px",
                  background: "rgba(255,255,255,.035)",
                  border: "1px solid rgba(255,255,255,.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: st.color,
                    background: `${st.color}1a`,
                    border: `1px solid ${st.color}40`,
                    flexShrink: 0,
                  }}
                >
                  {st.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#e8edf6", fontSize: 14.5, fontWeight: 600, lineHeight: 1.35 }}>{d.title}</div>
                  <div style={{ color: "#8a97ad", fontSize: 12, marginTop: 3 }}>
                    {formatDay(d.forDate)}
                    {d.estimatedImpact > 0 && <> · ≈ {kes(d.estimatedImpact)}{d.goalName ? ` toward ${d.goalName}` : ""}</>}
                    {d.status === "skipped" && d.skipReason && <> · {SKIP_LABEL[d.skipReason] ?? d.skipReason}</>}
                  </div>
                </div>
                <span style={{ color: st.color, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "15px 18px",
        background: accent ? "linear-gradient(160deg,rgba(52,211,153,.12),rgba(47,129,247,.06))" : "rgba(255,255,255,.035)",
        border: `1px solid ${accent ? "rgba(52,211,153,.22)" : "rgba(255,255,255,.08)"}`,
      }}
    >
      <div className="font-mono-jb" style={{ color: "#8a97ad", fontSize: 10.5, letterSpacing: ".5px" }}>
        {label.toUpperCase()}
      </div>
      <div className="font-space" style={{ color: accent ? "#7fe9c4" : "#e8edf6", fontSize: 20, fontWeight: 800, marginTop: 5 }}>
        {value}
      </div>
    </div>
  );
}

function formatDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
