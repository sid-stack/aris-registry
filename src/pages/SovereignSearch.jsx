import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRight,
  Brain,
  Shield,
  ChevronRight,
  Mic,
  Image as ImageIcon
} from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';

const SovereignSearch = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [status, setStatus] = useState('');

  // Google-exact colors from dark mode
  const COLORS = {
    bg: '#202124',
    secondaryBg: '#303134',
    text: '#bdc1c6',
    textWhite: '#e8eaed',
    textDim: '#9aa0a6',
    border: '#3c4043',
    blue: '#8ab4f8'
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;

    setLoading(true);
    setStatus('Searching the Sovereign Mesh...');
    
    try {
      const res = await fetch('/api/fed-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, expand: expanded, limit: 10 })
      });
      
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
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
        
        {/* ARIS LOGO (Serif but refined) */}
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
        </div>

        {/* GOOGLE-STYLE SEARCH BOX */}
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
            transition: 'box-shadow 0.2s ease',
          }} className="search-bar-inner">
            <Search size={20} color={COLORS.textDim} style={{ minWidth: '20px' }} />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder=""
              style={{ 
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                padding: '0 12px',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: COLORS.blue }}>
               <Mic size={20} style={{ cursor: 'pointer' }} />
               <ImageIcon size={20} style={{ cursor: 'pointer' }} />
               {loading && <div className="dot-pulse" />}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '12px', 
            marginTop: '28px'
          }}>
             <button type="submit" className="g-btn">ARIS Search</button>
             <button type="button" onClick={() => setExpanded(!expanded)} className="g-btn">
               {expanded ? 'AI Mode' : 'Standard'}
             </button>
          </div>
        </form>

        {/* RESULTS FEED */}
        {results.length > 0 && (
          <div style={{ 
            width: '100%', 
            maxWidth: '652px',
            marginTop: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {results.map((res, i) => (
              <div 
                key={res.id} 
                className="g-result"
                onClick={() => window.location.assign(`/app/audit?url=${encodeURIComponent(res.url)}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ fontSize: '14px', color: COLORS.textDim, marginBottom: '4px' }}>
                  {res.agency} › {res.id.substring(0,10)}
                </div>
                <h3 style={{ 
                  fontSize: '20px', 
                  color: COLORS.blue, 
                  margin: '0 0 6px 0', 
                  fontWeight: 400,
                  fontFamily: 'arial, sans-serif'
                }} className="g-title">
                  {res.title}
                </h3>
                <div style={{ fontSize: '14px', color: COLORS.text, lineHeight: '1.58' }}>
                  Posted on {res.postedDate}. AI expanded context indicates high compliance alignment for your capture profile.
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <footer style={{ 
        background: '#171717', 
        padding: '14px 20px', 
        fontSize: '14px', 
        color: COLORS.textDim,
        borderTop: '1px solid #3c4043',
        display: 'flex',
        gap: '24px'
      }}>
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
          min-width: 120px;
        }
        .g-btn:hover {
          border-color: #5f6368;
          box-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }
        .search-bar-inner:hover, .search-bar-inner:focus-within {
          background-color: #3c4043;
          box-shadow: 0 1px 6px rgba(0,0,0,0.28);
        }
        .g-title:hover {
          text-decoration: underline;
        }
        .g-result {
          max-width: 600px;
        }
        .dot-pulse {
          width: 8px;
          height: 8px;
          background: ${COLORS.blue};
          border-radius: 50%;
          animation: pulse 1s infinite alternate;
        }
        @keyframes pulse {
          from { opacity: 0.4; }
          to { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SovereignSearch;
