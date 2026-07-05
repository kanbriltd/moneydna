import Link from "next/link";
import { auth } from "@/auth";
import Particles from "@/components/ui/Particles";
import Logo from "@/components/ui/Logo";

const FEATURES = [
  { icon: "🧬", title: "Spending DNA", body: "A behavioural fingerprint of how you really spend — and what it reveals about your money habits." },
  { icon: "📊", title: "Live dashboards", body: "Animated health score, savings rate, cashflow river and burn rate — your money at a glance." },
  { icon: "🔮", title: "Cashflow forecast", body: "Predict your balance 7, 30 and 90 days out with confidence bands and shortfall alerts." },
  { icon: "✦", title: "AI Wealth Coach", body: "Ask anything. Get concrete, numbers-backed answers built from your own transaction history." },
  { icon: "🇰🇪", title: "Built for M-PESA", body: "Understands Paybill, Till, Fuliza, M-Shwari and Send Money — not just generic bank rows." },
  { icon: "🛡️", title: "Saving culture", body: "Streaks, goals and nudges that make putting money aside a habit you actually keep." },
];

const btnPrimary: React.CSSProperties = {
  cursor: "pointer",
  fontFamily: "var(--font-manrope)",
  fontWeight: 700,
  fontSize: 15.5,
  color: "#05070e",
  background: "linear-gradient(135deg,#34d399,#2f81f7)",
  border: "none",
  padding: "15px 28px",
  borderRadius: 13,
  boxShadow: "0 10px 30px rgba(52,211,153,.3), 0 0 0 1px rgba(255,255,255,.08) inset",
  display: "flex",
  alignItems: "center",
  gap: 10,
  textDecoration: "none",
};
const btnSecondary: React.CSSProperties = {
  cursor: "pointer",
  fontFamily: "var(--font-manrope)",
  fontWeight: 600,
  fontSize: 15,
  color: "#e8edf6",
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.13)",
  padding: "15px 24px",
  borderRadius: 13,
  textDecoration: "none",
};

