/**
 * LiveAnalysisCard — Displays RAG confidence scores and source citations.
 * Props:
 *   auditResult  — parsed audit JSON from /api/audit/*
 *   loading      — bool, shows skeleton shimmer while inference is in progress
 */
import { Brain, ExternalLink, TrendingUp } from 'lucide-react';

const CONFIDENCE_TIERS = [
  { max: 40,  label: 'Low',    color: '#ef4444' },
  { max: 70,  label: 'Medium', color: '#f59e0b' },
  { max: 100, label: 'High',   color: '#22c55e' },
];

function tier(score) {
  return CONFIDENCE_TIERS.find(t => score <= t.max) || CONFIDENCE_TIERS[2];
}

// ── Skeleton primitives ───────────────────────────────────────────────────────
function Bone({ w = '100%', h = 12, radius = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg,#1a1a1a 25%,#242424 50%,#1a1a1a 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.6s infinite',
      flexShrink: 0,
      ...style,
    }} />
  );
}

function SkeletonBody() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* confidence bars skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Bone w={90} h={9} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bone w={130} h={10} />
            <Bone h={4} style={{ flex: 1 }} />
            <Bone w={30} h={10} />
          </div>
        ))}
      </div>
      {/* summary block skeleton */}
      <div style={{ background: '#0d0d0d', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <Bone w="95%" />
        <Bone w="80%" />
        <Bone w="65%" />
      </div>
      {/* citation chips skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Bone w={90} h={9} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[120, 90, 140, 80].map((w, i) => (
            <Bone key={i} w={w} h={26} radius={6} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Content components ────────────────────────────────────────────────────────
function ConfidenceBar({ label, score }) {
  const t = tier(score);
  return (
    <div style={s.barRow}>
      <span style={s.barLabel}>{label}</span>
      <div style={s.barTrack}>
        <div style={{ ...s.barFill, width: `${score}%`, background: t.color }} />
      </div>
      <span style={{ ...s.barScore, color: t.color }}>{score}%</span>
    </div>
  );
}

function CitationChip({ index, text, url }) {
  return (
    <a
      href={url || '#'}
      target={url ? '_blank' : '_self'}
      rel="noopener noreferrer"
      style={s.chip}
      title={text}
    >
      <span style={s.chipIndex}>[{index}]</span>
      <span style={s.chipText}>{text}</span>
      {url && <ExternalLink size={10} style={{ flexShrink: 0, opacity: 0.5 }} />}
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LiveAnalysisCard({ auditResult, loading = false, inquiryMode = false, analysisProgress = null }) {
  const verdict  = auditResult?.verdict     || {};
  const intel    = auditResult?.intelligence || {};
  const reqs     = Array.isArray(auditResult?.requirements) ? auditResult.requirements : [];
  const isInsufficient = verdict.recommendation === 'INSUFFICIENT_DATA' || auditResult?.queued;
  const hasData  = !!auditResult && !loading && !isInsufficient;

  const winProb   = typeof verdict.win_probability === 'number' ? verdict.win_probability : null;
  const modelConf = verdict.confidence === 'HIGH' ? 85 : verdict.confidence === 'LOW' ? 30 : 60;
  const compPct   = reqs.length > 0
    ? Math.round((reqs.filter(r => r.status === 'compliant' || r.met).length / reqs.length) * 100)
    : null;

  const citations = [
    auditResult?.solicitation_number && { text: `Solicitation ${auditResult.solicitation_number}` },
    auditResult?.agency && { text: auditResult.agency },
    ...(Array.isArray(intel.top_risks)
      ? intel.top_risks.slice(0, 2).map(r => ({
          text: typeof r === 'string' ? r.slice(0, 48) + (r.length > 48 ? '…' : '') : 'Risk factor',
        }))
      : []),
  ].filter(Boolean).slice(0, 4);

  return (
    <div style={s.card}>
      {/* shimmer keyframes injected once */}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={{ ...s.iconWrap, opacity: loading ? 0.4 : 1 }}>
            <Brain size={14} color="#3b82f6" />
          </div>
          <span style={s.title}>Live Analysis</span>
          {loading && (
            <span style={s.inferringBadge}>
              <span style={s.inferringDot} />
              Inferring…
            </span>
          )}
        </div>
        {hasData && verdict.recommendation && (
          <span style={{
            ...s.badge,
            background: verdict.recommendation === 'BID'
              ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: verdict.recommendation === 'BID' ? '#22c55e' : '#ef4444',
            borderColor: verdict.recommendation === 'BID'
              ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          }}>
            {verdict.recommendation}
          </span>
        )}
      </div>

      {/* ── States ── */}
      {loading ? (
        <>
          {analysisProgress}
          <SkeletonBody />
        </>
      ) : inquiryMode ? (
        <div style={s.empty}>
          <div style={{ ...s.emptyDot, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s ease-in-out infinite' }}>
            <Brain size={16} color="#3b82f6" />
          </div>
          <p style={{ ...s.emptyTitle, color: '#3b82f6' }}>Inquiry Mode</p>
          <p style={s.emptySub}>
            AI is waiting for your input. Once you provide a valid solicitation, analysis will stream here automatically.
          </p>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 240 }}>
            {[
              { label: 'Win Probability',    color: '#4b5563' },
              { label: 'Model Confidence',   color: '#4b5563' },
              { label: 'Compliance Coverage',color: '#4b5563' },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: '#374151', fontWeight: 500, width: 130, flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: 3, borderRadius: 3, background: '#1a1a1a', overflow: 'hidden' }}>
                  <div style={{ width: 0, height: '100%', background: '#2a2a2a' }} />
                </div>
                <span style={{ fontSize: 10, color: '#374151', width: 28, textAlign: 'right' }}>—</span>
              </div>
            ))}
          </div>
        </div>
      ) : isInsufficient ? (
        <div style={s.empty}>
          <div style={{ ...s.emptyDot, background: 'rgba(245,158,11,0.1)' }} />
          <p style={{ ...s.emptyTitle, color: '#f59e0b' }}>
            {auditResult?.queued ? 'Queued for review' : 'Insufficient data'}
          </p>
          <p style={s.emptySub}>
            {auditResult?.queued
              ? 'The audit pipeline hit an error. Your file has been queued for manual review.'
              : 'The document may not be a government solicitation, or LLM providers are unavailable. Check your API keys in .env.'}
          </p>
        </div>
      ) : !hasData ? (
        <div style={s.empty}>
          <div style={s.emptyDot} />
          <p style={s.emptyTitle}>No analysis loaded</p>
          <p style={s.emptySub}>
            Upload an RFP or paste a SAM.gov URL to see confidence scores and citations.
          </p>
        </div>
      ) : (
        <>
          {/* Confidence scores */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Confidence Scores</p>
            <div style={s.bars}>
              {winProb !== null && <ConfidenceBar label="Win Probability"    score={winProb} />}
              <ConfidenceBar label="Model Confidence"   score={modelConf} />
              {compPct !== null && <ConfidenceBar label="Compliance Coverage" score={compPct} />}
            </div>
          </div>

          {auditResult.executiveSummary && (
            <div style={s.summary}>
              <p style={s.summaryText}>
                {auditResult.executiveSummary.slice(0, 220)}
                {auditResult.executiveSummary.length > 220 ? '…' : ''}
              </p>
            </div>
          )}

          {citations.length > 0 && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Source Citations</p>
              <div style={s.chips}>
                {citations.map((c, i) => (
                  <CitationChip key={i} index={i + 1} text={c.text} url={c.url} />
                ))}
              </div>
            </div>
          )}

          {verdict.rationale && (
            <div style={s.rationale}>
              <TrendingUp size={12} color="#6b7280" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={s.rationaleText}>
                {verdict.rationale.slice(0, 180)}
                {verdict.rationale.length > 180 ? '…' : ''}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  card: {
    background: '#111111',
    border: '1px solid #1f1f1f',
    borderRadius: 16,
    padding: '20px 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  iconWrap: {
    width: 26, height: 26, borderRadius: 7,
    background: 'rgba(59,130,246,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.3s',
    WebkitTransition: 'opacity 0.3s',
  },
  title: { fontSize: 13, fontWeight: 600, color: '#f9fafb', letterSpacing: '-0.01em' },
  inferringBadge: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 10, fontWeight: 600,
    color: '#3b82f6',
    background: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.15)',
    borderRadius: 20, padding: '2px 8px',
  },
  inferringDot: {
    width: 5, height: 5, borderRadius: '50%',
    background: '#3b82f6',
    boxShadow: '0 0 6px #3b82f6',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
  badge: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '3px 8px', borderRadius: 20,
    border: '1px solid transparent',
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '24px 0',
  },
  emptyDot: {
    width: 32, height: 32, borderRadius: '50%',
    background: '#1a1a1a', marginBottom: 4,
  },
  emptyTitle: { margin: 0, fontSize: 13, fontWeight: 500, color: '#4b5563' },
  emptySub: {
    margin: 0, fontSize: 11, color: '#374151',
    textAlign: 'center', maxWidth: 240, lineHeight: 1.5,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionLabel: {
    margin: 0, fontSize: 10, fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4b5563',
  },
  bars: { display: 'flex', flexDirection: 'column', gap: 8 },
  barRow: { display: 'flex', alignItems: 'center', gap: 10 },
  barLabel: { fontSize: 11, color: '#9ca3af', width: 140, flexShrink: 0 },
  barTrack: {
    flex: 1, height: 4, background: '#1a1a1a',
    borderRadius: 2, overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: 2,
    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
    WebkitTransition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
  },
  barScore: { fontSize: 11, fontWeight: 600, width: 34, textAlign: 'right', flexShrink: 0 },
  summary: { background: '#0d0d0d', borderRadius: 10, padding: '10px 12px' },
  summaryText: { margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.6 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: '#0d0d0d', border: '1px solid #1f1f1f',
    borderRadius: 6, padding: '4px 8px',
    textDecoration: 'none', transition: 'border-color 0.15s', maxWidth: '100%',
    WebkitTransition: 'border-color 0.15s',
  },
  chipIndex: { fontSize: 10, fontWeight: 700, color: '#3b82f6', flexShrink: 0 },
  chipText: {
    fontSize: 11, color: '#9ca3af',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  rationale: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    borderTop: '1px solid #1a1a1a', paddingTop: 12,
  },
  rationaleText: { margin: 0, fontSize: 11, color: '#4b5563', lineHeight: 1.6 },
};
