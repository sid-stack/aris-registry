/**
 * ProposalForge.jsx — BidSmith v2
 *
 * The "Cursor for RFPs" — a TipTap-powered proposal editor that:
 * 1. Loads auditPipeline output as permanent context
 * 2. Surfaces the Compliance Gutter (unaddressed requirements in margin)
 * 3. Provides Cmd+K style commands via BubbleMenu
 * 4. Tracks which requirements are addressed as you write
 *
 * Data flow:
 *   auditData (runAudit() output) → ProposalForge → TipTap editor
 *   TipTap content → requirementCoverage map → ComplianceGutter
 */

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/extension-bubble-menu';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { devError } from '../../utils/devLog';
import {
  FileText, Zap, CheckCircle, Circle, ChevronDown,
  AlignLeft, Bold, Italic, List, Link, Download,
  RefreshCw, AlertTriangle, Book
} from 'lucide-react';

// ─── Requirement coverage analysis ────────────────────────────────────────────
// Checks how much of the document content addresses each requirement.
// Simple heuristic: look for keyword overlap between req text and doc content.

function analyzeRequirementCoverage(docText, requirements) {
  if (!docText || !requirements) return {};
  const lower = docText.toLowerCase();

  return requirements.reduce((acc, req) => {
    const reqWords = (req.requirement || '')
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 4); // only meaningful words

    const matchedWords = reqWords.filter(w => lower.includes(w));
    const coverage = reqWords.length > 0 ? matchedWords.length / reqWords.length : 0;

    acc[req.id] = {
      covered: coverage >= 0.4, // 40% keyword overlap = addressed
      score: Math.round(coverage * 100),
    };
    return acc;
  }, {});
}

// ─── Compliance Gutter ────────────────────────────────────────────────────────

