import React, { useState, useEffect, useRef } from "react";
import ARISChat from "../components/dashboard/ARISChat";
import { Zap, ShieldCheck, Target, BarChart3, TrendingUp, AlertTriangle, FileText, CheckCircle2, ArrowRight, HelpCircle, Laptop, Globe, Search, Copy, Download, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// ── UTILITIES ──

const LOADING_STEPS = [
  "Connecting to SAM.gov...",
  "Reading contract details...",
  "Checking requirements...",
  "Looking for risks...",
  "Finalizing your report...",
];

function useLoadingStep(active) {
  const [step, setStep] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (!active) { setStep(0); return; }
    ref.current = setInterval(() => setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 2500);
    return () => clearInterval(ref.current);
  }, [active]);
  return { stepText: LOADING_STEPS[step], stepIndex: step };
}

function scoreFiles(files) {
  const KEYWORD_SCORES = { solicitation: 10, rfp: 10, pws: 10, sow: 10, combined: 10 };
  return Array.from(files).map(file => {
    const n = file.name.toLowerCase();
    let score = 0; const matched = [];
    for (const [kw, pts] of Object.entries(KEYWORD_SCORES))
      if (n.includes(kw)) { score += pts; matched.push(kw.toUpperCase()); }
    return { file, score, matched };
  }).sort((a, b) => b.score - a.score);
}

// ── COMPONENTS ──

