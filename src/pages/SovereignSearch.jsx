import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Shield, 
  ArrowRight,
  Brain,
  Zap,
  Clock,
  ExternalLink,
  Target
} from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';

const SovereignSearch = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [status, setStatus] = useState('');

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;

    setLoading(true);
    setStatus('CONSULTING_SOVEREIGN_MESH');
    
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
      setStatus('MESH_LINK_ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sovereign-search-minimal" style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif'
    }}>
      <NavBar theme="dark" onToggleTheme={null} onBack={onBack} />
      
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        padding: results.length > 0 ? '60px 20px' : '0 20px',
        justifyContent: results.length > 0 ? 'flex-start' : 'center',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {/* ARIS SERIF LOGO */}
        <div style={{ 
          marginBottom: '40px',
          textAlign: 'center',
          animation: 'fadeInDown 0.8s ease-out'
        }}>
          <h1 style={{ 
            fontFamily: '"Playfair Display", "Georgia", serif', 
            fontSize: '5rem', 
            fontWeight: 400, 
            letterSpacing: '-0.03em',
            margin: 0,
            textShadow: '0 0 30px rgba(255,255,255,0.1)'
          }}>
            ARIS
          </h1>
          <p style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.4em', 
            color: 'var(--accent)',
            marginTop: '8px',
            opacity: 0.8
          }}>
            Sovereign Intelligence
          </p>
        </div>

        {/* MINIMALIST SEARCH BOX */}
        <form onSubmit={handleSearch} style={{ 
          width: '100%', 
          maxWidth: '640px',
          position: 'relative',
          marginBottom: '48px',
          animation: 'fadeInUp 0.8s ease-out 0.2s both'
        }}>
          <div style={{ 
            position: 'relative',
            background: '#111',
            border: '1px solid #222',
            borderRadius: '99px',
            padding: '4px 8px 4px 24px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease',
            border: loading ? '1px solid var(--accent)' : '1px solid #222'
          }} className="search-container-hover">
            <Search size={20} color="#444" style={{ marginRight: '16px' }} />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search federal solicitations..."
              style={{ 
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                padding: '14px 0',
                outline: 'none'
              }}
            />
            {query && !loading && (
              <button 
                type="submit"
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >
                <ArrowRight size={20} />
              </button>
            )}
            {loading && (
              <div className="loading-spinner" style={{ marginRight: '16px' }} />
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '24px', 
            marginTop: '20px',
            fontSize: '12px',
            color: '#555'
          }}>
             <div 
              onClick={() => setExpanded(!expanded)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: expanded ? 'var(--accent)' : '#555' }}>
               <Brain size={14} />
               <span>AI Expansion</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Shield size={14} />
               <span>Zero Knowledge</span>
             </div>
          </div>
        </form>

        {/* RESULTS FEED */}
        {results.length > 0 && (
          <div style={{ 
            width: '100%', 
            maxWidth: '640px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.5s ease'
          }}>
            {results.map((res, i) => (
              <div 
                key={res.id} 
                className="result-card"
                onClick={() => window.location.assign(`/app/audit?url=${encodeURIComponent(res.url)}`)}
                style={{ 
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--accent)', opacity: 0.7 }}>{res.agency}</span>
                      <span style={{ fontSize: '10px', color: '#444' }}>• {res.postedDate}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>{res.title}</h3>
                  </div>
                  <ChevronRight size={16} color="#333" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status && (
          <p style={{ marginTop: '20px', fontSize: '11px', color: 'var(--accent)', opacity: 0.6, letterSpacing: '0.1em' }}>
            {status}
          </p>
        )}

      </main>

      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid #111' }}>
         <span style={{ fontSize: '10px', color: '#222', letterSpacing: '0.1em' }}>ARIS SOVEREIGN v2.1 • USERS_ONLINE: 147</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .result-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.05);
          transform: translateX(4px);
        }

        .clickable-accent {
          transition: color 0.2s ease;
        }
        .clickable-accent:hover {
          color: var(--accent) !important;
        }
      `}</style>
    </div>
  );
};

const ChevronRight = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default SovereignSearch;
