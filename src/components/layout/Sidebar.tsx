"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Logo from "@/components/ui/Logo";

// The center of the app: one better decision every morning. Everything else supports it.
const PRIMARY_NAV = [
  { key: "today", label: "Today's Best Move", icon: "☀", href: "/today" },
  { key: "discover", label: "Financial DNA", icon: "🧬", href: "/discover" },
  { key: "memory", label: "Memory", icon: "🧠", href: "/memory" },
  { key: "goals", label: "Goals", icon: "🎯", href: "/goals" },
  { key: "insights", label: "Insights", icon: "◑", href: "/analytics" },
  { key: "history", label: "History", icon: "📅", href: "/history" },
  { key: "settings", label: "Settings", icon: "⚙", href: "/settings" },
];

const TOOLS_NAV = [
  { key: "dashboard", label: "Dashboard", icon: "◈", href: "/dashboard" },
  { key: "blueprint", label: "Salary Blueprint", icon: "◆", href: "/blueprint" },
  { key: "simulator", label: "Wealth Simulator", icon: "◎", href: "/simulator" },
  { key: "coach", label: "Wealth Coach", icon: "✦", href: "/coach" },
  { key: "pilot", label: "Pilot", icon: "◇", href: "/pilot" },
];

function NavItem({
  item,
  active,
  dim,
}: {
  item: { key: string; label: string; icon: string; href: string };
  active: boolean;
  dim?: boolean;
}) {
  return (
    <Link
      href={item.href}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: dim ? "9px 13px" : "11px 13px",
        borderRadius: 11,
        fontSize: dim ? 13.5 : 14.5,
        fontWeight: 600,
        color: active ? "#e8edf6" : dim ? "#6b7a8f" : "#8a97ad",
        background: active ? "rgba(52,211,153,.1)" : "transparent",
        border: `1px solid ${active ? "rgba(52,211,153,.22)" : "rgba(255,255,255,0)"}`,
        textDecoration: "none",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: dim ? 14 : 16, width: 20, textAlign: "center" }}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

export default function Sidebar({
  name,
  businessName,
  streakMonths,
}: {
  name: string;
  businessName: string | null;
  streakMonths: number;
}) {
  const pathname = usePathname();
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="md-sidebar"
      style={{
        width: 248,
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,.07)",
        padding: "24px 18px",
        flexDirection: "column",
        gap: 6,
        position: "sticky",
        top: 0,
        height: "100vh",
        background: "rgba(7,10,18,.5)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ padding: "4px 8px 22px" }}>
        <Logo size={32} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
        {PRIMARY_NAV.map((n) => (
          <NavItem key={n.key} item={n} active={!!pathname?.startsWith(n.href)} />
        ))}

        <div
          className="font-mono-jb"
          style={{ color: "#5d6b80", fontSize: 10.5, letterSpacing: ".7px", padding: "16px 13px 6px" }}
        >
          TOOLS
        </div>
        {TOOLS_NAV.map((n) => (
          <NavItem key={n.key} item={n} active={!!pathname?.startsWith(n.href)} dim />
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: 16,
          borderRadius: 14,
          background: "linear-gradient(160deg,rgba(52,211,153,.1),rgba(47,129,247,.06))",
          border: "1px solid rgba(52,211,153,.18)",
        }}
      >
        <div className="font-mono-jb" style={{ fontSize: 12, color: "#7fe9c4", letterSpacing: ".4px", marginBottom: 7 }}>
          SAVING STREAK
        </div>
        <div className="font-space" style={{ fontWeight: 700, fontSize: 24, color: "#34d399" }}>
          🔥 {streakMonths} {streakMonths === 1 ? "month" : "months"}
        </div>
        <div style={{ fontSize: 12, color: "#8a97ad", marginTop: 5, lineHeight: 1.4 }}>
          {streakMonths > 0
            ? `You've stayed above 20% savings for ${streakMonths} straight ${streakMonths === 1 ? "month" : "months"}. Keep the flame alive.`
            : "Hit 20% savings this month to start your streak."}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 8px 2px" }}>
        <div
          className="font-space"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#a371f7,#2f81f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 11.5, color: "#7a8699", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {businessName || "Personal account"}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title="Sign out"
          style={{
            cursor: "pointer",
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 8,
            width: 28,
            height: 28,
            color: "#8a97ad",
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          ⏻
        </button>
      </div>
    </div>
  );
}
