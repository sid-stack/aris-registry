import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

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

const SamRep = () => {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('bs-theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('bs-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div
      id="dashboard-content"
      data-theme={theme}
      style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)', minHeight: '100vh' }}
    >
      <NavBar theme={theme} onToggleTheme={toggleTheme} />

      {/* ── Masthead ── */}
      <div style={{
        background: 'var(--card)', borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
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
        <ExportToolbar />
      </div>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>

        <SectionDivider number="1" title="Solicitation Overview" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
            <SolicitationHeader />
            <RiskPanel />
          </div>
          <MetricsStrip />
          <SystemStatus />
        </div>

        <SectionDivider number="2" title="Intelligence Pipeline" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' }}>
          <AgenticPipeline />
          <IntelligenceIndex />
        </div>

        <SectionDivider number="3" title="Verification & Risk Analysis" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' }}>
          <VerificationGrid />
          <RiskHeatmap />
        </div>

        <SectionDivider number="4" title="Bid Intelligence" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' }}>
          <ExecutiveSummary />
          <BidRecommendation />
        </div>

        <SectionDivider number="5" title="Risk Flags & Bid-Killer Alerts" />
        <div style={{ marginBottom: '8px' }}>
          <RiskFlags />
        </div>

        <SectionDivider number="6" title="Compliance Matrix — FAR Referenced" />
        <div style={{ marginBottom: '8px' }}>
          <ComplianceMatrix />
        </div>

        <SectionDivider number="7" title="Win Themes & Opportunities Radar" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' }}>
          <WinThemes />
          <OpportunitiesRadar />
        </div>

        <SectionDivider number="8" title="Applicable Standards & Compliance Summary" />
        <div style={{ marginBottom: '24px' }}>
          <TechnicalAppendix />
        </div>

        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            Audit Note: This report was generated by the <strong style={{ color: 'var(--accent)' }}>BidSmith Intelligence Engine</strong>. Zero Fluff. High Conviction.
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            © 2026 BidSmith · ARIS Protocol · <span style={{ color: 'var(--success)' }}>bidsmith.pro</span>
          </span>
        </div>
      </main>
    </div>
  );
};

export default SamRep;
