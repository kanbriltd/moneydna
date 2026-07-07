"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(params.get("callbackUrl") || "/today");
    router.refresh();
  }

  return (
    <div className="md-page-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div className="md-grid-bg" />
      <div style={{ position: "absolute", top: 24, left: 32, zIndex: 2 }}>
        <Logo size={30} />
      </div>
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 400,
          animation: "mdFadeUp .5s both",
          borderRadius: 20,
          padding: "34px 30px",
          background: "linear-gradient(180deg,rgba(17,24,39,.7),rgba(10,16,28,.5))",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <h1 className="font-space" style={{ fontWeight: 700, fontSize: 26, letterSpacing: "-.5px", marginBottom: 6 }}>
          Welcome back
        </h1>
        <p style={{ color: "#8a97ad", fontSize: 14, marginBottom: 26 }}>Sign in to see your money story.</p>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}
          <button
            type="submit"
            disabled={busy}
            style={{
              cursor: "pointer",
              fontFamily: "var(--font-manrope)",
              fontWeight: 700,
              fontSize: 15,
              color: "#05070e",
              background: "linear-gradient(135deg,#34d399,#2f81f7)",
              border: "none",
              padding: 14,
              borderRadius: 12,
              opacity: busy ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div style={{ marginTop: 20, fontSize: 13, color: "#7a8699", textAlign: "center" }}>
          New here?{" "}
          <Link href="/signup" style={{ color: "#34d399" }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 11,
  padding: "12px 14px",
  color: "#e8edf6",
  fontFamily: "var(--font-manrope)",
  fontSize: 14.5,
  outline: "none",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
