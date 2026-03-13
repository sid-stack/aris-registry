import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import './SamRep.css'; // Import the new CSS file

import NavBar from '../components/dashboard/NavBar';
import MetricsStrip from '../components/dashboard/MetricsStrip';
import SystemStatus from '../components/dashboard/SystemStatus';
import RiskPanel from '../components/dashboard/RiskPanel';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';
import ComplianceTable from '../components/dashboard/ComplianceTable';
import OpportunitiesRadar from '../components/dashboard/OpportunitiesRadar';
import ExecutiveSummary from '../components/dashboard/ExecutiveSummary';
import BidRecommendation from '../components/dashboard/BidRecommendation';
import TechnicalAppendix from '../components/dashboard/TechnicalAppendix';
import ExportToolbar from '../components/dashboard/ExportToolbar';
import SolicitationHeader from '../components/dashboard/SolicitationHeader';
import AgenticPipeline from '../components/dashboard/AgenticPipeline';
import IntelligenceIndex from '../components/dashboard/IntelligenceIndex';
import RiskFlags from '../components/dashboard/RiskFlags';
import VerificationGrid from '../components/dashboard/VerificationGrid';
import WinThemes from '../components/dashboard/WinThemes';
import ComplianceMatrix from '../components/dashboard/ComplianceMatrix';
import ARISChat from '../components/dashboard/ARISChat';

const SectionDivider = ({ number, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 4px 0' }}>
    <div style={{
      width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
      background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', fontWeight: 700, color: 'var(--accent)',
    }}>{number}</div>
    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{title}</span>
    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
  </div>
);

const SamRep = ({ onBack }) => {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('bs-theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('bs-theme', theme); } catch {}
  }, [theme]);

  const [isDemoMode, setIsDemoMode] = useState(true); // Default to your polished static data
  const [loading, setLoading] = useState(false);
  const [complianceData, setComplianceData] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // The Recovery Script - Switch between static mockup and live output via CTRL+SHIFT+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDemoMode(prev => {
            const nextMode = !prev;
            console.log(`[ARIS]: Switching to ${nextMode ? 'STATIC' : 'LIVE'} mode.`);
            return nextMode;
        });
        setComplianceData(null); // Setting to null defaults back to static matrix
        setMetrics(null);
        setLoading(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleUpload = async (event) => {
    if (isDemoMode) {
        // Instant win: Set data to null to load the DHA Mock data
        setComplianceData(null);
        setMetrics(null);
        setLoading(false);
        console.log("Uploaded in Demo Mode (Static fallback loaded).");
        return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('rfp', file);

    setLoading(true); // Show that lovely af spinner
    try {
        // Assume API runs on port 8080 or same domain
        const response = await fetch('http://localhost:8080/api/shred', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            // Populate your ComplianceMatrix with REAL data
            setComplianceData(result.data.requirements || []); 
            setMetrics(result.data.metadata || result.data.statistics);
        } else {
            console.error("Shred error:", result);
        }
    } catch (error) {
        console.error("Shred failed:", error);
    } finally {
        setLoading(false);
    }
  };
  return (
    <div
      id="dashboard-content"
      data-theme={theme}
      style={{ backgroundColor: '#000000', color: '#e4e4e7', minHeight: '100vh', width: '100%' }}
    >
      <div className="samrep-container">
      <NavBar theme={theme} onToggleTheme={toggleTheme} onBack={onBack} />

      {/* ── Masthead ── */}
      <div className="sam-rep-masthead">
        <div>
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
            ARIS · Federal Pre-Bid Risk Intelligence
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Report generated <strong style={{ color: 'var(--text-primary)' }}>March 11, 2026 · 14:37 UTC</strong>
            &nbsp;·&nbsp; Analysis runtime <strong style={{ color: 'var(--text-primary)' }}>83 seconds</strong>
            &nbsp;·&nbsp; Time saved <strong style={{ color: 'var(--success)' }}>~14 hrs</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <input type="file" id="rfp-upload" style={{ display: 'none' }} onChange={handleUpload} accept=".pdf,.txt" />
          <label
            htmlFor="rfp-upload"
            style={{
              background: isDemoMode ? '#7c3aed' : 'var(--accent)',
              color: '#fff',
              padding: '7px 14px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              border: '1px solid transparent',
              flexShrink: 0,
            }}
          >
            {loading ? '⏳ SHREDDING...' : isDemoMode ? '🎭 DEMO MODE' : '🚀 RUN SHRED'}
          </label>
          <ExportToolbar />
        </div>
      </div>

      <main className="sam-rep-main">

        <SectionDivider number="1" title="Solicitation Overview" />
        <div className="sam-rep-grid grid-overview">
          <div className="solicitation-risk-grid">
            <SolicitationHeader />
            <RiskPanel />
          </div>
          <MetricsStrip />
          <SystemStatus />
        </div>

        <SectionDivider number="2" title="Intelligence Pipeline" />
        <div className="sam-rep-grid grid-intelligence">
          <AgenticPipeline />
          <IntelligenceIndex />
        </div>

        <SectionDivider number="3" title="Verification & Risk Analysis" />
        <div className="sam-rep-grid grid-verification">
          <VerificationGrid />
          <RiskHeatmap />
        </div>

        <SectionDivider number="4" title="Bid Intelligence" />
        <div className="sam-rep-grid grid-bid">
          <ExecutiveSummary />
          <BidRecommendation />
        </div>

        <SectionDivider number="5" title="Risk Flags & Bid-Killer Alerts" />
        <div style={{ marginBottom: '8px' }}>
          <RiskFlags />
        </div>

        <SectionDivider number="6" title="Compliance Matrix — FAR Referenced" />
        <div style={{ marginBottom: '8px' }}>
          <ComplianceMatrix complianceData={complianceData} isLoading={loading} />
        </div>

        <SectionDivider number="7" title="Win Themes & Opportunities Radar" />
        <div className="sam-rep-grid grid-win-themes">
          <WinThemes />
          <OpportunitiesRadar />
        </div>

        <SectionDivider number="8" title="Applicable Standards & Compliance Summary" />
        <div style={{ marginBottom: '24px' }}>
          <TechnicalAppendix />
        </div>

        <div className="sam-rep-footer">
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Audit Note: This report was generated via the <strong style={{ color: 'var(--accent)' }}>ARIS Stateless Bridge</strong>. Zero Storage. High Conviction.
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            © 2026 BidSmith · ARIS Protocol · <span style={{ color: 'var(--success)' }}>bidsmith.pro</span>
          </span>
        </div>
      </main>
      </div>
      <ARISChat />
    </div>
  );
};

export default SamRep;
