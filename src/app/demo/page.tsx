"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import Logo from "@/components/ui/Logo";

export default function DemoPage() {
  const router = useRouter();
  const [stage, setStage] = useState("Setting up your live demo…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;

    async function run() {
      try {
        const currentSession = await getSession();
        if (!currentSession?.user) {
          setStage("Creating a guest account…");
          const suffix = Math.random().toString(36).slice(2, 10);
          const email = `guest-${suffix}@demo.moneydna.local`;
          const password = `guest-${suffix}-${Date.now()}`;
          const signupRes = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Guest", email, password }),
          });
          if (!signupRes.ok) throw new Error("signup failed");
          const signInRes = await signIn("credentials", { email, password, redirect: false });
          if (signInRes?.error) throw new Error("sign-in failed");
        }
        if (cancelled) return;
        setStage("Loading sample transaction history…");
        const demoRes = await fetch("/api/statements/demo", { method: "POST" });
        if (!demoRes.ok) throw new Error("demo seed failed");
        if (cancelled) return;
        router.push("/dashboard");
        router.refresh();
      } catch {
        if (!cancelled) setStage("Something went wrong setting up the demo — try again.");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="md-page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div className="md-grid-bg" />
      <div style={{ position: "absolute", top: 24, left: 32, zIndex: 2 }}>
        <Logo size={30} />
      </div>
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, margin: "0 auto 22px", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid rgba(255,255,255,.07)" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#34d399", borderRightColor: "#2f81f7", animation: "mdSpin 1s linear infinite" }} />
        </div>
        <div className="font-space" style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
          {stage}
        </div>
        <div style={{ color: "#7a8699", fontSize: 13.5 }}>Kamau Hardware Ltd · sample data</div>
      </div>
    </div>
  );
}
