import React, { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  Send, 
  Download, 
  Shield, 
  Cpu,
  Loader2,
  ChevronRight,
  User,
  Bot,
  ArrowLeft,
  Plus
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Styles for the professional SaaS dashboard
const styles = {
  container: { display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc", color: "#1e293b", fontFamily: "Inter, sans-serif" },
  sidebar: { width: "260px", background: "#0f172a", color: "#f8fafc", flexShrink: 0, display: "flex", flexDirection: "column" },
  sidebarHeader: { padding: "24px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  logoIcon: { background: "#3b82f6", padding: "8px", borderRadius: "8px", display: "flex" },
  logoText: { fontWeight: 800, fontSize: "1.25rem", color: "#ffffff", letterSpacing: "-0.02em" },
  nav: { flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "4px" },
  navItem: (active) => ({
    display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", 
    background: active ? "#3b82f6" : "transparent", color: active ? "#ffffff" : "#94a3b8",
    border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, textAlign: "left", transition: "all 0.2s"
  }),
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  header: { height: "64px", background: "#ffffff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" },
  workspace: { flex: 1, overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" },
  chatPanel: { width: "380px", background: "#ffffff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column" },
  card: { background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" },
  cardHeader: { padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" },
  textarea: { width: "100%", height: "500px", padding: "24px", border: "none", outline: "none", fontSize: "15px", lineHeight: "1.6", color: "#334155", background: "transparent", resize: "none" },
  chatHeader: { padding: "16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" },
  chatMessages: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" },
  message: (role) => ({
    display: "flex", gap: "12px", flexDirection: role === "user" ? "row-reverse" : "row",
    maxWidth: "90%", alignSelf: role === "user" ? "flex-end" : "flex-start"
  }),
  bubble: (role) => ({
    padding: "12px 16px", borderRadius: "16px", fontSize: "14px", lineHeight: "1.5",
    background: role === "user" ? "#3b82f6" : "#f1f5f9",
    color: role === "user" ? "#ffffff" : "#1e293b",
    borderTopLeftRadius: role === "model" ? 0 : "16px",
    borderTopRightRadius: role === "user" ? 0 : "16px"
  }),
  chatInputArea: { padding: "16px", borderTop: "1px solid #e2e8f0" },
  chatInput: { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", outline: "none", resize: "none" },
  primaryBtn: { background: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 16px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" },
  secondaryBtn: { background: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 16px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }
};

export default function GovConDashboard({ onBack }) {
  const [view, setView] = useState("workspace");
  const [rfpText, setRfpText] = useState("");
  const [requirements, setRequirements] = useState([]);
  const [proposal, setProposal] = useState("");
  const [messages, setMessages] = useState([
    { role: "model", text: "Welcome to GovCon AI. I'm your specialized assistant for government contracting, powered by BidSmith. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGenerateMatrix = async () => {
    if (!rfpText) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/govcon/generate-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfpText }),
      });
      const matrix = await res.json();
      setRequirements(Array.isArray(matrix) ? matrix : []);
      setView("compliance");
      setMessages(prev => [...prev, { role: "model", text: "I've analyzed the RFP and generated a compliance matrix. Review it in the Compliance tab." }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDraftProposal = async () => {
    if (!rfpText) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/govcon/draft-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfpText }),
      });
      const data = await res.json();
      setProposal(data.draft);
      setView("proposal");
      setMessages(prev => [...prev, { role: "model", text: "I've drafted an Executive Summary based on the RFP. You can refine it in the Proposal tab." }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/govcon/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], context: rfpText }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", text: data.text }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoIcon}><Shield size={20} /></div>
          <span style={styles.logoText}>GovCon AI</span>
        </div>
        
        <nav style={styles.nav}>
          <button onClick={() => setView("workspace")} style={styles.navItem(view === "workspace")}>
            <LayoutDashboard size={18} /> Workspace
          </button>
          <button onClick={() => setView("compliance")} style={styles.navItem(view === "compliance")}>
            <CheckSquare size={18} /> Compliance
          </button>
          <button onClick={() => setView("proposal")} style={styles.navItem(view === "proposal")}>
            <FileText size={18} /> Proposal
          </button>
          
          <div style={{ marginTop: "auto", padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={onBack} style={{ ...styles.navItem(false), color: "#f87171" }}>
              <ArrowLeft size={18} /> Exit Workspace
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "13px" }}>
            <span>Project</span> <ChevronRight size={14} /> <span style={{ fontWeight: 600, color: "#1e293b" }}>Mission-Critical Audit</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>PRO_TIER</div>
            <div style={{ width: "32px", height: "32px", background: "#e2e8f0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px" }}>AR</div>
          </div>
        </header>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Workspace Views */}
          <div style={styles.workspace}>
            {view === "workspace" && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={{ margin: 0, fontWeight: 700 }}>RFP Document Input</h3>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={handleGenerateMatrix} disabled={!rfpText || isGenerating} style={styles.secondaryBtn}>
                      {isGenerating ? <Loader2 size={16} className="rotate" /> : <CheckSquare size={16} />} 
                      Generate Matrix
                    </button>
                    <button onClick={handleDraftProposal} disabled={!rfpText || isGenerating} style={styles.primaryBtn}>
                      {isGenerating ? <Loader2 size={16} className="rotate" /> : <FileText size={16} />} 
                      Draft Proposal
                    </button>
                  </div>
                </div>
                <textarea 
                  value={rfpText}
                  onChange={(e) => setRfpText(e.target.value)}
                  placeholder="Paste RFP Section L, Section M, or SOW text here for deep analysis..."
                  style={styles.textarea}
                />
              </div>
            )}

            {view === "compliance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 800 }}>Compliance Matrix</h2>
                  <button style={styles.primaryBtn}><Plus size={16} /> Add Requirement</button>
                </div>
                <div style={styles.card}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748b", width: "80px" }}>ID</th>
                        <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Requirement</th>
                        <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748b", width: "120px" }}>Source</th>
                        <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748b", width: "150px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>No requirements generated yet. Paste RFP text in the Workspace.</td>
                        </tr>
                      ) : (
                        requirements.map((req, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>{req.id}</td>
                            <td style={{ padding: "16px 24px", fontSize: "14px", color: "#334155" }}>{req.requirement}</td>
                            <td style={{ padding: "16px 24px", fontSize: "13px", fontWeight: 600 }}>{req.source}</td>
                            <td style={{ padding: "16px 24px" }}>
                              <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#f1f5f9", fontSize: "11px", fontWeight: 700 }}>{req.status?.toUpperCase()}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === "proposal" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 800 }}>Proposal Draft</h2>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button style={{ ...styles.secondaryBtn, background: "transparent", color: "#1e293b", border: "1px solid #e2e8f0" }}>Review Changes</button>
                    <button style={styles.primaryBtn}><Download size={16} /> Export .DOCX</button>
                  </div>
                </div>
                <div style={{ ...styles.card, padding: "40px", minHeight: "600px" }}>
                   {proposal ? (
                    <div className="prose">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{proposal}</ReactMarkdown>
                    </div>
                   ) : (
                     <div style={{ color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>No draft generated. Use the assistant specifically for the Executive Summary.</div>
                   )}
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant Sidebar */}
          <aside style={styles.chatPanel}>
            <div style={styles.chatHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
                <Bot size={18} color="#3b82f6" /> AI Assistant
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%" }} />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8" }}>ACTIVE</span>
              </div>
            </div>
            
            <div style={styles.chatMessages}>
              {messages.map((msg, i) => (
                <div key={i} style={styles.message(msg.role)}>
                  <div style={styles.bubble(msg.role)}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div style={styles.message("model")}>
                  <div style={{ ...styles.bubble("model"), padding: "8px 16px" }}>
                    <Loader2 size={16} className="rotate" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={styles.chatInputArea}>
              <div style={{ position: "relative" }}>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder="Ask Mercury 2 about this RFP..."
                  style={styles.chatInput}
                  rows={3}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isGenerating}
                  style={{ position: "absolute", bottom: "12px", right: "12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", padding: "6px", cursor: "pointer" }}
                >
                  <Send size={14} />
                </button>
              </div>
              <p style={{ fontSize: "10px", color: "#94a3b8", textAlign: "center", marginTop: "12px" }}>
                BidSmith Mercury 2 Protocol • Zero-Knowledge Intelligence
              </p>
            </div>
          </aside>
        </div>
      </main>
      
      <style>{`
        .rotate { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .prose h1, .prose h2, .prose h3 { color: #0f172a; margin-top: 24px; margin-bottom: 12px; }
        .prose p { margin-bottom: 16px; color: #334155; }
        .prose ul { margin-bottom: 16px; padding-left: 20px; }
        .prose li { margin-bottom: 4px; }
      `}</style>
    </div>
  );
}
