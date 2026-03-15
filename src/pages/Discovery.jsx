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
  ChevronDown,
  MessageSquare,
  X
} from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';
import ARISChat from '../components/dashboard/ARISChat';
import '../styles/Dashboard.css';
import './SamRep.css'; // Reuse the premium monochrome styles

const Discovery = ({ onBack }) => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNaics, setActiveNaics] = useState("541511,541512");
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('bs-theme') || 'dark'; } catch { return 'dark'; }
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('bs-theme', theme); } catch {}
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  
  useEffect(() => {
    fetchProspects();
  }, [activeNaics]);

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

  const handleChatLog = (message, type = 'info') => {
    // Chat logs handled by analytics in production
  };

  const handleCommand = (command) => {
    // Commands handled by analytics in production
  };

  const handleProspectClick = (prospect) => {
    setSelectedProspect(prospect);
    setIsChatOpen(true);
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--background)', 
      color: 'var(--text-primary)', 
      height: '100vh', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden' 
    }} data-theme={theme}>
      <NavBar theme={theme} onToggleTheme={toggleTheme} onBack={onBack} />

      {/* Masthead */}
      <div style={{ 
        borderBottom: '1px solid #1a1a1a', 
        background: '#09090b', 
        padding: isMobile ? '12px 16px' : '16px 24px',
        flexShrink: 0
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          gap: isMobile ? '16px' : '24px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <Radar size={18} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>LIVE MARKET RADAR</div>
              <div style={{ fontSize: '10px', color: '#52525b', fontFamily: 'Space Mono', letterSpacing: '0.05em' }}>SCANNING_GOVCON_CLOUDS (v1.1)</div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            width: isMobile ? '100%' : 'auto',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '12px', 
              background: '#0c0c0e', 
              border: '1px solid #1a1a1a', 
              padding: '8px 16px', 
              borderRadius: '4px',
              flex: isMobile ? 1 : 'unset',
              minWidth: isMobile ? '0' : '200px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525b' }}>NAICS:</span>
                <span style={{ fontSize: '11px', color: '#d4d4d8', fontFamily: 'Space Mono' }}>{activeNaics.split(',')[0]}...</span>
              </div>
              <ChevronDown size={14} color="#52525b" />
            </div>
            
            <button 
              onClick={() => window.location.href = '/app'}
              style={{ 
                background: 'transparent', 
                border: '1px solid #27272a', 
                color: '#a1a1aa', 
                padding: '10px 16px', 
                borderRadius: '4px', 
                fontSize: '11px', 
                fontWeight: 700, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '40px'
              }}
            >
              <Zap size={14} color="#3b82f6" fill="#3b82f6" />
              GO TO WORKSPACE
            </button>

            <button style={{ 
              background: '#1d4ed8', 
              border: 'none', 
              color: 'white', 
              padding: '10px 20px', 
              borderRadius: '4px', 
              fontSize: '11px', 
              fontWeight: 800, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              minHeight: '40px',
              flex: isMobile ? 1 : 'unset'
            }}>
              <Filter size={14} />
              FILTERS
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflowY: 'auto' }}>
        {/* Left: Intelligence Summary */}
        <aside style={{ 
          width: isMobile ? '100%' : '300px', 
          borderRight: isMobile ? 'none' : '1px solid #1a1a1a', 
          borderBottom: isMobile ? '1px solid #1a1a1a' : 'none',
          padding: isMobile ? '16px' : '20px', 
          background: '#09090b',
          display: isMobile ? 'grid' : 'block',
          gridTemplateColumns: isMobile && windowWidth > 640 ? 'repeat(3, 1fr)' : '1fr',
          gap: '20px',
          flexShrink: 0
        }}>
           <div style={{ marginBottom: isMobile ? '0' : '32px' }}>
             <span style={{ fontSize: '9px', fontWeight: 800, color: '#52525b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Scanning Stats</span>
             <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <div style={{ background: '#0c0c0e', padding: '12px', borderRadius: '6px', border: '1px solid #1a1a1a', flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#d4d4d8' }}>{prospects.length}</div>
                  <div style={{ fontSize: '9px', color: '#52525b', fontWeight: 600 }}>MATCHES (7D)</div>
                </div>
                <div style={{ background: '#0c0c0e', padding: '12px', borderRadius: '6px', border: '1px solid #1a1a1a', flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>87%</div>
                  <div style={{ fontSize: '9px', color: '#52525b', fontWeight: 600 }}>STRENGTH</div>
                </div>
             </div>
           </div>

           {!isMobile && (
             <div style={{ marginBottom: '32px' }}>
               <span style={{ fontSize: '9px', fontWeight: 800, color: '#52525b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Target Sectors</span>
               <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {[
                    { label: 'Cloud Services', count: 14, active: true },
                    { label: 'Cybersecurity', count: 8, active: false }
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: '4px', background: s.active ? '#18181b' : 'transparent' }}>
                      <span style={{ fontSize: '11px', color: s.active ? '#d4d4d8' : '#71717a' }}>{s.label}</span>
                      <span style={{ fontSize: '9px', fontFamily: 'Space Mono', color: '#52525b' }}>{s.count}</span>
                    </div>
                  ))}
               </div>
             </div>
           )}

           <div style={{ 
             background: '#1e1b4b', 
             padding: '16px', 
             borderRadius: '8px', 
             border: '1px solid #312e81',
             gridColumn: isMobile && windowWidth > 640 ? 'span 1' : 'auto'
           }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
               <Zap size={14} color="#818cf8" fill="#818cf8" />
               <span style={{ fontSize: '10px', fontWeight: 800, color: '#f4f4f5' }}>UPGRADE</span>
             </div>
             <p style={{ fontSize: '10px', color: '#a5b4fc', lineHeight: 1.4, marginBottom: '12px' }}>Unlock SMS alerts and AI synthesis.</p>
             <button style={{ width: '100%', background: 'white', color: '#1e1b4b', border: 'none', padding: '8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>
               ACTIVATE PRO
             </button>
           </div>
        </aside>

        {/* Center: Live Feed */}
        <main style={{ 
          flex: 1, 
          padding: isMobile ? '16px' : '32px', 
          background: '#0c0c0e',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: windowWidth < 640 ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: windowWidth < 640 ? 'flex-start' : 'center', 
            marginBottom: '24px',
            gap: '12px'
          }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#d4d4d8', margin: 0, letterSpacing: '0.05em' }}>LIVE SCAN RESULTS</h2>
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
                 <div style={{ marginBottom: '16px', fontSize: '13px' }}>Scanning federal database...</div>
                 <div className="animate-pulse" style={{ height: '2px', background: '#1d4ed8', width: '140px', margin: '0 auto' }} />
              </div>
            ) : prospects.map(p => (
              <div key={p.id} style={{ 
                background: '#09090b', 
                border: '1px solid #1a1a1a', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                display: 'flex',
                flexDirection: windowWidth < 640 ? 'column' : 'row'
              }}>
                <div style={{ 
                  width: windowWidth < 640 ? '100%' : '4px', 
                  height: windowWidth < 640 ? '4px' : 'auto',
                  background: p.matchScore > 90 ? '#22c55e' : '#3b82f6' 
                }} />
                <div style={{ flex: 1, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#52525b', fontFamily: 'Space Mono' }}>{p.id}</span>
                        <span style={{ fontSize: '9px', background: '#18181b', color: '#71717a', padding: '2px 6px', borderRadius: '2px', border: '1px solid #27272a' }}>{p.type.replace('_',' ')}</span>
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5', margin: 0, lineHeight: 1.4 }}>{p.title}</h3>
                      <div style={{ fontSize: '11px', color: '#71717a', marginTop: '6px' }}>{p.agency}</div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: p.matchScore > 90 ? '#22c55e' : '#f4f4f5' }}>{p.matchScore}%</div>
                      <div style={{ fontSize: '8px', fontWeight: 700, color: '#52525b', letterSpacing: '0.05em' }}>MATCH</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: isMobile ? '12px' : '24px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #141416', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} color="#52525b" />
                      <span style={{ fontSize: '10px', color: '#71717a' }}>DUE: {p.deadline || 'Q4'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target size={12} color="#52525b" />
                      <span style={{ fontSize: '10px', color: '#71717a' }}>NAICS: {p.naics}</span>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  padding: '16px 20px', 
                  borderLeft: windowWidth < 640 ? 'none' : '1px solid #1a1a1a', 
                  borderTop: windowWidth < 640 ? '1px solid #1a1a1a' : 'none',
                  background: '#0c0c0e', 
                  display: 'flex', 
                  flexDirection: windowWidth < 640 ? 'row' : 'column', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  width: windowWidth < 640 ? '100%' : '180px' 
                }}>
                   <button 
                    onClick={() => window.open(p.url, '_blank')}
                    style={{ flex: 1, background: 'transparent', border: '1px solid #27272a', color: '#a1a1aa', padding: '10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                     SOURCE
                   </button>
                   <button 
                    onClick={() => handleProspectClick(p)}
                    style={{ flex: 1, background: '#3b82f6', border: 'none', color: 'white', padding: '10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                     AUDIT
                   </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <footer style={{ 
        height: isMobile ? 'auto' : '32px', 
        borderTop: '1px solid #1a1a1a', 
        background: '#09090b', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center', 
        padding: isMobile ? '12px' : '0 32px', 
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div style={{ fontSize: '8px', color: '#3f3f46', fontWeight: 600 }}>BID-MATCH SNIPER v1.0.2 • PERSISTENCE: LOCAL_VOLATILE</div>
        <div style={{ display: 'flex', gap: '20px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Shield size={10} color="#3f3f46" />
             <span style={{ fontSize: '8px', color: '#3f3f46' }}>ZERO_KNOWLEDGE_VAULT</span>
           </div>
           {!isMobile && <span style={{ fontSize: '8px', color: '#3f3f46' }}>UPTIME: 99.9%</span>}
        </div>
      </footer>

      {/* ── Floating Chat Interface ── */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
        {isChatOpen && (
          <div style={{ 
            width: windowWidth < 500 ? 'calc(100vw - 32px)' : windowWidth < 768 ? '380px' : '420px', 
            height: windowWidth < 500 ? 'calc(100vh - 80px)' : windowWidth < 768 ? '500px' : '600px', 
            background: '#0c0c0e', 
            borderRadius: '12px', 
            border: '1px solid #1a1a1a',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <style>{`
              @keyframes slideIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}</style>
            <div style={{ 
              padding: windowWidth < 500 ? '10px 12px' : '12px 16px', 
              borderBottom: '1px solid #1a1a1a', 
              background: '#09090b', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              minHeight: '48px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={windowWidth < 500 ? 12 : 14} color="#3b82f6" fill="#3b82f6" />
                <span style={{ 
                  fontSize: windowWidth < 500 ? '10px' : '11px', 
                  fontWeight: 800, 
                  letterSpacing: '0.1em', 
                  color: '#f4f4f5' 
                }}>
                  ARIS INTELLIGENCE
                </span>
                {selectedProspect && (
                  <span style={{ 
                    fontSize: '8px', 
                    color: '#71717a', 
                    background: '#18181b', 
                    padding: '2px 6px', 
                    borderRadius: '2px',
                    border: '1px solid #27272a'
                  }}>
                    {selectedProspect.id}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#71717a', 
                  cursor: 'pointer', 
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#27272a'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ARISChat 
                selectedContext={selectedProspect}
                onLog={handleChatLog}
                onCommand={handleCommand}
                reportData={{}}
              />
            </div>
          </div>
        )}
        
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            width: windowWidth < 500 ? '48px' : '56px',
            height: windowWidth < 500 ? '48px' : '56px',
            borderRadius: '50%',
            background: '#09090b',
            color: 'white',
            border: '1px solid #1a1a1a',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isChatOpen ? 'rotate(90deg)' : 'none'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = isChatOpen ? 'rotate(90deg) scale(1.1)' : 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = isChatOpen ? 'rotate(90deg)' : 'none'}
        >
          {isChatOpen ? 
            <X size={windowWidth < 500 ? 18 : 20} /> : 
            <MessageSquare size={windowWidth < 500 ? 20 : 24} fill="#3b82f6" color="#3b82f6" />
          }
        </button>
      </div>
    </div>
  );
};

export default Discovery;
