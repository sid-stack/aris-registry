import React, { useState } from 'react';
import { Calendar, MessageSquare, FileText, CheckSquare, Copy, Check } from 'lucide-react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };
  return (
    <button onClick={copy} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 11, fontWeight: 600 }}>
      {copied ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function ActionPlan({ auditData }) {
  const [activeWeek, setActiveWeek] = useState(0);

  if (!auditData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', flexDirection: 'column', gap: 12 }}>
        <Calendar size={40} strokeWidth={1.5} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Run an audit to generate your action plan</div>
      </div>
    );
  }

  const { action_plan = [], suggested_questions = [], proposal_roadmap = [], verdict = {} } = auditData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Action plan ───────────────────────────────────────────────────── */}
      {action_plan.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="#2563eb" />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>WEEK-BY-WEEK ACTION PLAN</div>
          </div>
          {/* Week tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', overflowX: 'auto' }}>
            {action_plan.map((w, i) => (
              <button key={i} onClick={() => setActiveWeek(i)} style={{
                padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0,
                fontSize: 12, fontWeight: activeWeek === i ? 800 : 600,
                color: activeWeek === i ? '#2563eb' : '#64748b',
                borderBottom: activeWeek === i ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'all 0.15s'
              }}>
                {w.label || `Week ${w.week}`}
              </button>
            ))}
          </div>
          {/* Tasks */}
          <div style={{ padding: '16px 20px' }}>
            {(action_plan[activeWeek]?.tasks || []).map((task, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, padding: '8px 10px', borderRadius: 6, background: '#f8fafc' }}>
                <CheckSquare size={14} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{task}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pre-written Q&A for SAM.gov ──────────────────────────────────── */}
      {suggested_questions.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} color="#7c3aed" />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>PRE-WRITTEN Q&A SUBMISSIONS</div>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', background: 'rgba(124,58,237,0.08)', padding: '2px 6px', borderRadius: 4 }}>Copy-paste to SAM.gov</span>
          </div>
          <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {suggested_questions.map((q, i) => (
              <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, lineHeight: 1.5, flex: 1 }}>
                    Q{i + 1}: {q.question}
                  </div>
                  <CopyButton text={q.question} />
                </div>
                {q.rationale && (
                  <div style={{ padding: '8px 14px', fontSize: 12, color: '#64748b', borderTop: '1px solid #f1f5f9', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700, color: '#7c3aed' }}>Why ask: </span>{q.rationale}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Proposal roadmap ─────────────────────────────────────────────── */}
      {proposal_roadmap.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="#0891b2" />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>PROPOSAL ROADMAP</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Section', 'Pages', 'Lead With', 'Focus Areas'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proposal_roadmap.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{row.section}</td>
                    <td style={{ padding: '10px 14px', color: '#475569', fontFamily: 'monospace' }}>{row.recommended_pages || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#0891b2', fontWeight: 600 }}>{row.discriminator || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>
                      {(row.focus_areas || []).map((f, j) => (
                        <div key={j} style={{ marginBottom: 2 }}>• {f}</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state if no action plan generated */}
      {action_plan.length === 0 && suggested_questions.length === 0 && proposal_roadmap.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <Calendar size={36} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No action plan generated</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>The solicitation text may be too short for a full plan</div>
        </div>
      )}
    </div>
  );
}
