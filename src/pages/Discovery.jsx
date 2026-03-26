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
  X,
  Brain,
  Terminal,
  Activity
} from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';
import BidSmithChat from '../components/dashboard/BidSmithChat';
import '../styles/Dashboard.css';
import './SamScraper.css'; // Reuse the premium monochrome styles

const Discovery = ({ onBack }) => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNaics, setActiveNaics] = useState("541511,541512");
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [theme, setTheme] = useState('dark');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [statusText, setStatusText] = useState('SCANNING_GOVCON_CLOUDS');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [activeNaics]);

  const fetchProspects = async () => {
    setLoading(true);
    setStatusText('INITIALIZING_RADAR_BRIDGE...');
    try {
      const res = await fetch(`/api/discovery/search?naics=${activeNaics}`);
      const data = await res.json();
      if (data.success) {
        setProspects(data.prospects);
        setStatusText('RADAR_LOCKED: ' + data.prospects.length + ' SECTORS');
      }
    } catch (err) {
      console.error("Discovery failed:", err);
      setStatusText('RADAR_LINK_ERROR');
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const handleChatLog = (message, type = 'info') => {};
  const handleCommand = (command) => {};

  const handleProspectClick = (prospect) => {
    setSelectedProspect(prospect);
    setIsChatOpen(true);
  };

  return (
    <div className="sam-scraper dark" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <NavBar theme="dark" onToggleTheme={null} onBack={onBack} />

      {/* ARIS_MARKET_RADAR Masthead */}
      <div className="sam-scraper-header" style={{ 
        padding: '24px 32px', 
        marginBottom: '0', 
        borderRadius: '0', 
        borderLeft: 'none', 
        borderRight: 'none',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="header-badge">
              <Radar size={12} />
              <span>BIDSMITH_MARKET_RADAR_v2.1</span>
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Contract Intelligence Feed</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Terminal size={10} color="var(--accent)" />
                <span className="status-code">{statusText}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {!isMobile && (
              <div className="metric-box glass" style={{ minWidth: 'auto', padding: '8px 16px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                <Activity size={12} color="var(--success)" className="pulse-bridge" />
                <span className="metric-val" style={{ fontSize: '13px' }}>{prospects.length || 0}</span>
                <span className="metric-lab" style={{ marginTop: 0 }}>ACTIVE_LEADS</span>
              </div>
            )}
            
            <button 
              className="chip active"
              style={{ height: '40px', borderRadius: '4px' }}
            >
              <Filter size={14} />
              <span>REORGANIZE</span>
            </button>
          </div>
        </div>
      </div>

      <div className="sam-scraper-container" style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden', padding: 0, maxWidth: 'none' }}>
        {/* Left: Intelligence Summary */}
        <aside className="glass" style={{ 
          width: isMobile ? '100%' : '300px', 
          borderRight: '1px solid var(--border)', 
          padding: '24px', 
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
           <div>
             <span className="metric-lab" style={{ color: 'var(--accent)' }}>RADAR_SCAN_METRICS</span>
             <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <div className="metric-box glass" style={{ minWidth: '0', flex: 1, padding: '12px' }}>
                  <span className="metric-val" style={{ fontSize: '1.25rem' }}>{prospects.length}</span>
                  <span className="metric-lab" style={{ fontSize: '8px' }}>MATCHES_FOUND</span>
                </div>
                <div className="metric-box glass accent" style={{ minWidth: '0', flex: 1, padding: '12px' }}>
                  <span className="metric-val" style={{ fontSize: '1.25rem' }}>87%</span>
                  <span className="metric-lab" style={{ fontSize: '8px' }}>AVG_CONFIDENCE</span>
                </div>
             </div>
           </div>

           <div>
             <span className="metric-lab" style={{ color: 'var(--accent)' }}>SECTOR_CONCENTRATION</span>
             <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {['Cloud Services', 'Cybersecurity', 'AI Infrastructure', 'Edge Computing'].map(s => (
                  <div key={s} className="chip" style={{ justifyContent: 'space-between', padding: '6px 12px', background: 'transparent', border: 'none' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s}</span>
                    <span className="status-code" style={{ fontSize: '9px', color: 'var(--accent)' }}>{Math.floor(Math.random() * 20)}</span>
                  </div>
                ))}
             </div>
           </div>

           <div className="metric-box glass" style={{ marginTop: 'auto', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap size={14} color="var(--accent)" fill="var(--accent)" />
                <span className="metric-lab" style={{ color: '#fff', fontSize: '10px' }}>UPGRADE_PIPELINE</span>
              </div>
              <p style={{ fontSize: '10px', margin: 0 }}>Unlock real-time SMS alerts and agentic synthesis.</p>
           </div>
        </aside>

        {/* Center: Live Feed */}
        <main style={{ 
          flex: 1, 
          padding: '24px', 
          background: 'var(--bg-primary)',
          overflowY: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--text-secondary)', margin: 0 }}>INTELLIGENCE_STREAM</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="intel-pulse" style={{ position: 'static', width: '8px', height: '8px', background: 'var(--success)' }}></div>
                  <span className="status-code" style={{ fontSize: '9px' }}>SAM_NODE_ACTIVE</span>
               </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div className="loading-grid" style={{ gridTemplateColumns: '1fr' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-card" style={{ height: '120px' }} />
                ))}
              </div>
            ) : prospects.map(p => (
              <div key={p.id} className="intel-card glass" style={{ flexDirection: 'row', padding: '16px 20px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span className="status-code" style={{ color: 'var(--accent)' }}>[ID_{p.id}]</span>
                    <span className="point-status stable" style={{ fontSize: '8px' }}>{p.type.replace('_',' ')}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>{p.title}</h3>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} color="var(--text-secondary)" />
                      <span className="status-code" style={{ fontSize: '9px' }}>DUE: {p.deadline || 'O-24'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target size={12} color="var(--text-secondary)" />
                      <span className="status-code" style={{ fontSize: '9px' }}>{p.naics}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', minWidth: '140px' }}>
                  <div className="card-badge" style={{ display: 'inline-flex', marginBottom: '12px' }}>
                    <span>{p.matchScore}% MATCH</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleProspectClick(p)}
                      className="btn-ai" style={{ flex: 1, height: '36px' }}>
                      AUDIT
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <footer className="vault-status-bar">
        <div className="vault-glow flash" />
        <span className="status-code">MARKET_RADAR_SNIPER v1.0.2 • ZERO_KNOWLEDGE_ACTIVE</span>
      </footer>

      {/* ── Floating Chat Interface ── */}
      {isChatOpen && (
        <div className="full-chat-overlay visible">
          <div className="chat_header">
            <div className="chat_title">
              <Activity size={16} />
              <span>BIDSMITH_INTEL_STREAM</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="close-btn">×</button>
          </div>
          <div className="chat_body">
            <BidSmithChat 
              selectedContext={selectedProspect}
              onLog={() => {}}
              onCommand={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Discovery;
