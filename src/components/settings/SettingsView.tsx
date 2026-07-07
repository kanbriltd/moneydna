"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface Situation {
  monthlyIncome: number | null;
  monthlySavings: number | null;
  paydayDay: number | null;
  topExpense1: string | null;
  hasDebt: boolean;
}

export default function SettingsView({
  account,
  situation,
}: {
  account: { name: string; email: string; businessName: string | null };
  situation: Situation | null;
}) {
  return (
    <div style={{ padding: "34px 22px 60px", maxWidth: 640, margin: "0 auto", display: "grid", gap: 18 }}>
      <div>
        <h1 className="font-space" style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-.5px" }}>
          Settings
        </h1>
        <div style={{ color: "#8a97ad", fontSize: 14.5, marginTop: 6 }}>Your account, your numbers, your data.</div>
      </div>

      {/* Account */}
      <Card>
        <SectionLabel icon="👤">ACCOUNT</SectionLabel>
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <ReadonlyRow label="Name" value={account.name} />
          <ReadonlyRow label="Email" value={account.email} />
          <ReadonlyRow label="Business" value={account.businessName || "Personal account"} />
        </div>
      </Card>

      {/* Money situation */}
      <SituationCard initial={situation} />

      {/* Data */}
      <Card>
        <SectionLabel icon="📄">DATA</SectionLabel>
        <p style={{ color: "#8a97ad", fontSize: 13.5, lineHeight: 1.6, margin: "10px 0 14px" }}>
          MoneyDNA works without any statement — but uploading one (M-PESA or bank) sharpens every insight and unlocks
          the full analytics.
        </p>
        <Link href="/upload" className="md-btn-ghost" style={ghostLink}>
          Upload a statement →
        </Link>
      </Card>

      {/* Session */}
      <Card>
        <SectionLabel icon="🔐">SESSION</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#8a97ad", fontSize: 13.5 }}>Signed in as {account.email}</span>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="md-btn-ghost" style={{ ...ghostLink, color: "#f87171", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </Card>
    </div>
  );
}

function SituationCard({ initial }: { initial: Situation | null }) {
  const router = useRouter();
  const [income, setIncome] = useState(initial?.monthlyIncome != null ? String(initial.monthlyIncome) : "");
  const [savings, setSavings] = useState(initial?.monthlySavings != null ? String(initial.monthlySavings) : "");
  const [payday, setPayday] = useState(initial?.paydayDay != null ? String(initial.paydayDay) : "");
  const [exp1, setExp1] = useState(initial?.topExpense1 ?? "");
  const [hasDebt, setHasDebt] = useState<boolean>(initial?.hasDebt ?? false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome: income ? Number(income.replace(/[^\d]/g, "")) : undefined,
          monthlySavings: savings ? Number(savings.replace(/[^\d]/g, "")) : undefined,
          paydayDay: payday ? Number(payday) : undefined,
          topExpense1: exp1 || undefined,
          hasDebt,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionLabel icon="💼">MONEY SITUATION</SectionLabel>
      <p style={{ color: "#8a97ad", fontSize: 13, lineHeight: 1.55, margin: "8px 0 16px" }}>
        These power your daily move. Update them whenever life changes.
      </p>
      <div style={{ display: "grid", gap: 13 }}>
        <Field label="Monthly income (KES)">
          <Input value={income} onChange={setIncome} placeholder="e.g. 60000" />
        </Field>
        <Field label="Monthly saving (KES)">
          <Input value={savings} onChange={setSavings} placeholder="e.g. 8000" />
        </Field>
        <Field label="Payday (day of month)">
          <Input value={payday} onChange={setPayday} placeholder="e.g. 28" />
        </Field>
        <Field label="Biggest monthly expense">
          <Input value={exp1} onChange={setExp1} placeholder="e.g. Rent" text />
        </Field>
        <Field label="Do you currently have any debt?">
          <div style={{ display: "flex", gap: 8 }}>
            <Choice active={hasDebt} onClick={() => setHasDebt(true)}>
              Yes
            </Choice>
            <Choice active={!hasDebt} onClick={() => setHasDebt(false)}>
              No
            </Choice>
          </div>
        </Field>
      </div>
      <button onClick={save} disabled={busy} className="font-space md-btn-primary" style={{ ...primaryBtn, marginTop: 16, opacity: busy ? 0.7 : 1 }}>
        {busy ? "Saving…" : "Save changes"}
      </button>
      {saved && <span style={{ color: "#7fe9c4", fontSize: 13, marginLeft: 12 }}>Saved ✓</span>}
      {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</div>}
    </Card>
  );
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14 }}>
      <span style={{ color: "#8a97ad", fontSize: 13 }}>{label}</span>
      <span style={{ color: "#e8edf6", fontSize: 14, fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="md-hero-card"
      style={{
        borderRadius: 20,
        padding: "22px 24px",
        background: "rgba(255,255,255,.035)",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      {children}
    </div>
  );
}
function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <div className="font-mono-jb" style={{ color: "#7fe9c4", fontSize: 11, letterSpacing: ".6px", display: "flex", alignItems: "center", gap: 7 }}>
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", color: "#a7b2c4", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder, text }: { value: string; onChange: (v: string) => void; placeholder?: string; text?: boolean }) {
  return (
    <input
      inputMode={text ? "text" : "numeric"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="md-input"
      style={{
        width: "100%",
        padding: "11px 13px",
        borderRadius: 11,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.14)",
        color: "#e8edf6",
        fontSize: 14.5,
        outline: "none",
      }}
    />
  );
}
function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="md-btn-ghost"
      style={{
        flex: 1,
        cursor: "pointer",
        padding: "10px",
        borderRadius: 11,
        fontSize: 14,
        fontWeight: 600,
        background: active ? "rgba(52,211,153,.15)" : "rgba(255,255,255,.04)",
        border: `1px solid ${active ? "rgba(52,211,153,.35)" : "rgba(255,255,255,.12)"}`,
        color: active ? "#7fe9c4" : "#a7b2c4",
      }}
    >
      {children}
    </button>
  );
}
const primaryBtn: React.CSSProperties = {
  cursor: "pointer",
  padding: "12px 22px",
  borderRadius: 12,
  border: "none",
  fontWeight: 700,
  fontSize: 14.5,
  color: "#05110c",
  background: "linear-gradient(135deg,#34d399,#22d3ee)",
  fontFamily: "inherit",
  boxShadow: "0 10px 26px -6px rgba(52,211,153,.35)",
};
const ghostLink: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: 11,
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "#cdd6e4",
  fontSize: 13.5,
  fontWeight: 600,
  textDecoration: "none",
};
