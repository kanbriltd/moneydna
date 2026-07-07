"use client";

import Link from "next/link";
import { kes } from "@/lib/format";
import Constellation, { type Star } from "@/components/ui/Constellation";

interface Traits {
  saver: number;
  planner: number;
  impulse: number;
  risk: number;
  discipline: number;
}
interface Profile {
  discoveryComplete: boolean;
  dnaLabel: string | null;
  dnaSummary: string | null;
  moneyStory: string | null;
  temperament: string | null;
  planning: string | null;
  riskComfort: string | null;
  lifeStage: string | null;
  supportsFamily: boolean;
  goodLife: string | null;
  biggestFear: string | null;
  futureVision: string | null;
  traits: Traits;
}
interface Situation {
  monthlyIncome: number | null;
  monthlySavings: number | null;
  paydayDay: number | null;
  topExpense1: string | null;
  hasDebt: boolean;
}
interface DecisionStar {
  id: string;
  forDate: string;
  title: string;
  status: string;
  band: string;
  estimatedImpact: number;
}

const HOPE = "#49e6b3";
const GOLD = "#d9b36c";
const LAVENDER = "#8e8cff";
const TEXT = "#f5f6fa";
const DIM = "#a3b1c6";

const HUMANIZE: Record<string, string> = {
  scarcity: "money was tight growing up",
  comfort: "money felt comfortable growing up",
  chaos: "money felt unpredictable growing up",
  spender: "a natural spender",
  saver: "a natural saver",
  balanced: "balanced between spending and saving",
  planner: "a planner",
  spontaneous: "spontaneous",
  cautious: "cautious with risk",
  moderate: "moderate with risk",
  bold: "bold with risk",
  student: "a student",
  earlyCareer: "early in your career",
  family: "building a family",
  established: "established",
  freedom: "freedom",
  security: "security",
  status: "recognition",
  adventure: "adventure",
  legacy: "legacy",
};
const h = (v: string | null) => (v ? HUMANIZE[v] ?? v : null);

const TRAIT_META: { key: keyof Traits; label: string; color: string }[] = [
  { key: "saver", label: "Saver", color: HOPE },
  { key: "planner", label: "Planner", color: LAVENDER },
  { key: "discipline", label: "Discipline", color: GOLD },
  { key: "risk", label: "Risk", color: LAVENDER },
  { key: "impulse", label: "Calm", color: HOPE },
];

