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
  Shield,
  ChevronRight
} from 'lucide-react';

// ── Agency icon: colored initials badge (Lightified) ──────────────────────────────
const AGENCY_COLORS = {
  'dod': '#002244', 'darpa': '#4338ca', 'dhs': '#0369a1', 'nsa': '#1e40af',
  'doe': '#b45309', 'army': '#166534', 'navy': '#002244', 'air force': '#1d4ed8',
  'hhs': '#0891b2', 'va': '#075985', 'dha': '#047857', 'gsa': '#4338ca',
  'nasa': '#1e3a8a', 'doj': '#b91c1c', 'dol': '#92400e', 'fema': '#1d4ed8',
};

function AgencyIcon({ agency = '' }) {
  const key = agency.toLowerCase();
  const color = Object.entries(AGENCY_COLORS).find(([k]) => key.includes(k))?.[1] || '#475569';
  const initials = agency.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'US';
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '8px', flexShrink: 0,
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      {initials}
    </div>
  );
}

function resolveUrl(res) {
  if (res.url && res.url.startsWith('http')) return res.url;
  const id = res.id || '';
  if (id.startsWith('CONT_AWD') || id.startsWith('ASST_') || res.matchType === 'award_fallback') {
    return `https://www.usaspending.gov/award/${encodeURIComponent(id)}/`;
  }
  if (id && !id.startsWith('gen:') && !id.startsWith('award:')) {
    return `https://sam.gov/opp/${id}/view`;
  }
  const q = encodeURIComponent((res.title || '').split(' ').slice(0, 4).join(' '));
  return `https://sam.gov/content/opportunities?keywords=${q}`;
}

function buildSnippet(res) {
  const parts = [];
  if (res.matchType === 'award_fallback') {
    if (res.recipient) parts.push(`Winner: ${res.recipient}`);
    if (res.amount) parts.push(`$${Number(res.amount).toLocaleString()}`);
    parts.push('Historical award — USAspending.gov');
  } else {
    if (res.description) parts.push(res.description.slice(0, 160));
    else parts.push('Federal solicitation opportunity — SAM.gov verified institutional record.');
  }
  if (res.postedDate) parts.push(`Posted ${res.postedDate}`);
  return parts.join(' · ');
}

const FREE_LIMIT = 5; // Government tier session limit
function getSearchesUsed() {
  try { return parseInt(sessionStorage.getItem('aris_searches') || '0'); } catch { return 0; }
}
function incrementSearches() {
  try { sessionStorage.setItem('aris_searches', String(getSearchesUsed() + 1)); } catch {}
}

