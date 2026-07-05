"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Logo from "@/components/ui/Logo";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "◈", href: "/dashboard" },
  { key: "analytics", label: "Analytics", icon: "◑", href: "/analytics" },
  { key: "twin", label: "Financial Twin", icon: "◭", href: "/twin" },
  { key: "simulator", label: "What-If Simulator", icon: "◎", href: "/simulator" },
  { key: "coach", label: "Financial Companion", icon: "✦", href: "/coach" },
];

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
      style={{
        width: 248,
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,.07)",
        padding: "24px 18px",
        display: "flex",
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

      {NAV.map((n) => {
        const on = pathname?.startsWith(n.href);
        return (
          <Link
            key={n.key}
            href={n.href}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 13px",
              borderRadius: 11,
              fontSize: 14.5,
              fontWeight: 600,
              color: on ? "#e8edf6" : "#8a97ad",
              background: on ? "rgba(52,211,153,.1)" : "transparent",
              border: `1px solid ${on ? "rgba(52,211,153,.22)" : "rgba(255,255,255,0)"}`,
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>
            {n.label}
          </Link>
        );
      })}

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
