import React, { useState, useEffect } from 'react';
import {
  Search,
  Brain,
  Mic,
  Sparkles,
  FileText,
  TrendingUp,
  ExternalLink,
  Lock,
  Zap,
  ArrowLeft,
  Shield
} from 'lucide-react';

// ── Agency icon: colored initials badge ───────────────────────────────────────
const AGENCY_COLORS = {
  'dod': '#1d4ed8', 'darpa': '#7c3aed', 'dhs': '#0369a1', 'nsa': '#1e40af',
  'doe': '#d97706', 'army': '#166534', 'navy': '#1e3a5f', 'air force': '#1d4ed8',
  'hhs': '#0891b2', 'va': '#075985', 'dha': '#047857', 'gsa': '#7c3aed',
  'nasa': '#1e40af', 'doj': '#991b1b', 'dol': '#92400e', 'fema': '#1d4ed8',
};

function AgencyIcon({ agency = '' }) {
  const key = agency.toLowerCase();
  const color = Object.entries(AGENCY_COLORS).find(([k]) => key.includes(k))?.[1] || '#374151';
  const initials = agency.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'US';
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 8, flexShrink: 0,
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {initials}
    </div>
  );
}

// ── Build a safe clickable URL for any result type ────────────────────────────
function resolveUrl(res) {
  if (res.url && res.url.startsWith('http')) return res.url;
  // USAspending award IDs start with CONT_AWD or have a specific pattern
  const id = res.id || '';
  if (id.startsWith('CONT_AWD') || id.startsWith('ASST_') || res.matchType === 'award_fallback') {
    return `https://www.usaspending.gov/award/${encodeURIComponent(id)}/`;
  }
  // SAM.gov notice ID fallback
  if (id && !id.startsWith('gen:') && !id.startsWith('award:')) {
    return `https://sam.gov/opp/${id}/view`;
  }
  // Last resort: SAM.gov search for the title keywords
  const q = encodeURIComponent((res.title || '').split(' ').slice(0, 4).join(' '));
  return `https://sam.gov/content/opportunities?keywords=${q}`;
}

// ── Rich snippet text ─────────────────────────────────────────────────────────
function buildSnippet(res) {
  const parts = [];
  if (res.matchType === 'award_fallback') {
    if (res.recipient) parts.push(`Winner: ${res.recipient}`);
    if (res.amount) parts.push(`$${Number(res.amount).toLocaleString()}`);
    parts.push('Historical award — USAspending.gov');
  } else {
    if (res.description) parts.push(res.description.slice(0, 140));
    else parts.push('Federal solicitation opportunity — SAM.gov verified');
  }
  if (res.postedDate) parts.push(`Posted ${res.postedDate}`);
  return parts.join(' · ');
}

// ── How many free searches are left this session ──────────────────────────────
const FREE_LIMIT = 3;
function getSearchesUsed() {
  try { return parseInt(sessionStorage.getItem('aris_searches') || '0'); } catch { return 0; }
}
function incrementSearches() {
  try { sessionStorage.setItem('aris_searches', String(getSearchesUsed() + 1)); } catch {}
}

