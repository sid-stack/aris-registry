import { useState } from "react";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function handleSubmit() {
    if (password === "aris369") {
      onLogin();
      setError("");
    } else {
      setError("Access denied");
      setPassword("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0d0f14", fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />

      <div style={{
        width: "100%", maxWidth: 360, padding: "48px 40px",
        background: "rgba(19,22,30,0.95)",
        borderRadius: "16px",
        border: "1px solid rgba(59,130,246,0.15)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 24px 48px rgba(0,0,0,0.4)",
        animation: shake ? "shake 0.4s ease" : "fadeInUp 0.4s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "12px", marginBottom: "16px" }}>
            <img src="/aris-logo.png" alt="BidSmith logo" style={{ width: 30, height: 30, objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: "4px" }}>BidSmith</div>
          <div style={{ fontSize: "12px", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>Federal Bid Intelligence</div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div style={{ marginBottom: "16px" }}>
            <input
              type="password"
              placeholder="Access key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{
                width: "100%", padding: "13px 16px",
                border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "8px",
                background: "rgba(255,255,255,0.03)",
                color: "#f1f5f9",
                fontSize: "14px",
                fontFamily: "'IBM Plex Mono', monospace",
                outline: "none",
                letterSpacing: "0.05em",
                transition: "border-color 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
              onBlur={e => { e.target.style.borderColor = error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%", padding: "13px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              fontFamily: "'Inter', sans-serif",
              transition: "opacity 0.15s, transform 0.15s",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            }}
            onMouseEnter={e => { e.target.style.opacity = "0.92"; e.target.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.target.style.opacity = "1"; e.target.style.transform = "translateY(0)"; }}
          >
            Authenticate
          </button>
        </form>

        {error && (
          <div style={{ marginTop: "16px", color: "#f87171", textAlign: "center", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginTop: "28px", textAlign: "center", fontSize: "11px", color: "#334155", letterSpacing: "0.06em" }}>
          ARIS PROTOCOL · RESTRICTED ACCESS
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-8px); } 40%,80% { transform: translateX(8px); } }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}