function FeatureTip({ icon, title, text }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
      <div style={{ color: '#2563eb' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{text}</div>
      </div>
    </div>
  );
}

function RecommendCard({ title, url, onClick }) {
  return (
    <div 
      onClick={() => onClick(url)}
      style={{ 
        minWidth: '200px', 
        padding: '16px', 
        background: 'white', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0', 
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#2563eb'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Globe size={14} color="#3b82f6" />
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample Opp</span>
      </div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</div>
    </div>
  );
}

// ── RESULTS COMPONENTS ──

function StatusBadge({ assessment }) {
  if (!assessment) return null;
  const { disqualified, risk_level } = assessment;
  const isDanger = disqualified || risk_level === "HIGH";
  
  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '8px', 
      padding: '8px 16px', 
      borderRadius: '99px', 
      background: isDanger ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${isDanger ? '#fecaca' : '#86efac'}`,
      color: isDanger ? '#991b1b' : '#166534',
      fontWeight: 800,
      fontSize: '14px',
      marginBottom: '20px'
    }}>
      {isDanger ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
      {disqualified ? "NOT ELIGIBLE" : risk_level === "HIGH" ? "HIGH RISK" : "GOOD TO BID"}
    </div>
  );
}

export default function Audit({ onBack }) {
  const [samUrl, setSamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [rankedFiles, setRankedFiles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  
  const { stepText, stepIndex } = useLoadingStep(isLoading);
  const esRef = useRef(null);

  const startAudit = async (url) => {
    const finalUrl = url || samUrl;
    if (!finalUrl.trim()) return;
    setSamUrl(finalUrl);
    setIsLoading(true);
    setError("");
    setResult(null);
    setReport(null);
    
    try {
      const res = await fetch("/api/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We couldn't read that link. Try another one!");
      setResult(data);
      streamReport(data);
    } catch (e) {
      setError(e.message);
      setShowUpload(true);
    } finally {
      setIsLoading(false);
    }
  };

  const streamReport = (auditData) => {
    if (esRef.current) esRef.current.close();
    const json = JSON.stringify({ pillars: auditData.compliance, title: auditData.title || "" });
    const ctx = btoa(unescape(encodeURIComponent(json)));
    const es = new EventSource(`/api/generate-report-stream?ctx=${encodeURIComponent(ctx)}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "agent_done") {
        if (msg.data?.proposal_draft) setReport(prev => ({ ...(prev || {}), proposal_draft: msg.data.proposal_draft }));
        if (msg.data?.compliance_report) setReport(prev => ({ ...(prev || {}), compliance_report: msg.data.compliance_report }));
      } else if (msg.type === "pipeline_complete") {
        es.close();
      }
    };
  };

  return (
    <div className="mobile-container" style={{ minHeight: '100vh', background: '#f8fafc', padding: '16px', paddingBottom: '100px' }}>
      <style>{`
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .mobile-container { max-width: 500px; margin: 0 auto; }
        @media (min-width: 768px) { .mobile-container { max-width: 800px; } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); } 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Aris Audit</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Stateless Federal Intelligence</p>
        </div>
        <button onClick={onBack} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>← Exit</button>
      </div>

      {!result && !isLoading && (
        <div className="fade-in">
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Check if you can win</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>Paste a SAM.gov link below. We'll find the rules and tell you if you're eligible to bid in 60 seconds.</p>
            
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Globe style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <input 
                type="text"
                value={samUrl}
                onChange={e => setSamUrl(e.target.value)}
                placeholder="https://sam.gov/opp/..."
                style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '10px', border: '2px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
              />
            </div>

            <button 
              onClick={() => startAudit()}
              disabled={!samUrl}
              className={samUrl ? "pulse" : ""}
              style={{ width: '100%', padding: '16px', background: samUrl ? '#0f172a' : '#e2e8f0', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              Analyze Opportunity <ArrowRight size={18} />
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', paddingLeft: '4px' }}>Try one of these:</div>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
              <RecommendCard title="Video Archive" url="https://sam.gov/opp/0c17537b925b4be98e3575ed19520b72/view" onClick={startAudit} />
              <RecommendCard title="NASA Pipeline" url="https://sam.gov/opp/NASA-2024-IP/view" onClick={startAudit} />
              <RecommendCard title="Cloud Mod II" url="https://sam.gov/opp/VA-CLOUD-MOD-2024/view" onClick={startAudit} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <FeatureTip icon={<ShieldCheck />} title="Privacy First" text="We don't save your data. Your bid info stays yours." />
            <FeatureTip icon={<Target />} title="Risk Spotter" text="We find hidden traps in contracts that cause losses." />
            <FeatureTip icon={<BarChart3 />} title="Quick Matrix" text="Get a full compliance list in seconds, not hours." />
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }} className="fade-in">
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
            <div className="spin" style={{ position: 'absolute', inset: 0, border: '4px solid #f1f5f9', borderTopColor: '#2563eb', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <ShieldCheck color="#2563eb" size={32} />
            </div>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>{stepText}</h2>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Our AI is reading through the contract documents now.</p>
          
          <div style={{ maxWidth: '240px', margin: '32px auto 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {LOADING_STEPS.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: idx <= stepIndex ? 1 : 0.3, transition: 'all 0.3s' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx < stepIndex ? '#22c55e' : '#2563eb' }} />
                <span style={{ fontSize: '12px', fontWeight: idx === stepIndex ? 700 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', marginBottom: '8px', fontWeight: 800 }}>
            <AlertTriangle size={20} /> Something went wrong
          </div>
          <p style={{ fontSize: '13px', color: '#991b1b', margin: 0, lineHeight: 1.5 }}>{error}</p>
          <button 
            onClick={() => setShowUpload(true)}
            style={{ marginTop: '16px', background: '#b91c1c', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            Upload PDF Instead
          </button>
        </div>
      )}

      {showUpload && !isLoading && !result && (
        <div className="fade-in" style={{ background: 'white', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '40px 20px', textAlign: 'center' }}>
          <FileText size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Manual Document Audit</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Click to choose a solicitation PDF file from your computer.</p>
          <input type="file" id="file-upload" hidden accept=".pdf" onChange={e => {
             const fs = e.target.files; if (!fs.length) return;
             // handle file upload logic here or just trigger audit
          }} />
          <label htmlFor="file-upload" style={{ background: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Select PDF</label>
        </div>
      )}

      {result && (
        <div className="fade-in">
          <StatusBadge assessment={result.compliance?.disqualification_assessment} />
          
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Opportunity Info</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>{result.title}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Deadline</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{result.compliance?.deadline_date?.value || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Set-Aside</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{result.compliance?.set_aside_type?.value || "—"}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <button onClick={() => setIsChatOpen(true)} style={{ background: '#3b82f6', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}><Search size={20} /> Ask questions about this bid</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}><Copy size={16} /> Copy Memo</button>
              <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}><Download size={16} /> PDF Export</button>
            </div>
          </div>

          {report?.proposal_draft && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <FileText size={20} color="#2563eb" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Executive Risk Memo</h3>
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#334155' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.proposal_draft}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Chat Panel */}
      {isChatOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', height: '85vh', background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 50px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#3b82f6" fill="#3b82f6" />
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}>ARIS AI</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ARISChat reportData={result} />
            </div>
          </div>
          <style>{`
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>
        </div>
      )}
      
      {/* Help Button */}
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          style={{ position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', borderRadius: '50%', background: '#0f172a', color: 'white', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900 }}
        >
          <Zap size={24} fill="#3b82f6" color="#3b82f6" />
        </button>
      )}
    </div>
  );
}
