import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  Cpu, 
  Shield, 
  Zap, 
  Target, 
  Clock, 
  ExternalLink, 
  Activity,
  ArrowRight,
  ChevronRight,
  Brain
} from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';
import './Audit.css'; // Leverage the premium monochrome audit styles

const SovereignSearch = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [status, setStatus] = useState('SYSTEM_IDLE');

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;

    setLoading(true);
    setStatus('QUERY_EXPANSION_ACTIVE');
    
    try {
      const res = await fetch('/api/fed-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, expand: expanded, limit: 15 })
      });
      
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setStatus(`RESULTS_RETRIEVED: ${data.count} SOLICITATIONS`);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setStatus('SEARCH_ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-page dark" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <NavBar theme="dark" onToggleTheme={null} onBack={onBack} />
      
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="header-badge" style={{ display: 'inline-flex', marginBottom: '20px' }}>
              <Shield size={12} color="var(--accent)" />
              <span>SOVEREIGN_FED_SEARCH_v2.1</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              Procurement Intelligence Access Point
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
              Sub-millisecond discovery across federal solicitations via Inverted Index logic and AI-driven query expansion.
            </p>
          </div>

          <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '40px' }}>
            <div className="glass" style={{ 
              padding: '12px', 
              borderRadius: '12px', 
              display: 'flex', 
              gap: '12px',
              border: loading ? '1px solid var(--accent)' : '1px solid var(--border)',
              transition: 'all 0.3s ease',
              boxShadow: loading ? '0 0 20px rgba(59, 130, 246, 0.1)' : 'none'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Query keywords (e.g. 'Artificial Intelligence', 'Cybersecurity Support')"
                  style={{ 
                    width: '100%', 
                    background: 'transparent', 
                    border: 'none', 
                    padding: '12px 12px 12px 48px', 
                    color: '#fff', 
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>
              <button 
                type="submit"
                className="btn-ai"
                disabled={loading}
                style={{ height: '48px', padding: '0 24px', borderRadius: '8px' }}
              >
                {loading ? 'SEARCHING...' : 'INIT_SEARCH'}
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={10} color={loading ? "var(--accent)" : "var(--success)"} className={loading ? "pulse-bridge" : ""} />
                <span className="status-code" style={{ fontSize: '10px' }}>{status}</span>
              </div>
              <div 
                onClick={() => setExpanded(!expanded)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  opacity: expanded ? 1 : 0.5
                }}
              >
                <Brain size={12} color="var(--accent)" />
                <span className="status-code" style={{ fontSize: '10px' }}>AI_QUERY_EXPANSION: {expanded ? 'ON' : 'OFF'}</span>
              </div>
            </div>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {results.map((res, i) => (
              <div 
                key={res.id} 
                className="glass" 
                style={{ padding: '24px', borderRadius: '12px', borderLeft: '3px solid var(--accent)', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <span className="status-code" style={{ color: 'var(--accent)' }}>[SOL_{res.id.substring(0,8)}]</span>
                      <span className="status-code" style={{ color: 'var(--text-secondary)' }}>{res.agency}</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{res.title}</h3>
                  </div>
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="btn-icon">
                    <ExternalLink size={16} />
                  </a>
                </div>
                
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} color="var(--text-secondary)" />
                    <span className="status-code" style={{ fontSize: '10px' }}>POSTED: {res.postedDate}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={14} color="var(--text-secondary)" />
                    <span className="status-code" style={{ fontSize: '10px' }}>ID: {res.id}</span>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                   <button 
                    onClick={() => window.location.assign(`/app/audit?url=${encodeURIComponent(res.url)}`)}
                    className="btn-ai" style={{ height: '32px', fontSize: '10px', padding: '0 16px', background: 'transparent', border: '1px solid var(--accent)' }}>
                    INIT_AUDIT <ArrowRight size={10} style={{ marginLeft: '4px' }} />
                   </button>
                </div>
              </div>
            ))}

            {results.length === 0 && !loading && query && (
               <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>NO_MATCHES_FOUND_IN_LOCAL_INDEX</p>
               </div>
            )}
          </div>

        </div>
      </main>

      <footer className="vault-status-bar" style={{ background: '#000', borderTop: '1px solid var(--border)' }}>
        <span className="status-code">ARIS_SOVEREIGN_SEARCH_v2.1_ALPHA • ZERO_KNOWLEDGE_PROTOCOL_ACTIVE</span>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .btn-icon:hover {
          background: var(--accent);
          color: #000;
        }
      `}</style>
    </div>
  );
};

export default SovereignSearch;