// ── Upgrade wall ──────────────────────────────────────────────────────────────
function UpgradeWall({ onDismiss }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
      backdropFilter: 'blur(6px)'
    }}>
      <div style={{
        background: '#1c1f26', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: '40px 36px', maxWidth: 460, width: '90%',
        textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ marginBottom: 20 }}>
          <Lock size={32} color="#8ab4f8" />
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: '1.35rem', color: '#e8eaed' }}>
          Free search limit reached
        </h2>
        <p style={{ margin: '0 0 28px', color: '#9aa0a6', fontSize: '0.95rem', lineHeight: 1.6 }}>
          You've used all {FREE_LIMIT} free searches for this session. Subscribe to run unlimited federal intelligence queries.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <a
            href="https://buy.stripe.com/3cIaEX66197ad9H9na2Fa00"
            style={{
              display: 'block', padding: '14px 20px', borderRadius: 10,
              background: '#4f46e5', color: '#fff', fontWeight: 700,
              fontSize: '1rem', textDecoration: 'none', border: 'none'
            }}
          >
            Subscribe — Standard $99/mo
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, opacity: 0.8, marginTop: 2 }}>
              Unlimited searches · Full FAR/DFARS analysis
            </span>
          </a>
          <a
            href="https://buy.stripe.com/cNibJ19id8369XvfLy2Fa01"
            style={{
              display: 'block', padding: '14px 20px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', color: '#e8eaed', fontWeight: 600,
              fontSize: '0.95rem', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >
            Subscribe — Enterprise $299/mo
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, opacity: 0.7, marginTop: 2 }}>
              Deep-shred · Capture strategy · AI briefings
            </span>
          </a>
        </div>

        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: '#5f6368', cursor: 'pointer', fontSize: '13px' }}
        >
          Continue without subscribing (searches paused)
        </button>
      </div>
    </div>
  );
}

