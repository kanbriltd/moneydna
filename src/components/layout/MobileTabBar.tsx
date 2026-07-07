"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "today", label: "Today", icon: "✦", href: "/today" },
  { key: "dna", label: "DNA", icon: "🧬", href: "/discover" },
  { key: "goals", label: "Goals", icon: "🎯", href: "/goals" },
  { key: "memory", label: "Memory", icon: "🧠", href: "/memory" },
];

const MORE = [
  { key: "insights", label: "Insights", icon: "◑", href: "/analytics" },
  { key: "history", label: "History", icon: "📅", href: "/history" },
  { key: "settings", label: "Settings", icon: "⚙", href: "/settings" },
  { key: "dashboard", label: "Dashboard", icon: "◈", href: "/dashboard" },
  { key: "coach", label: "Wealth Coach", icon: "✦", href: "/coach" },
  { key: "blueprint", label: "Salary Blueprint", icon: "◆", href: "/blueprint" },
  { key: "simulator", label: "Wealth Simulator", icon: "◎", href: "/simulator" },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((m) => pathname?.startsWith(m.href));

  return (
    <>
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 39, background: "rgba(3,5,10,.55)", backdropFilter: "blur(2px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 86,
              borderRadius: 20,
              padding: "12px 10px",
              background: "linear-gradient(180deg,#0d1422,#090e18)",
              border: "1px solid rgba(255,255,255,.09)",
              boxShadow: "0 -10px 50px rgba(0,0,0,.5)",
              display: "grid",
              gap: 2,
              animation: "mdFadeUp .22s ease both",
            }}
          >
            {MORE.map((m) => {
              const on = pathname?.startsWith(m.href);
              return (
                <Link
                  key={m.key}
                  href={m.href}
                  onClick={() => setMoreOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: on ? "#e8edf6" : "#8a97ad",
                    background: on ? "rgba(52,211,153,.1)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ width: 20, textAlign: "center" }}>{m.icon}</span>
                  {m.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav
        className="md-tabbar"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          alignItems: "stretch",
          justifyContent: "space-around",
          padding: "10px 6px calc(10px + env(safe-area-inset-bottom))",
          background: "rgba(7,10,18,.88)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid rgba(255,255,255,.07)",
        }}
      >
        {TABS.map((t) => {
          const on = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.key}
              href={t.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                flex: 1,
                fontSize: 11,
                fontWeight: 600,
                color: on ? "#34d399" : "#7a8699",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 17, filter: on ? "none" : "grayscale(1) opacity(.75)" }}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            flex: 1,
            fontSize: 11,
            fontWeight: 600,
            color: moreOpen || moreActive ? "#34d399" : "#7a8699",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: 17 }}>⋯</span>
          More
        </button>
      </nav>
    </>
  );
}