export default function MemoryView({
  profile,
  situation,
  decisions,
}: {
  profile: Profile | null;
  situation: Situation | null;
  decisions: DecisionStar[];
}) {
  if (!profile || !profile.discoveryComplete) {
    return (
      <Wrap>
        <Header />
        <Card style={{ textAlign: "center", padding: "48px 30px" }}>
          <div style={{ fontSize: 30, marginBottom: 16 }}>✦</div>
          <h2 className="font-display" style={{ fontSize: 26, fontWeight: 500, color: TEXT, margin: "0 0 10px" }}>
            Today begins your financial memory
          </h2>
          <p style={{ color: DIM, fontSize: 15, lineHeight: 1.7, margin: "0 auto 26px", maxWidth: 380 }}>
            Memory grows from your Financial DNA — your story, your temperament, the life you&rsquo;re building. Once we
            begin, everything meaningful becomes part of your constellation.
          </p>
          <Link href="/discover" className="md-btn-primary" style={primaryLink}>
            Begin discovery →
          </Link>
        </Card>
      </Wrap>
    );
  }

  // Traits as a living constellation. Impulse is inverted so "calm" reads as bright.
  const traitStars: Star[] = TRAIT_META.map((t) => {
    const raw = profile.traits[t.key];
    const value = t.key === "impulse" ? 100 - raw : raw;
    return { id: t.key, label: t.label, brightness: Math.max(0.15, value / 100), color: t.color };
  });

  const storyBits = [
    h(profile.moneyStory),
    profile.temperament ? `you're ${h(profile.temperament)}` : null,
    profile.planning ? `${h(profile.planning)} by nature` : null,
    h(profile.riskComfort),
    profile.lifeStage ? `${h(profile.lifeStage)}` : null,
    profile.supportsFamily ? "you support family financially" : null,
  ].filter(Boolean) as string[];

  return (
    <Wrap>
      <Header />

      {/* DNA identity + living constellation */}
      <Card accent>
        <SectionLabel icon="✦">YOUR FINANCIAL DNA</SectionLabel>
        <h2 className="font-display" style={{ fontSize: 30, fontWeight: 500, color: TEXT, margin: "8px 0 6px", lineHeight: 1.15 }}>
          {profile.dnaLabel ?? "Still forming"}
        </h2>
        {profile.dnaSummary && <p style={{ color: "#cdd6e3", fontSize: 15, lineHeight: 1.7, margin: "0 0 6px" }}>{profile.dnaSummary}</p>}
        <div style={{ margin: "8px -8px 0" }}>
          <Constellation stars={traitStars} seed={11} height={220} showLabels />
        </div>
        <p style={{ color: "#6b7891", fontSize: 12, textAlign: "center", margin: "2px 0 0" }}>
          Your pattern is yours alone — it shifts a little each time you act.
        </p>
      </Card>

      {/* Memory constellation of decisions */}
      <Card>
        <SectionLabel icon="✧">YOUR CONSTELLATION OF MOVES</SectionLabel>
        {decisions.length === 0 ? (
          <p style={{ color: DIM, fontSize: 14, lineHeight: 1.7, margin: "12px 0 0" }}>
            Every expert starts somewhere. Your first{" "}
            <Link href="/today" style={{ color: HOPE }}>
              Best Move
            </Link>{" "}
            becomes the first star here — and over the months, your financial life becomes its own constellation.
          </p>
        ) : (
          <>
            <p style={{ color: DIM, fontSize: 13, lineHeight: 1.55, margin: "8px 0 4px" }}>
              Each move you&rsquo;ve made is a star. The ones you followed shine brightest.
            </p>
            <DecisionSky decisions={decisions} />
          </>
        )}
      </Card>

      {/* What I remember */}
      <Card>
        <SectionLabel icon="🧠">WHAT I REMEMBER ABOUT YOU</SectionLabel>
        {storyBits.length > 0 && (
          <p style={{ color: "#cdd6e3", fontSize: 14.5, lineHeight: 1.75, margin: "12px 0 0" }}>
            {storyBits.map((b, i) => (
              <span key={i}>
                {i > 0 && " · "}
                {b}
              </span>
            ))}
          </p>
        )}
        {profile.goodLife && <MemoryLine label="A good life to you means" value={h(profile.goodLife) ?? profile.goodLife} />}
        {profile.biggestFear && <MemoryLine label="Your biggest money worry" value={profile.biggestFear} />}
        {profile.futureVision && <MemoryLine label="The life you're building, in your words" value={`"${profile.futureVision}"`} quote />}
      </Card>

      {/* Money situation */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <SectionLabel icon="◈">YOUR MONEY SITUATION</SectionLabel>
          <Link href="/settings" style={{ color: HOPE, fontSize: 12.5, textDecoration: "none" }}>
            Edit in Settings →
          </Link>
        </div>
        {situation ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            {situation.monthlyIncome != null && <Fact label="Monthly income" value={kes(situation.monthlyIncome)} />}
            {situation.monthlySavings != null && <Fact label="Monthly saving" value={kes(situation.monthlySavings)} />}
            {situation.paydayDay != null && <Fact label="Payday" value={`Day ${situation.paydayDay}`} />}
            {situation.topExpense1 && <Fact label="Biggest expense" value={situation.topExpense1} />}
            <Fact label="Debt" value={situation.hasDebt ? "Yes" : "No"} />
          </div>
        ) : (
          <p style={{ color: DIM, fontSize: 13.5, margin: "10px 0 0" }}>
            No money details yet — your first visit to{" "}
            <Link href="/today" style={{ color: HOPE }}>
              Today&rsquo;s Best Move
            </Link>{" "}
            will ask for them.
          </p>
        )}
      </Card>

      <p style={{ color: "#5d6b80", fontSize: 12.5, lineHeight: 1.6, textAlign: "center", margin: "4px 18px 0" }}>
        Memory is identity, not advice — it describes who you are, never what to buy. It only changes when your behaviour
        does.
      </p>
    </Wrap>
  );
}

