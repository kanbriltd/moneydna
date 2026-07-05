"use client";

import { useEffect, useRef, useState } from "react";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How can I save KES 10,000 monthly?",
  "Where is my money going?",
  "Am I overspending?",
  "How do I build a saving culture?",
];

export default function CoachView({ initialMessages, hasData }: { initialMessages: Msg[]; hasData: boolean }) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { id: "local-" + Date.now(), role: "user", content: q }]);
    setInput("");
    setTyping(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setTyping(false);
      if (res.ok) {
        setMessages((m) => [...m, { id: data.id, role: "assistant", content: data.content }]);
      } else {
        setMessages((m) => [...m, { id: "err-" + Date.now(), role: "assistant", content: "Something went wrong — try again?" }]);
      }
    } catch {
      setTyping(false);
      setMessages((m) => [...m, { id: "err-" + Date.now(), role: "assistant", content: "Something went wrong — try again?" }]);
    }
  }

  const greeting = hasData
    ? "Hi 👋 I've read your latest statement. Ask me anything about your money, or tap a suggestion below."
    : "Hi 👋 Upload a statement first (or use the sample dataset) and I'll ground every answer in your real numbers.";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "22px 30px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 13 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg,#34d399,#2f81f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 19,
            boxShadow: "0 0 22px rgba(52,211,153,.4)",
          }}
        >
          ✦
        </div>
        <div>
          <div className="font-space" style={{ fontWeight: 700, fontSize: 18 }}>
            Wealth Coach
          </div>
          <div style={{ fontSize: 12.5, color: "#34d399", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
            {hasData ? "Reading your transaction history" : "Waiting for a statement"}
          </div>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "26px 30px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <Bubble role="assistant" html={greeting} />
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} html={m.content} />
          ))}
          {typing && (
            <div style={{ display: "flex", gap: 12, alignSelf: "flex-start", alignItems: "center" }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  background: "rgba(52,211,153,.12)",
                  border: "1px solid rgba(52,211,153,.25)",
                  color: "#34d399",
                }}
              >
                ✦
              </div>
              <div style={{ padding: "15px 18px", borderRadius: 15, background: "rgba(17,24,39,.7)", border: "1px solid rgba(255,255,255,.08)", display: "flex", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", animation: "mdBlink 1s infinite" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", animation: "mdBlink 1s infinite .2s" }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", animation: "mdBlink 1s infinite .4s" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 30px 24px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 9, marginBottom: 13, flexWrap: "wrap" }}>
            {SUGGESTIONS.map((q) => (
              <div
                key={q}
                onClick={() => send(q)}
                style={{
                  cursor: "pointer",
                  fontSize: 12.5,
                  padding: "8px 13px",
                  borderRadius: 999,
                  background: "rgba(52,211,153,.07)",
                  border: "1px solid rgba(52,211,153,.2)",
                  color: "#9fe9cf",
                }}
              >
                {q}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(17,24,39,.7)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: "7px 7px 7px 18px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
              placeholder="Ask about your money…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e8edf6", fontFamily: "var(--font-manrope)", fontSize: 14.5 }}
            />
            <button
              onClick={() => send(input)}
              style={{
                cursor: "pointer",
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#34d399,#2f81f7)",
                color: "#05070e",
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, html }: { role: "user" | "assistant"; html: string }) {
  const me = role === "user";
  return (
    <div style={{ display: "flex", gap: 12, flexDirection: "row", alignItems: "flex-start", alignSelf: me ? "flex-end" : "flex-start", maxWidth: "88%" }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          background: me ? "rgba(163,113,247,.15)" : "rgba(52,211,153,.12)",
          border: `1px solid ${me ? "rgba(163,113,247,.3)" : "rgba(52,211,153,.25)"}`,
          color: me ? "#c4a8ff" : "#34d399",
        }}
      >
        {me ? "•" : "✦"}
      </div>
      <div
        style={{
          padding: "14px 17px",
          borderRadius: 15,
          fontSize: 14.5,
          lineHeight: 1.6,
          background: me ? "rgba(163,113,247,.12)" : "rgba(17,24,39,.7)",
          border: `1px solid ${me ? "rgba(163,113,247,.22)" : "rgba(255,255,255,.08)"}`,
          color: me ? "#e8edf6" : "#cdd6e4",
        }}
        {...(me ? {} : { dangerouslySetInnerHTML: { __html: html } })}
      >
        {me ? html : null}
      </div>
    </div>
  );
}