export default async function LandingPage() {
  const session = await auth();
  const appHref = session?.user ? "/dashboard" : "/login";

  return (
    <div className="md-page-bg">
      <div className="md-grid-bg" />
      <div style={{ position: "relative", zIndex: 2 }}>
        <Particles />
        {/* nav */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 26, fontSize: 14, color: "#8a97ad" }}>
            <span style={{ cursor: "pointer" }}>Product</span>
            <span style={{ cursor: "pointer" }}>Security</span>
            <span style={{ cursor: "pointer" }}>Pricing</span>
            <Link
              href={appHref}
              style={{ cursor: "pointer", fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: 14, color: "#e8edf6", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", padding: "9px 16px", borderRadius: 10, textDecoration: "none" }}
            >
              Open app
            </Link>
          </div>
        </div>

        {/* hero */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "64px 32px 30px", textAlign: "center", position: "relative" }}>
          <div className="font-mono-jb" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 999, background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.22)", fontSize: 12.5, color: "#7fe9c4", letterSpacing: ".5px", marginBottom: 30 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d399", animation: "mdGlowPulse 2s infinite" }} />
            FINANCIAL INTELLIGENCE · FOR EVERYONE
          </div>
          <h1 className="font-space" style={{ fontWeight: 700, fontSize: 62, lineHeight: 1.04, letterSpacing: "-1.5px", marginBottom: 22 }}>
            Your money tells a story.
            <br />
            <span style={{ background: "linear-gradient(110deg,#2f81f7,#34d399 55%,#a371f7)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>MoneyDNA reveals it.</span>
          </h1>
          <p style={{ maxWidth: 620, margin: "0 auto 38px", fontSize: 18, lineHeight: 1.6, color: "#9aa7bd" }}>
            Drop in your M-PESA or bank statement. In seconds our AI extracts every transaction, decodes your spending DNA, forecasts cashflow, and coaches you toward a stronger saving culture.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/upload" style={btnPrimary}>
              Analyze my statement <span style={{ fontSize: 18 }}>→</span>
            </Link>
            <Link href="/demo" style={btnSecondary}>
              View live demo
            </Link>
          </div>
          <div className="font-mono-jb" style={{ marginTop: 20, fontSize: 12.5, color: "#5f6b80" }}>🔒 Processed privately · no statement stored by default</div>
        </div>

        {/* glass preview strip */}
        <div style={{ maxWidth: 980, margin: "48px auto 0", padding: "0 32px" }}>
          <div style={{ position: "relative", borderRadius: 22, background: "linear-gradient(180deg,rgba(17,24,39,.7),rgba(10,16,28,.55))", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 40px 120px rgba(0,0,0,.5)", overflow: "hidden", backdropFilter: "blur(14px)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "34%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)", animation: "mdSheen 5.5s linear infinite", pointerEvents: "none" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(255,255,255,.06)" }}>
              <PreviewCell label="SAVINGS RATE" value="26%" valueColor="#34d399" sub="above 20% benchmark" />
              <PreviewCell label="HEALTH SCORE" value="78" unit="/100" sub="strong & stable" />
              <PreviewCell label="NET CASHFLOW" value="+337K" valueColor="#7fb4ff" sub="this month" />
              <PreviewCell label="DNA TYPE" value={"Disciplined\nBuilder"} valueColor="#c4a8ff" small />
            </div>
          </div>
        </div>

        {/* features */}
        <div style={{ maxWidth: 1120, margin: "80px auto 0", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div className="font-mono-jb" style={{ fontSize: 12.5, color: "#34d399", letterSpacing: 1, marginBottom: 12 }}>WHAT YOU GET</div>
            <h2 className="font-space" style={{ fontWeight: 700, fontSize: 34, letterSpacing: "-.5px" }}>A command center for your money</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: "linear-gradient(180deg,rgba(17,24,39,.6),rgba(10,16,28,.4))", border: "1px solid rgba(255,255,255,.07)", borderRadius: 18, padding: "26px 24px", animation: "mdFadeUp .6s both" }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 18, background: "rgba(47,129,247,.1)", border: "1px solid rgba(255,255,255,.08)" }}>{f.icon}</div>
                <div className="font-space" style={{ fontWeight: 600, fontSize: 18, marginBottom: 9 }}>{f.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#8a97ad" }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1120, margin: "64px auto 0", padding: "0 32px 80px" }}>
          <div style={{ borderRadius: 22, padding: "48px 40px", textAlign: "center", background: "radial-gradient(700px 300px at 50% 0%,rgba(52,211,153,.16),transparent 70%),linear-gradient(180deg,rgba(17,24,39,.7),rgba(10,16,28,.5))", border: "1px solid rgba(52,211,153,.18)" }}>
            <h2 className="font-space" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-.5px", marginBottom: 14 }}>Ready to meet your money?</h2>
            <p style={{ color: "#9aa7bd", fontSize: 16, marginBottom: 26 }}>It takes one statement and about ten seconds.</p>
            <Link href="/upload" style={{ ...btnPrimary, display: "inline-flex" }}>
              Upload statement →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCell({ label, value, valueColor, unit, sub, small }: { label: string; value: string; valueColor?: string; unit?: string; sub?: string; small?: boolean }) {
  return (
    <div style={{ background: "#0b1220", padding: "22px 20px" }}>
      <div className="font-mono-jb" style={{ fontSize: 11.5, color: "#7fe9c4", letterSpacing: ".5px", marginBottom: 8 }}>{label}</div>
      <div className="font-space" style={{ fontWeight: 700, fontSize: small ? 20 : 30, color: valueColor ?? "#e8edf6", lineHeight: small ? 1.15 : undefined, marginTop: small ? 4 : undefined, whiteSpace: "pre-line" }}>
        {value}
        {unit && <span style={{ fontSize: 15, color: "#5f6b80" }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#5f6b80", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