const SovereignSearch = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [briefing, setBriefing] = useState(null);
  const [status, setStatus] = useState('');
  const [correction, setCorrection] = useState(null);
  const [searchesUsed, setSearchesUsed] = useState(getSearchesUsed());
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);

  const COLORS = {
    bg: '#202124',
    secondaryBg: '#303134',
    text: '#bdc1c6',
    textWhite: '#e8eaed',
    textDim: '#9aa0a6',
    border: '#3c4043',
    blue: '#8ab4f8',
    accent: '#a8ff00'
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || params.get('query');
    if (q) {
      setQuery(q);
      executeSearch(q, expanded);
    }
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    if (searchesUsed >= FREE_LIMIT) {
      setShowUpgradeWall(true);
      return;
    }
    const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    await executeSearch(query, expanded);
  };

  const executeSearch = async (targetQuery, isExpanded) => {
    setLoading(true);
    setResults([]);
    setBriefing(null);
    setCorrection(null);
    setStatus('Synthesizing Federal Mesh...');

    incrementSearches();
    const used = getSearchesUsed();
    setSearchesUsed(used);

    try {
      const res = await fetch('/api/fed-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery, expand: isExpanded, limit: 10, region: 'US' })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setBriefing(data.briefing);
        setStatus(data.results?.length === 0 ? "No results found in today's mesh." : '');
      } else {
        setStatus('Analysis interrupted');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setStatus('Error connecting to mesh');
    } finally {
      setLoading(false);
      if (used >= FREE_LIMIT) setShowUpgradeWall(true);
    }
  };

  const remaining = Math.max(0, FREE_LIMIT - searchesUsed);

  return (
    <div style={{
      minHeight: '100vh', background: COLORS.bg, color: COLORS.textWhite,
      display: 'flex', flexDirection: 'column', fontFamily: 'arial, sans-serif'
    }}>
      {/* Minimal top bar — Back + branding only, no audit actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px', borderBottom: '1px solid #3c4043',
        background: COLORS.bg, position: 'sticky', top: 0, zIndex: 10,
      }}>
        {onBack && (
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#9aa0a6',
            cursor: 'pointer', fontSize: '13px', padding: '4px 8px',
            borderRadius: 4,
          }}>
            <ArrowLeft size={15} /> Back
          </button>
        )}
        <Shield size={14} color="#a8ff00" />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#e8eaed', letterSpacing: '0.05em' }}>
          ARIS <span style={{ color: '#a8ff00' }}>SOVEREIGN SEARCH</span>
        </span>
        <div style={{ flex: 1 }} />
        <a href="/app" style={{ fontSize: '12px', color: '#9aa0a6', textDecoration: 'none' }}>
          Run Audit →
        </a>
      </div>

      {showUpgradeWall && <UpgradeWall onDismiss={() => setShowUpgradeWall(false)} />}

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: (results.length > 0 || briefing) ? '40px 20px' : '0 20px',
        justifyContent: (results.length > 0 || briefing) ? 'flex-start' : 'center',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>

        {/* ARIS LOGO */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: '"Times New Roman", serif', fontSize: '5.5rem',
            fontWeight: 400, letterSpacing: '-0.02em', margin: 0, color: COLORS.textWhite
          }}>
            ARIS
          </h1>
        </div>

        {/* SEARCH BOX */}
        <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '584px', position: 'relative', marginBottom: '20px' }}>
          <div style={{
            position: 'relative', background: COLORS.secondaryBg, borderRadius: '24px',
            padding: '0 14px', display: 'flex', alignItems: 'center', height: '46px',
            border: '1px solid transparent',
          }} className="search-bar-inner">
            <Search size={20} color={COLORS.textDim} style={{ minWidth: '20px' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SAM.gov / US Discovery Mesh..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', padding: '0 12px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: COLORS.blue }}>
              <Mic size={20} style={{ cursor: 'pointer' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '28px' }}>
            <button type="submit" className="g-btn">ARIS Search</button>
            <button type="button" onClick={() => setExpanded(!expanded)} className="g-btn">
              {expanded ? 'AI Mode' : 'Standard'}
            </button>
          </div>

          {/* Search credit indicator */}
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            {remaining > 0 ? (
              <span style={{ fontSize: '11px', color: COLORS.textDim }}>
                {remaining} free search{remaining !== 1 ? 'es' : ''} remaining ·{' '}
                <a href="https://buy.stripe.com/3cIaEX66197ad9H9na2Fa00" style={{ color: COLORS.blue, textDecoration: 'none' }}>
                  Upgrade for unlimited
                </a>
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#f87171' }}>
                Free limit reached ·{' '}
                <a href="https://buy.stripe.com/3cIaEX66197ad9H9na2Fa00" style={{ color: COLORS.blue, textDecoration: 'none' }}>
                  Subscribe $99/mo
                </a>
              </span>
            )}
          </div>
        </form>

        {/* LOADING */}
        {loading && (
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <div className="dot-pulse" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '12px', color: COLORS.blue, opacity: 0.8 }}>{status}</p>
          </div>
        )}

        {/* EXECUTIVE BRIEFING */}
        {briefing && !loading && (
          <div style={{
            width: '100%', maxWidth: '652px',
            background: 'rgba(138, 180, 248, 0.05)',
            border: '1px solid rgba(138, 180, 248, 0.1)',
            borderRadius: '12px', padding: '24px', marginTop: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: COLORS.blue }}>
              <Sparkles size={18} />
              <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Executive Briefing</span>
            </div>
            <div style={{ fontSize: '15px', color: COLORS.textWhite, lineHeight: '1.7' }}>
              {briefing.split('\n').map((line, i) => (
                <p key={i} style={{ marginBottom: line.startsWith('-') ? '8px' : '12px' }}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS FEED */}
        {results.length > 0 && !loading && (
          <div style={{ width: '100%', maxWidth: '652px', marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {results.map((res) => {
              const href = resolveUrl(res);
              const snippet = buildSnippet(res);
              const isAward = res.matchType === 'award_fallback';

              return (
                <div key={res.id} className="g-result">
                  {/* Top line: icon + domain breadcrumb */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <AgencyIcon agency={res.agency} />
                    <div>
                      <div style={{ fontSize: '12px', color: COLORS.textDim }}>
                        {isAward ? 'usaspending.gov' : 'sam.gov'} · {res.agency}
                      </div>
                      <div style={{ fontSize: '11px', color: '#5f6368', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {href}
                      </div>
                    </div>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: 'auto', color: COLORS.textDim }}
                      aria-label="Open source"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  {/* Title — clickable, opens correct URL */}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '20px', color: COLORS.blue, fontWeight: 400, textDecoration: 'none', display: 'block', marginBottom: '6px', lineHeight: 1.3 }}
                    className="g-title"
                  >
                    {res.title}
                  </a>

                  {/* Snippet */}
                  <div style={{ fontSize: '14px', color: COLORS.text, lineHeight: '1.58', marginBottom: '12px' }}>
                    {snippet}
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: COLORS.textDim }}>
                      {isAward ? 'PAST AWARD' : 'ACTIVE OPP'}
                    </span>
                    {res.region && (
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: COLORS.textDim }}>
                        {res.region}
                      </span>
                    )}
                    {res.postedDate && (
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: COLORS.textDim }}>
                        {res.postedDate}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => window.location.assign(`/app/audit?url=${encodeURIComponent(href)}`)}
                      className="action-pill"
                    >
                      <FileText size={14} />
                      Conduct Audit
                    </button>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-pill secondary"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <TrendingUp size={14} />
                      View Source
                    </a>
                  </div>
                </div>
              );
            })}

            {/* Bottom upgrade nudge */}
            <div style={{
              marginTop: '8px', padding: '20px', borderRadius: 12,
              background: 'rgba(138,180,248,0.04)', border: '1px solid rgba(138,180,248,0.1)',
              display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <Zap size={20} color={COLORS.blue} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', color: COLORS.textWhite, fontWeight: 600 }}>Unlock unlimited searches + AI briefings</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: COLORS.textDim }}>Standard $99/mo · Enterprise $299/mo</p>
              </div>
              <a
                href="https://buy.stripe.com/3cIaEX66197ad9H9na2Fa00"
                style={{ background: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: '13px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Subscribe
              </a>
            </div>
          </div>
        )}

        {status && !loading && results.length === 0 && (
          <p style={{ marginTop: '40px', fontSize: '14px', color: COLORS.textDim, opacity: 0.8 }}>
            {status}
          </p>
        )}
      </main>

      <footer style={{ background: '#171717', padding: '14px 20px', fontSize: '13px', color: COLORS.textDim, borderTop: '1px solid #3c4043', display: 'flex', gap: '24px' }}>
        <span>ARIS Search</span>
        <span>Federal Discovery</span>
        <div style={{ flex: 1 }} />
        <a href="/privacy" style={{ color: COLORS.textDim, textDecoration: 'none' }}>Privacy</a>
        <a href="/terms" style={{ color: COLORS.textDim, textDecoration: 'none' }}>Terms</a>
      </footer>

      <style>{`
        .g-btn {
          background-color: #303134; border: 1px solid #303134; color: #e8eaed;
          padding: 8px 16px; border-radius: 4px; font-size: 14px; cursor: pointer; min-width: 140px;
        }
        .g-btn:hover { border-color: #5f6368; background-color: #3c4043; }
        .search-bar-inner:hover, .search-bar-inner:focus-within { background-color: #3c4043; box-shadow: 0 1px 6px rgba(0,0,0,0.28); }
        .g-result { padding-bottom: 24px; border-bottom: 1px solid #3c4043; }
        .g-result:last-child { border-bottom: none; }
        .g-title:hover { text-decoration: underline !important; }
        .action-pill {
          display: flex; align-items: center; gap: 6px;
          background: rgba(138, 180, 248, 0.1); color: #8ab4f8;
          border: 1px solid rgba(138, 180, 248, 0.2); padding: 6px 14px;
          border-radius: 100px; font-size: 12px; cursor: pointer;
        }
        .action-pill:hover { background: rgba(138, 180, 248, 0.2); }
        .action-pill.secondary { color: #9aa0a6; border-color: transparent; background: transparent; }
        .action-pill.secondary:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .dot-pulse {
          width: 8px; height: 8px; background: #8ab4f8; border-radius: 50%;
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse { from { opacity: 0.4; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default SovereignSearch;
