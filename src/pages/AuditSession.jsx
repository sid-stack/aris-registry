import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useAuth } from "@clerk/clerk-react";
import AuditProcessingSkeleton from "../components/audit/AuditProcessingSkeleton.jsx";
import AuditTeaserShell from "../components/audit/AuditTeaserShell.jsx";

const AuditResult = lazy(() => import("./AuditResult.jsx"));

const POLL_MS = 3000;
const SKELETON_STEPS = 6;

export default function AuditSession({ auditId, onBack }) {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const [phase, setPhase] = useState("processing");
  const [teaser, setTeaser] = useState(null);
  const [result, setResult] = useState(null);
  const [skeletonStep, setSkeletonStep] = useState(0);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const stepRef = useRef(null);

  // Advance skeleton steps
  useEffect(() => {
    stepRef.current = setInterval(() => {
      setSkeletonStep(s => Math.min(s + 1, SKELETON_STEPS - 1));
    }, 2000);
    return () => clearInterval(stepRef.current);
  }, []);

  // Poll teaser
  useEffect(() => {
    if (phase !== "processing") return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/audits/${auditId}/teaser`);
        if (!res.ok) { setPhase("failed"); setError("Could not reach the audit server."); return; }
        const data = await res.json();
        if (data.status === "teaser_ready") {
          clearInterval(pollRef.current);
          clearInterval(stepRef.current);
          setTeaser(data.teaser);
          setPhase("teaser_ready");
        } else if (data.status === "failed") {
          clearInterval(pollRef.current);
          setPhase("failed");
          setError("The audit could not complete. Try pasting more of the solicitation text.");
        }
      } catch {
        // transient — keep polling
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [auditId, phase]);

  // Once teaser is ready + user signed in → fetch full result
  useEffect(() => {
    if (phase !== "teaser_ready" || !isLoaded || !isSignedIn || !userId) return;

    (async () => {
      try {
        const res = await fetch(`/api/audits/${auditId}/result`, {
          headers: { "x-user-id": userId },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "ready" && data.result) {
          setResult(data.result);
          setPhase("unlocked");
        }
      } catch {
        // non-fatal — user stays on teaser
      }
    })();
  }, [phase, isLoaded, isSignedIn, userId, auditId]);

  if (phase === "processing") return <AuditProcessingSkeleton step={skeletonStep} />;

  if (phase === "failed") {
    return (
      <div style={errStyle.root}>
        <div style={errStyle.card}>
          <p style={errStyle.label}>AUDIT FAILED</p>
          <h1 style={errStyle.title}>Could not process this solicitation</h1>
          <p style={errStyle.body}>{error || "Try pasting more text or uploading the full PDF."}</p>
          <button onClick={onBack} style={errStyle.btn}>← Try Again</button>
        </div>
      </div>
    );
  }

  if (phase === "teaser_ready") return <AuditTeaserShell teaser={teaser} auditId={auditId} />;

  if (phase === "unlocked" && result) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d0f14" }} />}>
        <AuditResult result={result} auditId={auditId} onBack={onBack} />
      </Suspense>
    );
  }

  return <div style={{ minHeight: "100vh", background: "#0d0f14" }} />;
}

const errStyle = {
  root: { minHeight: "100vh", background: "#0a0d14", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', system-ui, sans-serif" },
  card: { maxWidth: 460, width: "100%", background: "rgba(13,17,24,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 32, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" },
  label: { fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" },
  title: { fontSize: 22, fontWeight: 800, color: "#f8fafc", margin: "0 0 12px", lineHeight: 1.2 },
  body: { fontSize: 14, color: "#94a3b8", margin: "0 0 24px", lineHeight: 1.6 },
  btn: { background: "#0B3D91", color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
};
