/**
 * /demo — Interactive BidSmith FAANG-Level Showcase.
 * Pre-canned audit result that animates realistically.
 * Zero-knowledge architecture demonstration.
 */
import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Zap, 
  FileText, 
  Lock,
  Search,
  Activity
} from "lucide-react";

const DEMO_SAM_URL = "https://sam.gov/opp/a8f9c2d1b3e74f5a9c0d2e1f3b4a5c6d/view";
const DEMO_SOLICITATION = {
  id: "W912DY-24-R-0012",
  title: "Cyber Security Operations Center (CSOC) Support Services",
  agency: "U.S. Army Corps of Engineers",
  value: "$24.5M",
  setAside: "Total Small Business",
  responseDate: "April 18, 2026",
  naics: "541519",
};

const DEMO_COMPLIANCE = [
  {
    category: "Set-Aside Eligibility",
    verdict: "DISQUALIFIER",
    risk: 96,
    description: "Total Small Business set-aside — offeror must qualify as small under NAICS 541519.",
    sourceSnippet: "This acquisition is set aside 100% for Small Business concerns. Offers from other than small business concerns will not be considered.",
    sectionRef: "Section B.1, Page 4",
  },
  {
    category: "Security Clearance",
    verdict: "DISQUALIFIER",
    risk: 91,
    description: "Minimum Secret clearance required for all key personnel.",
    sourceSnippet: "All contractor personnel requiring access to classified information shall possess, at minimum, an active Secret security clearance.",
    sectionRef: "Section H.4, Page 19",
  },
  {
    category: "Past Performance",
    verdict: "WARNING",
    risk: 74,
    description: "Requires 3 relevant contracts within 5 years of similar size/scope.",
    sourceSnippet: "Offerors shall provide a minimum of three (3) recent and relevant past performance references within the last five (5) years.",
    sectionRef: "Section M, Page 31",
  },
  {
    category: "CMMC Level 2",
    verdict: "WARNING",
    risk: 68,
    description: "DFARS 252.204-7021 requires CMMC Level 2 certification.",
    sourceSnippet: "The contractor shall have a current CMMC Level 2 certification or an approved Plan of Action and Milestones (POA&M).",
    sectionRef: "Section I — DFARS 252.204-7021",
  }
];

const LOG_STEPS = [
  { ms: 0,    text: "Initializing secure session...", type: "info" },
  { ms: 300,  text: "FETCH: sam.gov/notice/W912DY-24-R-0012", type: "info" },
  { ms: 700,  text: "DECRYPT: Solicitation payload (3 attachments)", type: "success" },
  { ms: 1200, text: "SHRED: Section L Instructions extracted", type: "info" },
  { ms: 1600, text: "SHRED: Section M Evaluation criteria extracted", type: "info" },
  { ms: 2100, text: "FLAG: DISQUALIFIER (Set-Aside Eligibility)", type: "error" },
  { ms: 2500, text: "FLAG: DISQUALIFIER (Security Clearance)", type: "error" },
  { ms: 3000, text: "MAPPING: Citations to FAR/DFARS library", type: "info" },
  { ms: 3500, text: "GENERATING: Final Bid Decision Matrix", type: "info" },
  { ms: 4000, text: "AUDIT COMPLETE: 2 Disqualifiers detected", type: "success" },
];

