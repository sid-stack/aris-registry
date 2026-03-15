import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  Target, 
  Search, 
  Filter, 
  ChevronRight, 
  Zap, 
  Shield, 
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';
import './SamRep.css'; // Reuse the premium monochrome styles

const Discovery = ({ onBack }) => {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('bs-theme') || 'dark'; } catch { return 'dark'; }
  });
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNaics, setActiveNaics] = useState("541511,541512");
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('bs-theme', theme); } catch {}
    fetchProspects();
  }, [activeNaics, theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  
  const fetchProspects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discovery/search?naics=${activeNaics}`);
      const data = await res.json();
      if (data.success) {
        setProspects(data.prospects);
      }
    } catch (err) {
      console.error("Discovery failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#09090b', color: '#a1a1aa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar theme={theme} onToggleTheme={toggleTheme} onBack={onBack} />
      
      {/* Discovery Masthead */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #1a1a1a', background: '#09090b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: '#1e1b4b', border: '1px solid #312e81', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Radar size={18} color="#818cf8" />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>BID-MATCH SNIPER</h1>
            </div>
            <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>Discover and audit federal opportunities matching your capabilities in real-time.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0c0c0e', border: '1px solid #1a1a1a', padding: '8px 16px', borderRadius: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#52525b' }}>SEARCHING:</span>
              <span style={{ fontSize: '11px', color: '#d4d4d8', fontFamily: 'Space Mono' }}>NAICS_{activeNaics.split(',')[0]}...</span>
              <ChevronDown size={14} color="#52525b" />
            </div>
            <button style={{ background: '#1d4ed8', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} />
              ADVANCED FILTERS
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Intelligence Summary */}
        <aside style={{ width: '300px', borderRight: '1px solid #1a1a1a', padding: '24px', overflowY: 'auto' }}>
           <div style={{ marginBottom: '32px' }}>
             <span style={{ fontSize: '10px', fontWeight: 800, color: '#52525b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Scanning Stats</span>
             <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#0c0c0e', padding: '12px', borderRadius: '6px', border: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#d4d4d8' }}>{prospects.length}</div>
                  <div style={{ fontSize: '10px', color: '#52525b', fontWeight: 600 }}>MATCHES DETECTED (7D)</div>
                </div>
                <div style={{ background: '#0c0c0e', padding: '12px', borderRadius: '6px', border: '1px solid #1a1a1a' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>87%</div>
                  <div style={{ fontSize: '10px', color: '#52525b', fontWeight: 600 }}>AVG MATCH STRENGTH</div>
                </div>
             </div>
           </div>

           <div style={{ marginBottom: '32px' }}>
             <span style={{ fontSize: '10px', fontWeight: 800, color: '#52525b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Target Sectors</span>
             <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { label: 'Cloud Services', count: 14, active: true },
                  { label: 'Cybersecurity', count: 8, active: false },
                  { label: 'Data Analytics', count: 5, active: false },
                  { label: 'AI/ML', count: 3, active: false }
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '4px', background: s.active ? '#18181b' : 'transparent', cursor: 'pointer' }}>
                    <span style={{ fontSize: '11px', color: s.active ? '#d4d4d8' : '#71717a' }}>{s.label}</span>
                    <span style={{ fontSize: '9px', fontFamily: 'Space Mono', color: '#52525b' }}>{s.count}</span>
                  </div>
                ))}
             </div>
           </div>

           <div style={{ background: '#1e1b4b', padding: '20px', borderRadius: '8px', border: '1px solid #312e81' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
               <Zap size={14} color="#818cf8" fill="#818cf8" />
               <span style={{ fontSize: '11px', fontWeight: 800, color: '#f4f4f5' }}>UPGRADE TO PRO</span>
             </div>
             <p style={{ fontSize: '11px', color: '#a5b4fc', lineHeight: 1.5, marginBottom: '16px' }}>Unlock real-time SMS alerts and automated "Bid/No-Bid" synthesis for every match.</p>
             <button style={{ width: '100%', background: 'white', color: '#1e1b4b', border: 'none', padding: '8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>
               ACTIVATE PRO ($500/MO)
             </button>
           </div>
        </aside>

        {/* Center: Live Feed */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#0c0c0e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#d4d4d8', margin: 0, letterSpacing: '0.05em' }}>LIVE SCAN RESULTS</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                 <span style={{ fontSize: '10px', color: '#52525b', fontWeight: 600 }}>SAM_GOV_ONLINE</span>
              </div>
              <span style={{ fontSize: '10px', color: '#3f3f46' }}>UPDATED: JUST NOW</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
                 <div style={{ marginBottom: '16px' }}>Scanning federal database...</div>
                 <div className="animate-pulse" style={{ height: '2px', background: '#1d4ed8', width: '200px', margin: '0 auto' }} />
              </div>
            ) : prospects.map(p => (
              <div key={p.id} style={{ background: '#09090b', border: '1px solid #1a1a1a', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '4px', background: p.matchScore > 90 ? '#22c55e' : '#3b82f6' }} />
                <div style={{ flex: 1, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#52525b', fontFamily: 'Space Mono' }}>{p.id}</span>
                        <span style={{ fontSize: '9px', background: '#18181b', color: '#71717a', padding: '2px 6px', borderRadius: '2px', border: '1px solid #27272a' }}>{p.type.replace('_',' ')}</span>
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>{p.title}</h3>
                      <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>{p.agency}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: p.matchScore > 90 ? '#22c55e' : '#f4f4f5' }}>{p.matchScore}%</div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#52525b', letterSpacing: '0.05em' }}>MATCH_STRENGTH</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #141416' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} color="#52525b" />
                      <span style={{ fontSize: '11px', color: '#71717a' }}>DEADLINE: {p.deadline || 'QUARTERLY'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target size={12} color="#52525b" />
                      <span style={{ fontSize: '11px', color: '#71717a' }}>NAICS: {p.naics}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px', borderLeft: '1px solid #1a1a1a', background: '#0c0c0e', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', width: '180px' }}>
                   <button 
                    onClick={() => window.open(p.url, '_blank')}
                    style={{ background: 'transparent', border: '1px solid #27272a', color: '#a1a1aa', padding: '8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                     SOURCE <ExternalLink size={12} />
                   </button>
                   <button 
                    style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                     AUDIT_CLAUSES <ChevronRight size={12} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <footer style={{ height: '32px', borderTop: '1px solid #1a1a1a', background: '#09090b', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '9px', color: '#3f3f46', fontWeight: 600 }}>BID-MATCH SNIPER v1.0.2 • PERSISTENCE: LOCAL_VOLATILE</div>
        <div style={{ display: 'flex', gap: '24px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Shield size={10} color="#3f3f46" />
             <span style={{ fontSize: '9px', color: '#3f3f46' }}>ZERO_KNOWLEDGE_VAULT</span>
           </div>
           <span style={{ fontSize: '9px', color: '#3f3f46' }}>UPTIME: 99.9%</span>
        </div>
      </footer>
    </div>
  );
};

export default Discovery;
