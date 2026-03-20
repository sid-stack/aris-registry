import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRight,
  Brain,
  Shield,
  ChevronRight,
  Mic,
  Image as ImageIcon,
  Globe,
  Sparkles,
  FileText,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';

const SovereignSearch = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('US'); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [briefing, setBriefing] = useState(null);
  const [status, setStatus] = useState('');

  const COLORS = {
    bg: '#202124',
    secondaryBg: '#303134',
    text: '#bdc1c6',
    textWhite: '#e8eaed',
    textDim: '#9aa0a6',
    border: '#3c4043',
    blue: '#8ab4f8',
    accent: '#a8ff00' // ARIS Lime
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || params.get('query');
    const r = params.get('region') || 'US';
    
    if (q) {
      setQuery(q);
      setRegion(r);
      executeSearch(q, expanded, r);
    }
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    
    const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}&region=${region}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    await executeSearch(query, expanded, region);
  };

  const executeSearch = async (targetQuery, isExpanded, targetRegion) => {
    setLoading(true);
    setResults([]);
    setBriefing(null);
    setStatus(targetRegion === 'US' ? 'Synthesizing Federal Mesh...' : 'Aggregating Bharat Discovery...');
    
    try {
      const res = await fetch('/api/fed-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: targetQuery, 
          expand: isExpanded, 
          limit: 10,
          region: targetRegion 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setBriefing(data.briefing);
        setStatus('');
      }
    } catch (err) {
      console.error("Search failed:", err);
      setStatus('Error connecting to mesh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sovereign-search-minimal" style={{ 
      minHeight: '100vh', 
      background: COLORS.bg, 
      color: COLORS.textWhite,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'arial, sans-serif'
    }}>
      <NavBar theme="dark" onToggleTheme={null} onBack={onBack} />
      
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        padding: results.length > 0 ? '40px 20px' : '0 20px',
        justifyContent: results.length > 0 ? 'flex-start' : 'center',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {/* ARIS LOGO */}
        <div style={{ 
          marginBottom: '30px',
          textAlign: 'center',
          animation: 'fadeIn 1s ease'
        }}>
          <h1 style={{ 
            fontFamily: '"Times New Roman", serif', 
            fontSize: '5.5rem', 
            fontWeight: 400, 
            letterSpacing: '-0.02em',
            margin: 0,
            color: COLORS.textWhite
          }}>
            ARIS
          </h1>
          {region === 'IN' && (
            <span style={{ fontSize: '12px', color: COLORS.accent, letterSpacing: '0.4em', textTransform: 'uppercase', display: 'block', marginTop: '-10px', fontWeight: 500 }}>Bharat</span>
          )}
        </div>

        {/* SEARCH BOX */}
        <form onSubmit={handleSearch} style={{ 
          width: '100%', 
          maxWidth: '584px',
          position: 'relative',
          marginBottom: '20px'
        }}>
          <div style={{ 
            position: 'relative',
            background: COLORS.secondaryBg,
            borderRadius: '24px',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            height: '46px',
            border: '1px solid transparent',
          }} className="search-bar-inner">
            <Search size={20} color={COLORS.textDim} style={{ minWidth: '20px' }} />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={region === 'US' ? 'Search Federal Mesh...' : 'Search Bharat Tenders...'}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', padding: '0 12px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: COLORS.blue }}>
               <Mic size={20} style={{ cursor: 'pointer' }} />
               <ImageIcon size={20} style={{ cursor: 'pointer' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '28px' }}>
             <button type="submit" className="g-btn">ARIS Search</button>
             <button type="button" onClick={() => {
                const nr = region === 'US' ? 'IN' : 'US';
                setRegion(nr);
                if (results.length > 0) executeSearch(query, expanded, nr);
             }} className="g-btn">
               Switch to {region === 'US' ? 'Bharat 🇮🇳' : 'US 🇺🇸'}
             </button>
          </div>
        </form>

        {/* LOADING STATE */}
        {loading && (
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
             <div className="dot-pulse" style={{ margin: '0 auto 16px' }} />
             <p style={{ fontSize: '12px', color: COLORS.blue, opacity: 0.8, letterSpacing: '0.1em' }}>{status}</p>
          </div>
        )}

        {/* EXECUTIVE BRIEFING (Synthesis Layer) */}
        {briefing && !loading && (
          <div style={{ 
            width: '100%', 
            maxWidth: '652px',
            background: 'rgba(138, 180, 248, 0.05)',
            border: `1px solid rgba(138, 180, 248, 0.1)`,
            borderRadius: '12px',
            padding: '24px',
            marginTop: '20px',
            animation: 'fadeIn 0.8s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: COLORS.blue }}>
               <Sparkles size={18} />
               <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Executive Briefing</span>
            </div>
            <div style={{ 
              fontSize: '15px', 
              color: COLORS.textWhite, 
              lineHeight: '1.7',
              fontFamily: 'arial, sans-serif'
            }} className="briefing-content">
               {briefing.split('\n').map((line, i) => (
                 <p key={i} style={{ marginBottom: line.startsWith('-') ? '8px' : '12px' }}>{line}</p>
               ))}
            </div>
          </div>
        )}

        {/* RESULTS FEED */}
        {results.length > 0 && !loading && (
          <div style={{ 
            width: '100%', 
            maxWidth: '652px',
            marginTop: results.length > 0 ? '32px' : '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px'
          }}>
            {results.map((res, i) => (
              <div key={res.id} className="g-result">
                <div style={{ fontSize: '14px', color: COLORS.textDim, marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{res.agency}</span>
                  <span style={{ color: COLORS.accent, fontSize: '10px', opacity: 0.6 }}>[{res.id.substring(0,12)}]</span>
                </div>
                <h3 
                  className="g-title"
                  style={{ fontSize: '20px', color: COLORS.blue, margin: '0 0 8px 0', fontWeight: 400, cursor: 'pointer' }}
                  onClick={() => window.open(res.url, '_blank')}
                >
                  {res.title}
                </h3>
                <div style={{ fontSize: '14px', color: COLORS.text, lineHeight: '1.58', marginBottom: '12px' }}>
                  Posted on {res.postedDate}. AI expanded context indicates high compliance alignment for your capture profile.
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                   <button 
                    onClick={() => window.location.assign(`/app/audit?url=${encodeURIComponent(res.url)}`)}
                    className="action-pill"
                   >
                     <FileText size={14} />
                     Conduct Audit
                   </button>
                   <button className="action-pill secondary">
                     <TrendingUp size={14} />
                     Market Insight
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <footer style={{ background: '#171717', padding: '14px 20px', fontSize: '13px', color: COLORS.textDim, borderTop: '1px solid #3c4043', display: 'flex', gap: '24px' }}>
         <span>Advertising</span>
         <span>Business</span>
         <span>How ARIS Works</span>
         <div style={{ flex: 1 }} />
         <span>Privacy</span>
         <span>Terms</span>
         <span>Settings</span>
      </footer>

      <style>{`
        .g-btn {
          background-color: #303134;
          border: 1px solid #303134;
          color: #e8eaed;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          min-width: 140px;
        }
        .g-btn:hover { border-color: #5f6368; background-color: #3c4043; }
        .search-bar-inner:hover, .search-bar-inner:focus-within { background-color: #3c4043; box-shadow: 0 1px 6px rgba(0,0,0,0.28); }
        .g-title:hover { text-decoration: underline; }
        .action-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(138, 180, 248, 0.1);
          color: ${COLORS.blue};
          border: 1px solid rgba(138, 180, 248, 0.2);
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-pill:hover { background: rgba(138, 180, 248, 0.2); }
        .action-pill.secondary { color: ${COLORS.textDim}; border-color: transparent; background: transparent; }
        .action-pill.secondary:hover { color: #fff; background: rgba(255,255,255,0.05); }

        .dot-pulse {
          width: 8px;
          height: 8px;
          background: ${COLORS.blue};
          border-radius: 50%;
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse { from { opacity: 0.4; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default SovereignSearch;
