import Link from "next/link";

export default function Logo({ size = 34 }: { size?: number }) {
  return (
    <Link href="/" title="Back to home" style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
      <div
        className="font-space"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          background: "linear-gradient(135deg,#2f81f7,#34d399)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          color: "#05070e",
          fontSize: size * 0.44,
          boxShadow: "0 0 22px rgba(52,211,153,.45)",
        }}
      >
        M
      </div>
      <span className="font-space" style={{ fontWeight: 600, fontSize: size < 33 ? 16 : 18, letterSpacing: ".3px" }}>
        Money<span style={{ color: "#34d399" }}>DNA</span>
      </span>
    </Link>
  );
}