const BidSmithSearch = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [briefing, setBriefing] = useState(null);
  const [status, setStatus] = useState('');
  const [searchesUsed, setSearchesUsed] = useState(getSearchesUsed());
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);

  const COLORS = {
    bg: '#f8fafc',
    paper: '#ffffff',
    text: '#1e293b',
    textDim: '#64748b',
    border: '#e2e8f0',
    accent: '#002244',
    blue: '#2563eb'
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
    if (!query.trim()) return;
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
    setStatus('Analyzing Federal Network Data...');
    
    incrementSearches();
    setSearchesUsed(getSearchesUsed());

    try {
      const res = await fetch('/api/fed-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery, expand: isExpanded, limit: 12, region: 'US' })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setBriefing(data.briefing);
        setStatus(data.results?.length === 0 ? "No records matched your institutional query." : '');
      } else {
        setStatus('Mesh search failed. Check authentication.');
      }
    } catch (err) {
      setStatus('Error connecting to ARIS Intelligence Network');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: COLORS.bg, color: COLORS.text,
      display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif"
    }}>
      {/* Institutional Top Bar */}
      <header style={{
        display: 'flex', alignItems: 'center', height: '64px',
        padding: '0 24px', borderBottom: '2px solid #e2e8f0',
        background: '#ffffff', position: 'sticky', top: 0, zIndex: 100,
        justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600
          }}>
            <ArrowLeft size={16} /> Back to Hub
          </button>
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="#002244" />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#002244', letterSpacing: '-0.01em' }}>
              ARIS <span style={{ color: '#64748b', fontWeight: 500 }}>| SOVEREIGN SEARCH</span>
            </span>
          </div>
        </div>
        
        <img src="/aris-logo.png" alt="ARIS Labs Logo" style={{ height: '24px' }} />
      </header>

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: (results.length > 0 || briefing) ? '60px 24px' : '0 24px',
        justifyContent: (results.length > 0 || briefing) ? 'flex-start' : 'center',
        transition: 'all 0.4s ease-in-out'
      }}>

        {/* BRADING */}
        {!(results.length > 0 || briefing) && (
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
             <h1 style={{
               fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em',
               margin: 0, color: '#002244'
             }}>
               ARIS <span style={{ fontWeight: 400, color: '#64748b' }}>Search</span>
             </h1>
             <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '12px' }}>
               Search active federal solicitations and historical award records.
             </p>
          </div>
        )}

        {/* SEARCH FORM */}
        <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '720px', position: 'relative' }}>
          <div style={{
            position: 'relative', background: '#ffffff', borderRadius: '16px',
            padding: '4px 8px 4px 16px', display: 'flex', alignItems: 'center', height: '64px',
            border: '2px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            transition: 'border-color 0.2s ease'
          }} className="search-bar-container">
            <Search size={24} color="#64748b" style={{ minWidth: '24px' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SAM.gov by Agency, Solicitation ID, or Keywords..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#0f172a', fontSize: '18px', padding: '0 16px', outline: 'none', fontWeight: 500 }}
            />
            <button type="submit" style={{
              background: '#002244', color: 'white', padding: '12px 24px',
              borderRadius: '10px', border: 'none', fontWeight: 700,
              fontSize: '14px', cursor: 'pointer'
            }}>
              Search Records
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
               <Zap size={14} color={expanded ? '#2563eb' : '#94a3b8'} />
               <span>AI Analysis Mode</span>
               <input 
                 type="checkbox" 
                 checked={expanded} 
                 onChange={() => setExpanded(!expanded)} 
                 style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
               />
             </div>
          </div>
        </form>

        {/* LOADING STATE */}
        {loading && (
          <div style={{ marginTop: '60px', textAlign: 'center' }}>
             <div className="loader-bars" />
             <p style={{ fontSize: '14px', color: '#64748b', marginTop: '20px', fontWeight: 600 }}>{status}</p>
          </div>
        )}

        {/* BRIEFING VIEW */}
        {briefing && !loading && (
          <div style={{
            width: '100%', maxWidth: '720px',
            background: '#ffffff', border: '2px solid #e2e8f0',
            borderRadius: '16px', padding: '32px', marginTop: '40px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', color: '#002244' }}>
              <Sparkles size={20} />
              <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>ARIS Intelligence Briefing</span>
            </div>
            <div style={{ fontSize: '16px', color: '#334155', lineHeight: '1.8' }}>
              {briefing.split('\n').map((line, i) => (
                <p key={i} style={{ marginBottom: line.startsWith('-') ? '10px' : '16px' }}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {results.length > 0 && !loading && (
          <div style={{ width: '100%', maxWidth: '720px', marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {results.map((res) => {
              const href = resolveUrl(res);
              const snippet = buildSnippet(res);
              const isAward = res.matchType === 'award_fallback';

              return (
                <div key={res.id} style={{
                  padding: '24px', background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: '12px', transition: 'box-shadow 0.2s ease'
                }} className="result-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                    <AgencyIcon agency={res.agency} />
                    <div style={{ flex: 1 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                         <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                           {isAward ? 'USAspending Record' : 'SAM.gov Opportunity'}
                         </span>
                         <span style={{ color: '#e2e8f0' }}>|</span>
                         <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>{res.agency}</span>
                       </div>
                       <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '20px', color: '#2563eb', fontWeight: 700, textDecoration: 'none', lineHeight: 1.3 }}
                      >
                        {res.title}
                      </a>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginBottom: '20px' }}>
                    {snippet}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                     <button
                        onClick={() => window.location.assign(`/app/audit?url=${encodeURIComponent(href)}`)}
                        style={{
                          background: '#002244', color: 'white', padding: '8px 16px',
                          borderRadius: '6px', border: 'none', fontWeight: 700,
                          fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                      >
                        <FileText size={14} /> Audit Solicitation
                     </button>
                     <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <TrendingUp size={14} /> View Federal Source <ExternalLink size={12} />
                      </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer style={{ background: '#ffffff', borderTop: '2px solid #e2e8f0', padding: '24px', textAlign: 'center' }}>
         <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
           ARIS Sovereign Search Network © 2026. Institutional Record Access.
         </p>
      </footer>

      <style>{`
        .search-bar-container:focus-within {
          border-color: #002244 !important;
        }
        .result-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border-color: #cbd5e1 !important;
        }
        .loader-bars {
          width: 40px;
          height: 20px;
          background: linear-gradient(#002244 0 0) 0% 50%, linear-gradient(#002244 0 0) 50% 50%, linear-gradient(#002244 0 0) 100% 50%;
          background-size: 8px 100%;
          background-repeat: no-repeat;
          animation: load 1s infinite linear;
          margin: 0 auto;
        }
        @keyframes load {
          20% { background-size: 8px 60%, 8px 100%, 8px 100%; }
          40% { background-size: 8px 80%, 8px 60%, 8px 100%; }
          60% { background-size: 8px 100%, 8px 80%, 8px 60%; }
          80% { background-size: 8px 100%, 8px 100%, 8px 80%; }
        }
      `}</style>
    </div>
  );
};

export default BidSmithSearch;
