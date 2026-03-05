import { useState } from "react";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (password === "aris369") {
      onLogin();
      setError("");
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0d0f14", fontFamily: "sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 320, padding: "40px", background: "#13161e", borderRadius: "12px", border: "1px solid #252932" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "24px", color: "#d4d8e2", textAlign: "center", margin: "0 0 24px 0" }}>ARIS</h1>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", marginBottom: "12px", border: "1px solid #252932", borderRadius: "6px", background: "#0d0f14", color: "#d4d8e2", boxSizing: "border-box", fontSize: "14px" }}
          />
          <button
            type="submit"
            style={{ width: "100%", padding: "12px", background: "#4a7cff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500", marginBottom: "12px" }}
          >
            Enter
          </button>
        </form>
        {error && <div style={{ marginTop: "12px", color: "#ff5f5f", textAlign: "center", fontSize: "13px" }}>{error}</div>}
      </div>
    </div>
  );
}
