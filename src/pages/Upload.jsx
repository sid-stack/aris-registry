import { useState, useRef } from "react";

export default function Upload({ onProposalGenerated }) {
  const [file, setFile] = useState(null);
  const [companyProfile, setCompanyProfile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  function handleFile(f) {
    if (!f) return;
    if (f.type !== "application/pdf") return setError("Please upload a PDF file.");
    setError(null);
    setFile(f);
  }

  async function handleSubmit() {
    if (!file) return setError("Please upload an RFP PDF.");
    if (!companyProfile.trim()) return setError("Please enter your company profile.");
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("rfp", file);
    formData.append("companyProfile", companyProfile);
    try {
      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      onProposalGenerated(data.proposal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: "60px auto", padding: "0 24px" }}>
      <h1>Generate Proposal Draft</h1>
      <p style={{ color: "#888", margin: "8px 0 32px" }}>Upload a federal RFP and your company profile to generate a structured proposal draft.</p>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>RFP Document (PDF)</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ border: "2px dashed #444", borderRadius: 8, padding: 32, textAlign: "center", cursor: "pointer" }}
        >
          <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          {file ? <span>✓ {file.name}</span> : <span>Click to browse or drag and drop · PDF only</span>}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Company Profile</label>
        <textarea
          rows={6}
          value={companyProfile}
          onChange={(e) => setCompanyProfile(e.target.value)}
          placeholder="Describe your company, certifications, past performance, core capabilities..."
          style={{ width: "100%", padding: 12, borderRadius: 6, border: "1px solid #444", background: "#1a1a1a", color: "#fff", fontSize: 14 }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !file || !companyProfile.trim()}
        style={{ padding: "12px 28px", background: "#4a7cff", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, cursor: "pointer" }}
      >
        {loading ? "Generating..." : "Generate Proposal Draft →"}
      </button>

      {error && <div style={{ marginTop: 16, color: "#ff5f5f" }}>Error: {error}</div>}
    </div>
  );
}