function ComplianceGutter({ requirements, coverage, onRequirementClick }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unaddressed' | 'addressed'

  const reqs = useMemo(() => {
    if (!requirements) return [];
    return requirements.filter(r => {
      const isCovered = coverage?.[r.id]?.covered;
      if (filter === 'unaddressed') return !isCovered;
      if (filter === 'addressed') return isCovered;
      return true;
    });
  }, [requirements, coverage, filter]);

  const totalCount = requirements?.length || 0;
  const addressedCount = Object.values(coverage || {}).filter(c => c.covered).length;
  const pct = totalCount > 0 ? Math.round((addressedCount / totalCount) * 100) : 0;

  const riskColor = { HIGH: '#dc2626', MED: '#d97706', LOW: '#16a34a' };

  return (
    <div style={{
      width: '280px',
      flexShrink: 0,
      background: '#fff',
      borderLeft: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <AlertTriangle size={14} color="#d97706" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#374151', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Compliance Gutter
          </span>
        </div>

        {/* Coverage bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Coverage</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }}>
              {addressedCount}/{totalCount} ({pct}%)
            </span>
          </div>
          <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
          {['all', 'unaddressed', 'addressed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1,
              padding: '4px',
              background: filter === f ? '#002244' : 'transparent',
              color: filter === f ? 'white' : '#64748b',
              border: '1px solid ' + (filter === f ? '#002244' : '#e2e8f0'),
              borderRadius: '5px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}>
              {f === 'all' ? `All (${totalCount})` : f === 'unaddressed' ? `⚠ ${totalCount - addressedCount}` : `✓ ${addressedCount}`}
            </button>
          ))}
        </div>
      </div>

      {/* Requirement list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {reqs.map(req => {
          const isCovered = coverage?.[req.id]?.covered;
          const rc = riskColor[req.risk] || riskColor.MED;

          return (
            <div
              key={req.id}
              onClick={() => onRequirementClick?.(req)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                cursor: 'pointer',
                border: `1px solid ${isCovered ? '#bbf7d0' : req.is_disqualifier ? '#fca5a5' : '#e2e8f0'}`,
                background: isCovered ? '#f0fdf4' : req.is_disqualifier ? '#fff5f5' : '#fff',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                {isCovered
                  ? <CheckCircle size={13} color="#16a34a" />
                  : <Circle size={13} color={req.is_disqualifier ? '#dc2626' : '#94a3b8'} />
                }
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b' }}>{req.id}</span>
                <span style={{
                  fontSize: '9px', fontWeight: 700, marginLeft: 'auto',
                  color: rc, background: `${rc}15`,
                  padding: '2px 6px', borderRadius: '4px'
                }}>
                  {req.risk}
                </span>
                {req.is_disqualifier && (
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                    DQ
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '11px', color: '#374151',
                lineHeight: 1.4, margin: '0 0 4px 0',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {req.requirement}
              </p>
              {!isCovered && req.action_required && (
                <p style={{ fontSize: '10px', color: '#64748b', margin: 0, lineHeight: 1.3, fontStyle: 'italic' }}>
                  → {req.action_required}
                </p>
              )}
            </div>
          );
        })}

        {reqs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>
            {filter === 'addressed' ? 'No requirements addressed yet' : 'All requirements addressed ✓'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Selector ──────────────────────────────────────────────────────────

function SectionSelector({ roadmap, activeSection, onChange }) {
  if (!roadmap || roadmap.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
      {roadmap.map((section, i) => (
        <button
          key={i}
          onClick={() => onChange(section.section)}
          style={{
            padding: '5px 12px',
            background: activeSection === section.section ? '#002244' : 'white',
            color: activeSection === section.section ? 'white' : '#475569',
            border: '1px solid ' + (activeSection === section.section ? '#002244' : '#e2e8f0'),
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap'
          }}
        >
          {section.section}
        </button>
      ))}
    </div>
  );
}

// ─── Bubble Menu Commands ──────────────────────────────────────────────────────

function ForgeCommand({ editor, auditData }) {
  const [loading, setLoading] = useState(false);

  const commands = [
    { label: 'Align to M Factor', icon: '🎯', action: 'align' },
    { label: 'Add compliance cite', icon: '📋', action: 'cite' },
    { label: 'Compress to 75 words', icon: '✂️', action: 'compress' },
    { label: 'Strengthen with past perf', icon: '⭐', action: 'strengthen' },
  ];

  const handleCommand = async (action) => {
    if (!editor) return;
    const selection = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );
    if (!selection) return;

    setLoading(true);
    try {
      const res = await fetch('/api/govcon/forge-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          selectedText: selection,
          context: {
            requirements: auditData?.requirements?.slice(0, 10),
            evaluation_type: auditData?.intelligence?.evaluation_type,
            key_discriminators: auditData?.intelligence?.key_discriminators,
          }
        })
      });
      const data = await res.json();
      if (data.result) {
        editor.chain().focus().insertContent(data.result).run();
      }
    } catch (err) {
      devError('[FORGE] Command failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#0f172a', borderRadius: '10px', padding: '6px',
      display: 'flex', gap: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Standard formatting */}
      {[
        { icon: Bold, action: () => editor.chain().focus().toggleBold().run() },
        { icon: Italic, action: () => editor.chain().focus().toggleItalic().run() },
        { icon: List, action: () => editor.chain().focus().toggleBulletList().run() },
      ].map(({ icon: Icon, action }, i) => (
        <button key={i} onMouseDown={e => { e.preventDefault(); action(); }} style={{
          background: 'rgba(255,255,255,0.08)', border: 'none',
          borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: 'white'
        }}>
          <Icon size={13} />
        </button>
      ))}

      <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

      {/* AI commands */}
      {commands.map((cmd, i) => (
        <button
          key={i}
          disabled={loading}
          onMouseDown={e => { e.preventDefault(); handleCommand(cmd.action); }}
          style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: '6px', padding: '6px 10px', cursor: loading ? 'not-allowed' : 'pointer',
            color: 'white', fontSize: '11px', fontWeight: 600, display: 'flex',
            alignItems: 'center', gap: '5px', opacity: loading ? 0.5 : 1,
            whiteSpace: 'nowrap'
          }}
        >
          <span>{cmd.icon}</span>
          {cmd.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main ProposalForge ────────────────────────────────────────────────────────

export default function ProposalForge({ auditData, onBack }) {
  const [activeSection, setActiveSection] = useState(
    auditData?.proposal_roadmap?.[0]?.section || 'Technical Approach'
  );
  const [coverage, setCoverage] = useState({});

  const requirements = auditData?.requirements || [];
  const roadmap = auditData?.proposal_roadmap || [];
  const activeSectionData = roadmap.find(r => r.section === activeSection);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Section heading…';
          return activeSectionData?.focus_areas?.[0]
            ? `Start writing about ${activeSectionData.focus_areas[0].toLowerCase()}…`
            : 'Begin your proposal section…';
        },
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      CharacterCount,
    ],
    content: `<h2>${activeSection}</h2><p></p>`,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      // Reanalyze coverage every update (debounced in prod)
      setCoverage(analyzeRequirementCoverage(text, requirements));
    },
  });

  // Update placeholder when section changes
  useEffect(() => {
    if (editor && activeSection) {
      editor.commands.setContent(`<h2>${activeSection}</h2><p></p>`);
    }
  }, [activeSection]);

  const wordCount = editor?.storage.characterCount.words() || 0;
  const recPages = activeSectionData?.recommended_pages || '—';
  const handleExport = useCallback(() => {
    if (!auditData) return;
    const now = new Date().toISOString();
    const recommendation = auditData.verdict?.recommendation || "CONDITIONAL";
    const winProbability = auditData.verdict?.win_probability ?? 0;
    const requirements = Array.isArray(auditData.requirements) ? auditData.requirements : [];
    const summary = [
      "# BidSmith Proposal Starter Export",
      `Generated: ${now}`,
      "",
      "## Opportunity Summary",
      `- Title: ${auditData.title || "Federal Solicitation"}`,
      `- Agency: ${auditData.agency || "Federal Agency"}`,
      `- Solicitation Number: ${auditData.solicitation_number || "N/A"}`,
      `- Due Date: ${auditData.due_date || "N/A"}`,
      `- Contract Type: ${auditData.contract_type || "N/A"}`,
      `- Set-Aside: ${auditData.set_aside_type || "N/A"}`,
      "",
      "## Bid / No-Bid",
      `- Recommendation: ${recommendation}`,
      `- Win Probability: ${winProbability}%`,
      `- Rationale: ${auditData.verdict?.rationale || "No rationale provided."}`,
      "",
      "## Compliance Matrix",
      ...requirements.map((req) => `- [${req.id || "REQ"}] ${req.requirement || "Requirement"} (${req.risk || "MED"})`),
      "",
      "## Draft Starter",
      editor?.getText() || "",
      "",
    ].join("\n");

    const blob = new Blob([summary], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    const slug = (auditData.solicitation_number || auditData.title || "bidsmith-audit")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    link.href = URL.createObjectURL(blob);
    link.download = `${slug || "bidsmith-audit"}-starter.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }, [auditData, editor]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>

      {/* Forge top bar */}
      <div style={{
        padding: '12px 20px', background: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} color="#7c3aed" />
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
            Proposal Forge
          </span>
          <span style={{
            fontSize: '11px', color: '#7c3aed', fontWeight: 700,
            background: '#f3e8ff', padding: '2px 8px', borderRadius: '20px'
          }}>
            BETA
          </span>
        </div>

        {/* Context summary from audit */}
        {auditData && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: '#475569',
              background: '#f1f5f9', padding: '3px 10px', borderRadius: '20px',
              border: '1px solid #e2e8f0'
            }}>
              {auditData.agency || 'Federal Agency'}
            </span>
            {auditData.verdict?.recommendation && (
              <span style={{
                fontSize: '11px', fontWeight: 700,
                color: auditData.verdict.recommendation === 'BID' ? '#16a34a' : auditData.verdict.recommendation === 'NO-BID' ? '#dc2626' : '#d97706',
                background: auditData.verdict.recommendation === 'BID' ? '#f0fdf4' : auditData.verdict.recommendation === 'NO-BID' ? '#fff5f5' : '#fffbeb',
                padding: '3px 10px', borderRadius: '20px',
                border: '1px solid currentColor'
              }}>
                {auditData.verdict.recommendation}
              </span>
            )}
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {wordCount} words · Rec: {recPages} pages
          </span>
          <button
            onClick={handleExport}
            disabled={!auditData}
            style={{
            padding: '7px 14px', background: '#002244', color: 'white',
            border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700,
            cursor: auditData ? 'pointer' : 'not-allowed',
            opacity: auditData ? 1 : 0.6,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <SectionSelector roadmap={roadmap} activeSection={activeSection} onChange={setActiveSection} />

      {/* Active section context strip */}
      {activeSectionData && (
        <div style={{
          padding: '10px 20px', background: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'
        }}>
          <Book size={13} color="#2563eb" />
          <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600 }}>
            Focus:
          </span>
          {(activeSectionData.focus_areas || []).map((fa, i) => (
            <span key={i} style={{
              fontSize: '11px', color: '#1e40af',
              background: '#dbeafe', padding: '3px 10px', borderRadius: '20px',
              border: '1px solid #bfdbfe'
            }}>
              {fa}
            </span>
          ))}
          {activeSectionData.discriminator && (
            <span style={{
              fontSize: '11px', color: '#7c3aed', fontWeight: 700,
              background: '#f3e8ff', padding: '3px 10px', borderRadius: '20px',
              border: '1px solid #e9d5ff', marginLeft: 'auto'
            }}>
              Lead with: {activeSectionData.discriminator}
            </span>
          )}
        </div>
      )}

      {/* Editor + Gutter */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* TipTap Editor */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', position: 'relative' }}>
          {editor && (
            <BubbleMenu editor={editor} tippyOptions={{ duration: 100, placement: 'top' }}>
              <ForgeCommand editor={editor} auditData={auditData} />
            </BubbleMenu>
          )}

          <EditorContent
            editor={editor}
            style={{ maxWidth: '720px', margin: '0 auto' }}
          />

          {/* No audit data warning */}
          {!auditData && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(248,250,252,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px', textAlign: 'center'
            }}>
              <FileText size={40} color="#94a3b8" />
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#64748b', margin: 0 }}>
                No audit loaded
              </p>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                Run an audit first to unlock proposal context, requirement tracking, and AI commands.
              </p>
            </div>
          )}
        </div>

        {/* Compliance Gutter */}
        <ComplianceGutter
          requirements={requirements}
          coverage={coverage}
          onRequirementClick={() => {
            // Future: scroll to or highlight the relevant section
          }}
        />
      </div>

      {/* TipTap editor styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap {
          outline: none;
          min-height: 500px;
          font-family: 'Georgia', serif;
          font-size: 15px;
          line-height: 1.8;
          color: #1e293b;
        }
        .tiptap h1 { font-size: 24px; font-weight: 800; margin: 0 0 16px; color: #0f172a; font-family: Inter, sans-serif; }
        .tiptap h2 { font-size: 20px; font-weight: 700; margin: 24px 0 12px; color: #0f172a; font-family: Inter, sans-serif; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .tiptap h3 { font-size: 16px; font-weight: 700; margin: 20px 0 8px; color: #0f172a; font-family: Inter, sans-serif; }
        .tiptap p { margin: 0 0 14px; }
        .tiptap ul, .tiptap ol { padding-left: 24px; margin: 0 0 14px; }
        .tiptap li { margin-bottom: 6px; }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .tiptap mark { background: #fef9c3; border-radius: 3px; padding: 1px 2px; }
      `}} />
    </div>
  );
}
