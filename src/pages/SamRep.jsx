import React, { useState, useEffect } from 'react';
import { 
  Panel, 
  PanelGroup, 
  PanelResizeHandle 
} from "react-resizable-panels";
import { 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  Zap, 
  Shield, 
  Activity, 
  Layers,
  Layout
} from 'lucide-react';
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

const SectionHeader = ({ title }) => (
  <div className="section-header">
    <span className="section-title">{title}</span>
    <div className="section-line" />
  </div>
);

const ConsolePanel = ({ isOpen, onToggle }) => (
  <div className="studio-console" style={{ height: isOpen ? '160px' : '32px' }}>
    <div className="console-header" onClick={onToggle}>
      <div className="console-title">
        <Terminal size={12} />
        <span>AGENTIC LOGS</span>
        <div style={{ marginLeft: '12px', color: '#312e81', background: '#1e1b4b', padding: '1px 6px', borderRadius: '2px', fontSize: '9px' }}>
          CONNECTED: PIPELINE_7
        </div>
      </div>
      {isOpen ? <ChevronDown size={14} color="#52525b" /> : <ChevronUp size={14} color="#52525b" />}
    </div>
    {isOpen && (
      <div style={{ padding: '12px 16px', fontSize: '11px', fontFamily: 'Space Mono, monospace', color: '#71717a', height: '120px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#3b82f6' }}>[09:21:04]</span> INITIALIZING_ANALYSIS: DHA_VIDEO_ARCHIVE...</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#3b82f6' }}>[09:21:08]</span> PARSING_PDF: 142 clauses identified.</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#3b82f6' }}>[09:21:12]</span> EXTRACTING_RISKS: 14 critical deviations flagged.</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#22c55e' }}>[09:21:20]</span> MATRIX_GENERATION_COMPLETE.</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#3b82f6' }}>[09:21:25]</span> AGENT_REVIEW: Evaluating Section M alignment.</div>
        <div style={{ color: '#a1a1aa' }}>_ pipeline idle. awaiting user input.</div>
      </div>
    )}
  </div>
);

const SamRep = ({ onBack }) => {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('bs-theme') || 'dark'; } catch { return 'dark'; }
  });

  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('bs-theme', theme); } catch {}
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [theme]);

  const [loading, setLoading] = useState(false);
  const [complianceData, setComplianceData] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const totalRequirements = requirementsData.metadata.total_requirements;
  const highRiskCount = requirementsData.requirements.filter(r => r.severity === 'High' || r.severity === 'Critical').length;
  const criticalCount = requirementsData.requirements.filter(r => r.severity === 'Critical').length;

  const isMobile = windowWidth < 768;

  const handleRequirementSelect = (req) => {
    setSelectedReq(req);
    // Auto-open console or workbench if needed
  };

  return (
    <div
      id="dashboard-content"
      data-theme={theme}
      style={{ backgroundColor: '#09090b', color: '#a1a1aa', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <NavBar theme={theme} onToggleTheme={toggleTheme} onBack={onBack} />

      {/* ── Studio Toolbar ── */}
      <div className="sam-rep-masthead" style={{ borderBottom: '1px solid #1a1a1a', padding: '10px 24px', background: '#09090b', height: '52px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: '#1e1b4b', borderRadius: '4px', border: '1px solid #312e81' }}>
                <Activity size={12} color="#818cf8" />
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: '#52525b' }}>STUDIO v1.1</span>
                <div style={{ fontSize: '11px', color: '#d4d4d8', fontWeight: 500, lineHeight: 1 }}>DHA Video Imaging Archive</div>
              </div>
            </div>
            
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
               <div style={{ height: '24px', width: '1px', background: '#1a1a1a' }} />
               <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '9px', color: '#3f3f46', letterSpacing: '0.05em' }}>PIPELINE STATUS</span>
                    <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 600, fontFamily: 'Space Mono' }}>AGENTIC_ACTIVE (0.83s)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '9px', color: '#3f3f46', letterSpacing: '0.05em' }}>COVERAGE</span>
                    <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 600, fontFamily: 'Space Mono' }}>{totalRequirements} CLAUSES</span>
                  </div>
               </div>
            </div>
            <SecurityToggle />
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0c0c0e', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
             <Shield size={10} color="#3b82f6" />
             <span style={{ fontSize: '9px', color: '#71717a', letterSpacing: '0.05em' }}>ENCRYPTED SESSION</span>
          </div>
          <ExportToolbar />
        </div>
      </div>

      <div className="aris-studio-workspace" style={{ flex: 1, position: 'relative' }}>
        <PanelGroup direction={isMobile ? "vertical" : "horizontal"}>
          {/* Pane 1: Requirements Linter (Left) */}
          <Panel defaultSize={20} minSize={15} collapsible={true}>
            <aside className="studio-pane studio-linter-pane">
              <RequirementsLinter 
                requirements={requirementsData.requirements} 
                onSelect={handleRequirementSelect}
                selectedId={selectedReq?.id}
              />
            </aside>
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          {/* Pane 2: Audit Canvas (Center) */}
          <Panel defaultSize={55} minSize={30}>
            <main className="studio-pane studio-canvas">
              <div className="canvas-content">
                <SectionHeader title="Solicitation Brief" />
                <div className="sam-rep-grid grid-overview" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

                <SectionHeader title="Compliance & Constraints" />
                <div style={{ marginBottom: '32px' }}>
                  <ComplianceMatrix complianceData={complianceData} isLoading={loading} />
                </div>

                <SectionHeader title="Intelligence Pipeline" />
                <div className="sam-rep-grid grid-intelligence" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                  <AgenticPipeline />
                  <IntelligenceIndex />
                </div>

                <div style={{ marginTop: '48px', opacity: 0.6 }}>
                   <SectionHeader title="System Verification" />
                   <div className="sam-rep-grid grid-verification" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                     <VerificationGrid />
                     <RiskHeatmap />
                   </div>
                </div>
              </div>
              <div style={{ height: '40px' }} /> {/* Guard for console */}
            </main>
            <ConsolePanel 
              isOpen={isConsoleOpen} 
              onToggle={() => setIsConsoleOpen(!isConsoleOpen)} 
            />
          </Panel>

          <PanelResizeHandle className="resize-handle" />

          {/* Pane 3: Studio Workbench (Right) */}
          <Panel defaultSize={25} minSize={20} collapsible={true}>
            <aside className="studio-pane studio-workbench-pane">
               <ARISChat selectedContext={selectedReq} />
            </aside>
          </Panel>
        </PanelGroup>
      </div>

      <footer style={{ 
        height: '28px', 
        background: '#09090b', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 16px',
        fontSize: '9px',
        fontWeight: 600,
        color: '#3f3f46',
        letterSpacing: '0.05em',
        justifyContent: 'space-between',
        borderTop: '1px solid #1a1a1a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={10} color="#22c55e" />
            <span>LIVE: PIPELINE_ONLINE</span>
          </div>
          <div style={{ color: '#27272a' }}>|</div>
          <div>SESSION: {totalRequirements} REQUIREMENTS PARSED</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>MEM: 124MB</div>
          <div style={{ color: '#312e81' }}>ZERO_KNOWLEDGE_VAULT: ACTIVE</div>
        </div>
      </footer>
    </div>
  );
};

export default SamRep;