export default function Demo({ onBack, onEnterApp }) {
  const [phase, setPhase] = useState("idle"); 
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(0);
  const logsRef = useRef(null);

  const startDemo = () => {
    setPhase("running");
    setLogs([]);
    setProgress(0);

    LOG_STEPS.forEach(({ ms, text, type }) => {
      setTimeout(() => {
        setLogs(prev => [...prev, { text, type }]);
        setProgress(Math.round((ms / 4000) * 100));
        if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }, ms);
    });

    setTimeout(() => {
      setPhase("done");
      setProgress(100);
    }, 4500);
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLeft}>
            <button onClick={onBack} style={s.backLink}>
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div style={s.divider} />
            <div style={s.logo}>BidSmith <span style={{fontWeight: 400, opacity: 0.6}}>PRO</span></div>
          </div>
          <div style={s.navRight}>
            <div style={s.secureBadge}><Shield size={12} /> SECURE SANDBOX</div>
            <button onClick={onEnterApp} style={s.navBtn}>LAUNCH WORKSPACE</button>
          </div>
        </div>
      </nav>

      <main style={s.container}>
        <header style={s.hero}>
          <div style={s.badge}>INSTITUTIONAL DEMO_v4</div>
          <h1 style={s.h1}>Audit any Federal RFP in <span style={s.accent}>90 Seconds</span></h1>
          <p style={s.lead}>Watch our agentic engine shred an active $24.5M Army solicitation, map every risk, and cite verbatim evidence.</p>
        </header>

        <section style={s.demoFrame}>
          {/* Internal Browser Frame */}
          <div style={s.window}>
            <div style={s.windowHeader}>
              <div style={s.dots}>
                <div style={{...s.dot, background: '#FF5F57'}} />
                <div style={{...s.dot, background: '#FFBD2E'}} />
                <div style={{...s.dot, background: '#28C840'}} />
              </div>
              <div style={s.addressBar}>
                <Lock size={10} color="#64748B" />
                <span>aris.protocol/audit/W912DY-24-R-0012</span>
              </div>
            </div>

            <div style={s.windowBody}>
              {/* Solicitation Info */}
              <div style={s.solCard}>
                <div style={s.solMain}>
                  <div style={s.solId}>{DEMO_SOLICITATION.id}</div>
                  <div style={s.solTitle}>{DEMO_SOLICITATION.title}</div>
                  <div style={s.solAgency}>{DEMO_SOLICITATION.agency}</div>
                </div>
                <div style={s.solStats}>
                  <div style={s.solStat}><span style={s.sl}>VALUE</span><span style={s.sv}>{DEMO_SOLICITATION.value}</span></div>
                  <div style={s.solStat}><span style={s.sl}>SET-ASIDE</span><span style={s.sv}>{DEMO_SOLICITATION.setAside}</span></div>
                  <div style={s.solStat}><span style={s.sl}>DUE</span><span style={s.sv}>{DEMO_SOLICITATION.responseDate}</span></div>
                </div>
              </div>

              {/* Action Bar */}
              <div style={s.actionBar}>
                <div style={s.urlDisplay}>
                  <Search size={14} color="#94A3B8" />
                  <span>{DEMO_SAM_URL}</span>
                </div>
                {phase === 'idle' && (
                  <button onClick={startDemo} style={s.runBtn}>
                    <Zap size={16} fill="white" /> RUN PROTOCOL
                  </button>
                )}
                {phase === 'running' && (
                  <div style={s.statusBadge}>
                    <Activity size={14} className="animate-pulse" /> ANALYZING...
                  </div>
                )}
                {phase === 'done' && (
                  <div style={{...s.statusBadge, color: '#10B981', background: '#F0FDF4', border: '1px solid #BBF7D0'}}>
                    <CheckCircle size={14} /> COMPLETE
                  </div>
                )}
              </div>

              {/* Processing Layer */}
              {phase !== 'idle' && (
                <div style={s.processing}>
                  <div style={s.terminal}>
                    {logs.map((log, i) => (
                      <div key={i} style={{...s.log, color: log.type === 'error' ? '#EF4444' : log.type === 'success' ? '#10B981' : '#E2E8F0'}}>
                        <span style={s.logTime}>[{new Date().toLocaleTimeString([], {hour12: false})}]</span> {log.text}
                      </div>
                    ))}
                    {phase === 'running' && <div style={s.logCursor}>_</div>}
                  </div>
                  <div style={s.progressContainer}>
                    <div style={{...s.progressBar, width: `${progress}%`}} />
                  </div>
                </div>
              )}

              {/* Results Layer */}
              {phase === 'done' && (
                <div style={s.results}>
                  <div style={s.statLine}>
                    Extracted 47 requirements • 6 high-risk • 3 missing
                  </div>
                  <div style={s.resultHeader}>
                    <div style={s.verdictBox}>
                      <div style={s.verdictLabel}>AUDIT VERDICT</div>
                      <div style={s.verdictValue}>NO-GO</div>
                    </div>
                    <div style={s.dividerV} />
                    <div style={s.riskBox}>
                      <div style={s.verdictLabel}>RISK SCORE</div>
                      <div style={s.riskValue}>91<span style={{fontSize: '1rem', fontWeight: 400}}>/100</span></div>
                    </div>
                  </div>

                  <div style={s.findingsGrid}>
                    {DEMO_COMPLIANCE.map((item, i) => (
                      <div 
                        key={i} 
                        style={{...s.findingCard, borderLeft: `4px solid ${item.verdict === 'DISQUALIFIER' ? '#EF4444' : '#F59E0B'}`, background: expanded === i ? '#F8FAFC' : '#FFF'}}
                        onClick={() => setExpanded(i)}
                      >
                        <div style={s.findingHeader}>
                          <div style={s.findingTitle}>{item.category}</div>
                          {item.verdict === 'DISQUALIFIER' ? <XCircle size={16} color="#EF4444" /> : <AlertTriangle size={16} color="#F59E0B" />}
                        </div>
                        <div style={s.findingDesc}>{item.description}</div>
                        {expanded === i && (
                          <div style={s.evidence}>
                            <div style={s.evidenceLabel}>VERBATIM EVIDENCE (SECTION M)</div>
                            <blockquote style={s.quote}>"{item.sourceSnippet}"</blockquote>
                            <div style={s.evidenceFooter}>Source: {item.sectionRef}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Final CTA - Removed Broken Button as requested by user */}
      </main>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#FFFFFF',
    color: '#002244',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serifStyles',
  },
  nav: {
    height: '64px',
    borderBottom: '1px solid #E2E8F0',
    background: '#FFFFFF',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  divider: { width: '1px', height: '24px', background: '#E2E8F0' },
  backLink: { 
    background: 'none', 
    border: 'none', 
    color: '#64748B', 
    fontWeight: 600, 
    fontSize: '14px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
    cursor: 'pointer'
  },
  logo: { fontWeight: 900, letterSpacing: '-0.02em', fontSize: '18px', color: '#002244' },
  navRight: { display: 'flex', alignItems: 'center', gap: '24px' },
  secureBadge: { 
    fontSize: '10px', 
    fontWeight: 800, 
    color: '#002244', 
    background: '#F1F5F9', 
    padding: '4px 8px', 
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    letterSpacing: '0.05em'
  },
  navBtn: { 
    background: '#002244', 
    color: '#FFF', 
    border: 'none', 
    padding: '8px 16px', 
    borderRadius: '6px', 
    fontSize: '12px', 
    fontWeight: 700,
    cursor: 'pointer'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 24px',
  },
  hero: { textAlign: 'center', marginBottom: '64px' },
  badge: { fontSize: '12px', fontWeight: 800, color: '#64748B', letterSpacing: '0.15em', marginBottom: '16px' },
  h1: { fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 24px', lineHeight: 1 },
  accent: { color: '#2563EB' },
  lead: { fontSize: '1.25rem', color: '#475569', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 },
  demoFrame: { width: '100%', maxWidth: '1000px', margin: '0 auto' },
  window: {
    background: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 40px 100px rgba(0,34,68,0.12)',
    overflow: 'hidden'
  },
  windowHeader: {
    height: '48px',
    background: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    position: 'relative'
  },
  dots: { display: 'flex', gap: '8px' },
  dot: { width: '12px', height: '12px', borderRadius: '50%' },
  addressBar: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '4px 12px',
    fontSize: '11px',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '300px',
    justifyContent: 'center'
  },
  windowBody: { padding: '32px' },
  solCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  solId: { fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.1em' },
  solTitle: { fontSize: '18px', fontWeight: 900, color: '#002244', marginTop: '4px', marginBottom: '4px' },
  solAgency: { fontSize: '13px', color: '#64748B' },
  solStats: { display: 'flex', gap: '32px' },
  solStat: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sl: { fontSize: '9px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em' },
  sv: { fontSize: '13px', fontWeight: 700, color: '#002244' },
  actionBar: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '32px'
  },
  urlDisplay: {
    flex: 1,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#002244',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },
  runBtn: {
    background: '#002244',
    color: '#FFF',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'transform 0.1s'
  },
  statusBadge: {
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#2563EB',
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  processing: {
    marginBottom: '32px'
  },
  terminal: {
    background: '#001A33',
    borderRadius: '8px 8px 0 0',
    padding: '20px',
    fontFamily: 'monospace',
    height: '160px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  log: { fontSize: '12px', lineHeight: 1.4 },
  logTime: { opacity: 0.4 },
  logCursor: { fontSize: '14px', color: '#FFF', animation: 'blink 1s infinite' },
  progressContainer: {
    height: '4px',
    background: '#002D59',
    borderRadius: '0 0 8px 8px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    background: '#2563EB',
    transition: 'width 0.3s ease-out'
  },
  results: {
    animation: 'fadeIn 0.5s ease-out'
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px'
  },
  verdictBox: { flex: 1 },
  verdictLabel: { fontSize: '10px', fontWeight: 800, color: '#EF4444', letterSpacing: '0.1em', marginBottom: '4px' },
  verdictValue: { fontSize: '32px', fontWeight: 900, color: '#EF4444' },
  dividerV: { width: '1px', height: '60px', background: '#FECACA' },
  riskBox: { flex: 1, textAlign: 'right' },
  riskValue: { fontSize: '32px', fontWeight: 900, color: '#EF4444' },
  findingsGrid: {
    display: 'grid',
    gap: '16px'
  },
  findingCard: {
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  findingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  findingTitle: { fontSize: '16px', fontWeight: 800, color: '#002244' },
  findingDesc: { fontSize: '14px', color: '#475569', lineHeight: 1.5 },
  evidence: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #E2E8F0',
    animation: 'slideDown 0.3s ease-out'
  },
  evidenceLabel: { fontSize: '10px', fontWeight: 800, color: '#64748B', marginBottom: '12px' },
  quote: {
    margin: 0,
    fontSize: '13px',
    color: '#002244',
    fontStyle: 'italic',
    lineHeight: 1.6,
    padding: '12px 16px',
    background: '#F8FAFC',
    borderLeft: '4px solid #CBD5E1',
    borderRadius: '0 8px 8px 0',
    marginBottom: '12px'
  },
  evidenceFooter: { fontSize: '11px', color: '#94A3B8', fontWeight: 600 },
  footerCta: {
    textAlign: 'center',
    marginTop: '64px',
    padding: '48px',
    background: '#F8FAFC',
    borderRadius: '24px',
    border: '1px solid #E2E8F0'
  },
  footerH2: { fontSize: '24px', fontWeight: 900, marginBottom: '24px' },
  finalBtn: {
    background: '#002244',
    color: '#FFF',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 10px 30px rgba(0,34,68,0.2)'
  },
  statLine: {
    padding: '12px 16px',
    background: '#F1F5F9',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 800,
    color: '#0B3D91',
    textAlign: 'center',
    marginBottom: '24px',
    border: '1px solid #E2E8F0',
    letterSpacing: '0.02em',
  },
};
