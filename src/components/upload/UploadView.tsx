"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  "Uploading statement",
  "Parsing document / extracting transactions",
  "AI categorising spend",
  "Detecting patterns & anomalies",
  "Composing your money story",
];

type Stage = "idle" | "busy" | "error";

export default function UploadView() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  async function runUpload(file: File) {
    setStage("busy");
    setFileName(file.name);
    setStep(0);
    setError("");

    const stepTimer = setInterval(() => {
      setStep((s) => (s < STEPS.length - 2 ? s + 1 : s));
    }, 650);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/statements/upload", { method: "POST", body: form });
      clearInterval(stepTimer);
      const data = await res.json();
      if (!res.ok) {
        setStage("error");
        setError(data.error || "Couldn't process that file.");
        return;
      }
      setStep(STEPS.length - 1);
      setTimeout(() => {
        router.push("/today");
        router.refresh();
      }, 500);
    } catch {
      clearInterval(stepTimer);
      setStage("error");
      setError("Network error — please try again.");
    }
  }

  async function runDemo() {
    setStage("busy");
    setFileName("Wanjiru's sample M-PESA statement");
    setStep(0);
    const stepTimer = setInterval(() => {
      setStep((s) => (s < STEPS.length - 2 ? s + 1 : s));
    }, 400);
    try {
      const res = await fetch("/api/statements/demo", { method: "POST" });
      clearInterval(stepTimer);
      if (!res.ok) {
        setStage("error");
        setError("Couldn't load the sample dataset.");
        return;
      }
      setStep(STEPS.length - 1);
      setTimeout(() => {
        router.push("/today");
        router.refresh();
      }, 400);
    } catch {
      clearInterval(stepTimer);
      setStage("error");
      setError("Network error — please try again.");
    }
  }

  function openPicker() {
    fileRef.current?.click();
  }
  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) runUpload(f);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) runUpload(f);
  }

  if (stage === "busy") {
    return (
      <div style={{ width: "100%", maxWidth: 520, animation: "mdFadeUp .4s both" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 84, height: 84, margin: "0 auto 24px", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid rgba(255,255,255,.07)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#34d399", borderRightColor: "#2f81f7", animation: "mdSpin 1s linear infinite" }} />
            <div className="font-space" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22, color: "#34d399" }}>
              {Math.round(((step + 1) / STEPS.length) * 100)}%
            </div>
          </div>
          <h2 className="font-space" style={{ fontWeight: 700, fontSize: 24, letterSpacing: "-.3px" }}>
            Decoding your money…
          </h2>
          <p style={{ color: "#8a97ad", fontSize: 14, marginTop: 6 }}>
            📄 {fileName} · {STEPS[step]}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 13, background: "rgba(17,24,39,.5)", border: "1px solid rgba(255,255,255,.06)" }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    flexShrink: 0,
                    background: done ? "rgba(52,211,153,.15)" : active ? "rgba(47,129,247,.15)" : "rgba(255,255,255,.04)",
                    border: `1px solid ${done ? "rgba(52,211,153,.4)" : active ? "rgba(47,129,247,.4)" : "rgba(255,255,255,.08)"}`,
                    color: done ? "#34d399" : active ? "#7fb4ff" : "#5f6b80",
                  }}
                >
                  {done ? "✓" : active ? "" : i + 1}
                </div>
                <span style={{ fontSize: 14.5, fontWeight: 500, color: done || active ? "#e8edf6" : "#7a8699" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 560, textAlign: "center", animation: "mdFadeUp .5s both" }}>
      <h2 className="font-space" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-.5px", marginBottom: 10 }}>
        Upload your statement
      </h2>
      <p style={{ color: "#8a97ad", fontSize: 15, marginBottom: 30 }}>M-PESA · Bank · SACCO · Credit card — PDF, CSV or Excel</p>

      {stage === "error" && (
        <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 12, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.25)", color: "#fca5a5", fontSize: 13.5, textAlign: "left" }}>
          {error}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.csv,.xls,.xlsx,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={onFilePicked}
        style={{ display: "none" }}
      />
      <div
        onClick={openPicker}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={onDrop}
        style={{
          cursor: "pointer",
          border: `1.5px dashed ${dragOver ? "rgba(52,211,153,.8)" : "rgba(52,211,153,.35)"}`,
          borderRadius: 20,
          padding: "50px 30px",
          background: dragOver ? "rgba(52,211,153,.08)" : "linear-gradient(180deg,rgba(17,24,39,.5),rgba(10,16,28,.35))",
          transition: ".18s",
        }}
      >
        <div style={{ width: 66, height: 66, margin: "0 auto 20px", borderRadius: 18, background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📄</div>
        <div className="font-space" style={{ fontWeight: 600, fontSize: 18, marginBottom: 6 }}>{dragOver ? "Release to upload" : "Drop your file here"}</div>
        <div style={{ color: "#7a8699", fontSize: 13.5 }}>{dragOver ? "PDF, CSV or Excel" : "or click to browse"}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <span className="font-mono-jb" style={{ fontSize: 11, color: "#7fe9c4", background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.2)", padding: "4px 9px", borderRadius: 7 }}>PDF</span>
          <span className="font-mono-jb" style={{ fontSize: 11, color: "#7fb4ff", background: "rgba(47,129,247,.1)", border: "1px solid rgba(47,129,247,.2)", padding: "4px 9px", borderRadius: 7 }}>CSV</span>
          <span className="font-mono-jb" style={{ fontSize: 11, color: "#c4a8ff", background: "rgba(163,113,247,.1)", border: "1px solid rgba(163,113,247,.2)", padding: "4px 9px", borderRadius: 7 }}>XLS / XLSX</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0", color: "#5f6b80", fontSize: 12.5 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
        OR
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
      </div>
      <button
        onClick={runDemo}
        style={{ cursor: "pointer", width: "100%", fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: 15, color: "#05070e", background: "linear-gradient(135deg,#34d399,#2f81f7)", border: "none", padding: 15, borderRadius: 13, boxShadow: "0 8px 24px rgba(52,211,153,.25)" }}
      >
        Use Wanjiru&apos;s sample M-PESA statement
      </button>
      <div className="font-mono-jb" style={{ marginTop: 14, fontSize: 12, color: "#5f6b80" }}>Demo data · small-business owner</div>
    </div>
  );
}
