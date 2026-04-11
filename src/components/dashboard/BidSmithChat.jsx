import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Brain,
  Activity,
  Loader2
} from 'lucide-react';

/** When false, copilot calls /api/chat (same contract as ARIS). Default true preserves offline demo. */
const MVP_STRICT_MODE = (import.meta.env.VITE_MVP_STRICT_MODE ?? "true") !== "false";

function PlanChecklist({ plan }) {
  const steps = plan?.steps;
  const next = plan?.next_action;
  if (!steps?.length && !next) return null;
  return (
    <div style={{
      marginBottom: 12,
      padding: '10px 12px',
      borderRadius: 8,
      background: 'rgba(59, 130, 246, 0.08)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
    }}>
      {steps?.length > 0 && (
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Plan
        </p>
      )}
      {steps?.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#cbd5e1', lineHeight: 1.45 }}>
          {steps.map((s) => (
            <li key={s.id} style={{ marginBottom: 3 }}>
              {s.status === 'done' ? '✓ ' : '○ '}{s.title}
            </li>
          ))}
        </ul>
      )}
      {next ? (
        <p style={{ margin: steps?.length ? '8px 0 0' : 0, fontSize: 12, color: '#60a5fa', fontWeight: 600 }}>
          Next: {next}
        </p>
      ) : null}
    </div>
  );
}

function buildLocalGuidance(query, reportData) {
  const q = (query || "").toLowerCase();
  const verdict = reportData?.verdict?.recommendation || "CONDITIONAL";
  const winProb = reportData?.verdict?.win_probability ?? "n/a";
  const topRisks = Array.isArray(reportData?.intelligence?.top_risks) ? reportData.intelligence.top_risks : [];
  const requirements = Array.isArray(reportData?.requirements) ? reportData.requirements : [];
  const highRiskReqs = requirements.filter((r) => r.risk === "HIGH").slice(0, 3);

  if (q.includes("win") || q.includes("bid") || q.includes("go/no-go")) {
    return [
      `Based on this audit payload, current recommendation is **${verdict}**.`,
      `Estimated win probability: **${winProb}%**.`,
      topRisks.length
        ? `Top blockers to resolve first:\n${topRisks.slice(0, 3).map((r) => `- ${r.risk}`).join("\n")}`
        : "- No explicit risk list found; validate Section L/M must-have requirements.",
    ].join("\n\n");
  }

  if (q.includes("risk") || q.includes("compliance")) {
    return [
      `Compliance-first view for this audit:`,
      highRiskReqs.length
        ? highRiskReqs.map((r) => `- **${r.id}** ${r.requirement} (${r.section})`).join("\n")
        : "- No high-risk requirement rows available in this payload.",
      "Next step: run through these items before proposal drafting.",
    ].join("\n\n");
  }

  if (q.includes("draft") || q.includes("proposal")) {
    const roadmap = Array.isArray(reportData?.proposal_roadmap) ? reportData.proposal_roadmap : [];
    return [
      `Proposal starter from current audit context:`,
      roadmap.length
        ? roadmap.slice(0, 3).map((s) => `- **${s.section}**: ${s.discriminator || "Use strongest discriminator from audit."}`).join("\n")
        : "- Start with Technical, Management, and Past Performance sections tied to high-risk requirements.",
      "Keep traceability from each claim to a captured requirement.",
    ].join("\n\n");
  }

  return [
    `Audit Copilot is running in local MVP mode.`,
    `Current recommendation: **${verdict}** (${winProb}% if available).`,
    topRisks.length
      ? `Priority checks:\n${topRisks.slice(0, 3).map((r) => `- ${r.risk}`).join("\n")}`
      : "- Review disqualifiers and mandatory requirements first.",
  ].join("\n\n");
}

const BidSmithChat = ({ selectedContext, onLog, onCommand, reportData }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `🎯 **AUDIT_COPILOT_READY**\n\nScoped to the active audit payload only.\n\nAsk about:\n• Go / no-go rationale\n• Top compliance risks\n• Requirement-level gaps\n• Proposal starter priorities`,
      isPredictive: true
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const quickPrompts = ['Win probability', 'Top compliance risks', 'Proposal starter'];

  useEffect(() => {
    if (selectedContext) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `CONTEXT_ATTACHED: ${selectedContext.id || selectedContext.requirement}\n\nUnderstood. I've locked onto this requirement. Standing by to generate a "Ghost Draft" or execute a "Gap Audit".`,
        },
      ]);
    }
  }, [selectedContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg = { role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (MVP_STRICT_MODE) {
      const localReply = buildLocalGuidance(userText, reportData);
      setMessages(prev => [...prev, { role: 'assistant', content: localReply }]);
      setLoading(false);
      return;
    }

    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: userText }],
          auditContext: reportData && typeof reportData === 'object' ? reportData : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      const text = data.text || data.response || 'No response received.';
      const plan = data.plan && typeof data.plan === 'object'
        ? { steps: data.plan.steps || [], next_action: data.plan.next_action || '' }
        : null;
      setMessages(prev => [...prev, { role: 'assistant', content: text, plan }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Could not reach the advisor API. Check your connection or try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bidsmith-panel bidsmith-chat-enhanced minimalist-gpt">
      <div className="chat-header mobile-minimal">
        <div className="chat-title">
          <div className="title-left">
            <div className="ai-icon-wrapper">
              <Brain size={18} className="ai-icon" />
              <div className="ai-pulse" />
            </div>
            <span className="title-text">AUDIT COPILOT</span>
          </div>
          <div className="status-indicators hide-mobile">
            <div className="status-item glass">
              <Activity size={10} className="status-active" />
              <span>{MVP_STRICT_MODE ? 'LOCAL' : 'LIVE'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`message-item ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`} style={{ marginBottom: '16px' }}>
            <div className="message-container" style={{ display: 'flex', gap: '12px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role !== 'user' && <Brain size={16} color="#3b82f6" style={{ marginTop: '4px' }} />}
              <div className="message-content" style={{ 
                background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
                maxWidth: '85%',
                fontSize: '14px',
                color: '#e2e8f0',
                lineHeight: 1.5
              }}>
                {msg.role === 'assistant' ? (
                  <>
                    {(msg.plan?.steps?.length > 0 || msg.plan?.next_action) && (
                      <PlanChecklist plan={msg.plan} />
                    )}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="loading-indicator shimmer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: '#94a3b8', fontSize: '13px' }}>
            <Loader2 size={14} className="animate-spin" />
            <span>SYNTHESIZING...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="input-wrapper chat-composer" style={{ position: 'relative' }}>
          <textarea 
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask from current audit context..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '12px 48px 12px 12px',
              color: '#fff',
              fontSize: '14px',
              minHeight: '44px',
              resize: 'none',
              outline: 'none'
            }}
          />
          <button 
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="chat-composer-hints" style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              className="chat-hint-chip"
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 10px',
                borderRadius: '44px',
                color: '#94a3b8',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BidSmithChat;