/* A small sky where each decision is a star; followed ones burn brightest. */
function DecisionSky({ decisions }: { decisions: DecisionStar[] }) {
  const followed = decisions.filter((d) => d.status === "followed").length;
  const stars: Star[] = decisions.map((d) => {
    const bright = d.status === "followed" ? 1 : d.status === "skipped" ? 0.32 : 0.55;
    const color = d.status === "followed" ? HOPE : d.status === "skipped" ? "#6b7891" : GOLD;
    return { id: d.id, brightness: bright, color };
  });
  return (
    <>
      <div style={{ margin: "6px -8px 4px" }}>
        <Constellation stars={stars} seed={decisions.length + 5} height={200} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", marginTop: 4 }}>
        <Legend color={HOPE} label={`${followed} followed`} />
        <Legend color={GOLD} label="awaiting" />
        <Legend color="#6b7891" label="skipped" />
      </div>
    </>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: DIM, fontSize: 11.5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
    </span>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 4 }}>
      <h1 className="font-display" style={{ fontSize: 34, fontWeight: 500, color: TEXT, margin: 0, lineHeight: 1.1 }}>
        Memory
      </h1>
      <div style={{ color: DIM, fontSize: 14.5, marginTop: 8, lineHeight: 1.55 }}>
        Everything MoneyDNA has learned about you — becoming a constellation as you grow.
      </div>
    </div>
  );
}

function MemoryLine({ label, value, quote }: { label: string; value: string; quote?: boolean }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ color: DIM, fontSize: 12 }}>{label}</div>
      <div
        className={quote ? "font-display" : undefined}
        style={{ color: quote ? "#bfe9d8" : "#dbe2ec", fontSize: quote ? 16 : 14.5, lineHeight: 1.6, marginTop: 3, fontStyle: quote ? "italic" : "normal" }}
      >
        {value}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "9px 14px", borderRadius: 12, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)" }}>
      <div style={{ color: DIM, fontSize: 11 }}>{label}</div>
      <div className="font-num" style={{ color: TEXT, fontSize: 14, fontWeight: 600, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "34px 22px 60px", maxWidth: 640, margin: "0 auto", display: "grid", gap: 18 }}>{children}</div>;
}
function Card({ children, accent, style }: { children: React.ReactNode; accent?: boolean; style?: React.CSSProperties }) {
  return (
    <div
      className="md-hero-card"
      style={{
        borderRadius: 22,
        padding: "22px 24px",
        background: accent ? "linear-gradient(165deg,rgba(73,230,179,.09),rgba(142,140,255,.05))" : "var(--md-card)",
        border: `1px solid ${accent ? "rgba(73,230,179,.2)" : "var(--md-line)"}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: string }) {
  return (
    <div className="font-num" style={{ color: HOPE, fontSize: 11, letterSpacing: "2px", display: "flex", alignItems: "center", gap: 8 }}>
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      {children}
    </div>
  );
}
const primaryLink: React.CSSProperties = {
  cursor: "pointer",
  display: "inline-block",
  padding: "13px 28px",
  borderRadius: 13,
  border: "1px solid rgba(73,230,179,.4)",
  fontWeight: 700,
  fontSize: 15,
  color: "#08140f",
  background: "linear-gradient(135deg,#7defc2,#49e6b3)",
  textDecoration: "none",
  boxShadow: "0 10px 26px -6px rgba(73,230,179,.35)",
};
