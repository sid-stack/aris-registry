import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import './SamRep.css'; 

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
import RequirementsLinter from '../components/dashboard/RequirementsLinter';
import SecurityToggle from '../components/dashboard/SecurityToggle';

// Load static source of truth
import requirementsData from '../../requirements_matrix.json';

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

  const [isDemoMode, setIsDemoMode] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [complianceData, setComplianceData] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <div
      id="dashboard-content"
      data-theme={theme}
      style={{ backgroundColor: '#0b0b0d', color: '#e4e4e7', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <NavBar theme={theme} onToggleTheme={toggleTheme} onBack={onBack} />

      {/* ── Studio Toolbar ── */}
      <div className="sam-rep-masthead" style={{ borderBottom: '1px solid #27272a', padding: '10px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-secondary)', marginBottom: '2px', textTransform: 'uppercase' }}>
                ARIS STUDIO V1.0
              </div>
              <div style={{ fontSize: '11px', color: '#71717a' }}>
                 <strong style={{ color: '#3b82f6' }}>LIVE AUDIT</strong>: DHA Video Imaging Archive
              </div>
            </div>
            <SecurityToggle />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#18181b', padding: '4px 12px', borderRadius: '6px', border: '1px solid #27272a' }}>
             <span style={{ fontSize: '10px', color: '#71717a' }}>SAVED TO SESSION</span>
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
          </div>
          <ExportToolbar />
        </div>
      </div>

      <div className="aris-studio-workspace">
        {/* Pane 1: Requirements Linter (Left) */}
        <aside className="studio-pane studio-linter-pane">
          <RequirementsLinter 
            requirements={requirementsData.requirements} 
            onSelect={setSelectedReq}
          />
        </aside>

        {/* Pane 2: Audit Canvas (Center) */}
        <main className="studio-pane studio-canvas">
          <div className="sam-rep-main" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0' }}>
            <SectionDivider number="1" title="Solicitation Overview" />
            <div className="sam-rep-grid grid-overview">
              <div className="solicitation-risk-grid">
                <SolicitationHeader />
                <RiskPanel />
              </div>
              <MetricsStrip />
            </div>

            <SectionDivider number="2" title="Intelligence Pipeline" />
            <div className="sam-rep-grid grid-intelligence">
              <AgenticPipeline />
              <IntelligenceIndex />
            </div>

            <SectionDivider number="3" title="Compliance Matrix" />
            <div style={{ marginBottom: '20px' }}>
              <ComplianceMatrix complianceData={complianceData} isLoading={loading} />
            </div>

            <SectionDivider number="4" title="Verification & Risks" />
            <div className="sam-rep-grid grid-verification">
              <VerificationGrid />
              <RiskHeatmap />
            </div>

            <SectionDivider number="5" title="Bid Intelligence" />
            <div className="sam-rep-grid grid-bid">
              <ExecutiveSummary />
              <BidRecommendation />
            </div>
          </div>
        </main>

        {/* Pane 3: Studio Workbench (Right) */}
        <aside className="studio-pane studio-workbench-pane" style={{ background: '#0b0b0d' }}>
           <ARISChat selectedContext={selectedReq} />
        </aside>
      </div>

      {/* Breadcrumb / Footer */}
      <footer style={{ 
        height: '28px', 
        background: '#1d4ed8', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 16px',
        fontSize: '10px',
        fontWeight: 600,
        color: 'white',
        letterSpacing: '0.05em',
        justifyContent: 'space-between'
      }}>
        <div>SESSION: DHA-DHS-2026-X • {requirementsData.requirements.length} REQUIREMENTS PARSED</div>
        <div>ARIS PROTOCOL: ZERO_KNOWLEDGE_ACTIVE</div>
      </footer>
    </div>
  );
};

export default SamRep;
