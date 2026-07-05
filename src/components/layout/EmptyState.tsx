import Link from "next/link";

export default function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: "80px 34px", display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 440, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 22px",
            borderRadius: 18,
            background: "rgba(52,211,153,.12)",
            border: "1px solid rgba(52,211,153,.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
          }}
        >
          📄
        </div>
        <h2 className="font-space" style={{ fontWeight: 700, fontSize: 22, marginBottom: 10 }}>
          {title}
        </h2>
        <p style={{ color: "#8a97ad", fontSize: 14.5, lineHeight: 1.6, marginBottom: 26 }}>{body}</p>
        <Link
          href="/upload"
          style={{
            display: "inline-flex",
            fontFamily: "var(--font-manrope)",
            fontWeight: 700,
            fontSize: 15,
            color: "#05070e",
            background: "linear-gradient(135deg,#34d399,#2f81f7)",
            padding: "13px 24px",
            borderRadius: 12,
            textDecoration: "none",
          }}
        >
          Upload a statement →
        </Link>
      </div>
    </div>
  );
}
