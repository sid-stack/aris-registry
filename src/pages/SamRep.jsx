import React, { useState, useEffect } from 'react';
import { 
  Panel, 
  PanelGroup, 
  PanelResizeHandle 
} from "react-resizable-panels";
import '../styles/Dashboard.css';
import './SamRep.css'; 

import NavBar from '../components/dashboard/NavBar';
import MetricsStrip from '../components/dashboard/MetricsStrip';
import RiskPanel from '../components/dashboard/RiskPanel';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';
import ExecutiveSummary from '../components/dashboard/ExecutiveSummary';
import BidRecommendation from '../components/dashboard/BidRecommendation';
import ExportToolbar from '../components/dashboard/ExportToolbar';
import SolicitationHeader from '../components/dashboard/SolicitationHeader';
import AgenticPipeline from '../components/dashboard/AgenticPipeline';
import IntelligenceIndex from '../components/dashboard/IntelligenceIndex';
import VerificationGrid from '../components/dashboard/VerificationGrid';
import ComplianceMatrix from '../components/dashboard/ComplianceMatrix';
import ARISChat from '../components/dashboard/ARISChat';
import RequirementsLinter from '../components/dashboard/RequirementsLinter';
import SecurityToggle from '../components/dashboard/SecurityToggle';

// Load static source of truth
import requirementsData from '../../requirements_matrix.json';

const SectionDivider = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 16px 0' }}>
    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#52525b' }}>{title}</span>
    <div style={{ flex: 1, height: '1px', background: '#1a1a1a' }} />
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

  const [loading, setLoading] = useState(false);
  const [complianceData, setComplianceData] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const totalRequirements = requirementsData.metadata.total_requirements;
  const highRiskCount = requirementsData.requirements.filter(r => r.severity === 'High' || r.severity === 'Critical').length;
  const criticalCount = requirementsData.requirements.filter(r => r.severity === 'Critical').length;

  return (
    <div
      id="dashboard-content"
      data-theme={theme}
      style={{ backgroundColor: '#09090b', color: '#a1a1aa', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <NavBar theme={theme} onToggleTheme={toggleTheme} onBack={onBack} />

      {/* ── Studio Toolbar ── */}
      <div className="sam-rep-masthead" style={{ borderBottom: '1px solid #1a1a1a', padding: '10px 24px', background: '#09090b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: '#52525b' }}>STUDIO v1.0</span>
              <div style={{ height: '12px', width: '1px', background: '#1a1a1a' }} />
              <span style={{ fontSize: '11px', color: '#d4d4d8', fontWeight: 500 }}>DHA Video Imaging Archive</span>
            </div>
            
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ height: '20px', width: '1px', background: '#1a1a1a' }} />
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                 <span style={{ fontSize: '10px', color: '#52525b' }}>PIPELINE:</span>
                 <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 600, fontFamily: 'monospace' }}>
                   {totalRequirements} CLS / {highRiskCount} RSK
                 </span>
               </div>
            </div>
            <SecurityToggle />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', padding: '4px 0', borderRadius: '4px' }}>
             <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#a1a1aa' }} />
             <span style={{ fontSize: '9px', color: '#52525b', letterSpacing: '0.1em' }}>PERSISTENCE: LOCAL_ONLY</span>
          </div>
          <ExportToolbar />
        </div>
      </div>

      <div className="aris-studio-workspace" style={{ flex: 1 }}>
        <PanelGroup direction="horizontal">
          {/* Pane 1: Requirements Linter (Left) */}
          <Panel defaultSize={20} minSize={15}>
            <aside className="studio-pane studio-linter-pane">
              <RequirementsLinter 
                requirements={requirementsData.requirements} 
                onSelect={setSelectedReq}
              />
            </aside>
          </Panel>

          <PanelResizeHandle style={{ width: '1px', background: '#1a1a1a', cursor: 'col-resize' }} />

          {/* Pane 2: Audit Canvas (Center) */}
          <Panel defaultSize={55} minSize={30}>
            <main className="studio-pane studio-canvas">
              <div className="sam-rep-main" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
                <SectionDivider title="Solicitation Intelligence" />
                <div className="sam-rep-grid grid-overview">
                  <div className="solicitation-risk-grid">
                    <SolicitationHeader 
                      title="DHA Video Imaging Archive"
                      id="DHANOISS022426"
                      agency="Defense Health Agency"
                    />
                    <RiskPanel />
                  </div>
                  <MetricsStrip 
                    analyzedCount={totalRequirements}
                    riskCount={highRiskCount}
                    criticalCount={criticalCount}
                  />
                </div>

                <SectionDivider title="Compliance Context" />
                <div style={{ marginBottom: '24px' }}>
                  <ComplianceMatrix complianceData={complianceData} isLoading={loading} />
                </div>

                <SectionDivider title="Agentic Pipeline Status" />
                <div className="sam-rep-grid grid-intelligence">
                  <AgenticPipeline />
                  <IntelligenceIndex />
                </div>

                <div style={{ marginTop: '40px', opacity: 0.5 }}>
                   <SectionDivider title="Security Verification" />
                   <div className="sam-rep-grid grid-verification">
                     <VerificationGrid />
                     <RiskHeatmap />
                   </div>
                </div>
              </div>
            </main>
          </Panel>

          <PanelResizeHandle style={{ width: '1px', background: '#1a1a1a', cursor: 'col-resize' }} />

          {/* Pane 3: Studio Workbench (Right) */}
          <Panel defaultSize={25} minSize={20}>
            <aside className="studio-pane studio-workbench-pane" style={{ background: '#09090b', height: '100%' }}>
               <ARISChat selectedContext={selectedReq} />
            </aside>
          </Panel>
        </PanelGroup>
      </div>

      <footer style={{ 
        height: '24px', 
        background: '#1a1a1a', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 16px',
        fontSize: '9px',
        fontWeight: 600,
        color: '#52525b',
        letterSpacing: '0.05em',
        justifyContent: 'space-between',
        borderTop: '1px solid #27272a'
      }}>
        <div>SESSION: {totalRequirements} REQUIREMENTS PARSED</div>
        <div>ARIS PROTOCOL: ZERO_KNOWLEDGE_ACTIVE</div>
      </footer>
    </div>
  );
};

export default SamRep;
