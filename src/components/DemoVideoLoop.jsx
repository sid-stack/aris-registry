import { useEffect, useState } from "react";
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Terminal, 
  ArrowRight,
  Globe,
  Loader2,
  Clock
} from "lucide-react";

export default function DemoVideoLoop() {
  const [step, setStep] = useState(-1);

  // States: 
  // -1: The Pain (Messy PDF Scroll)
  // 0: The Hook (Input)
  // 1: The Magic (Shredding)
  // 2: The Value (Matrix)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 6000); // 6 seconds per step to allow more 'Draft' reading time
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.container}>
      {/* Browser Decoration */}
      <div style={styles.browserHeader}>
        <div style={styles.controls}>
          <div style={{...styles.dot, background: '#ff5f56'}} />
          <div style={{...styles.dot, background: '#ffbd2e'}} />
          <div style={{...styles.dot, background: '#27c93f'}} />
        </div>
        <div style={styles.addressBar}>aris.labs.audit/session/v2.1</div>
      </div>

      <div style={styles.viewport}>
        {step === -1 && (
          <div style={styles.stepContent} className="fade-in">
             <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={styles.pdfBadge}>SOLICITATION_FINAL.PDF</div>
                <div className="pdf-scroll" style={{ fontSize: '9px', lineHeight: 1.6, fontFamily: 'serif', paddingRight: '40px' }}>
                    <p style={{fontWeight: 900, fontSize: '12px', marginBottom: '16px'}}>SECTION L - INSTRUCTIONS TO OFFERORS</p>
                    <p>L.1.1 Overview. The contractor shall provide all personnel, equipment, supplies, etc...</p>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', padding: '8px', margin: '12px 0' }}>
                        L.2.4 The contractor shall possess a valid Top Secret facility clearance...
                    </div>
                    <p>L.3.1 Technical Volume Requirements. Failure to comply leads to disqualification...</p>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', padding: '8px', margin: '12px 0' }}>
                        L.4.2 The contractor must provide evidence of NIST 800-171 compliance...
                    </div>
                    <p>L.5.1 Page Limits. The Technical Volume shall not exceed 50 pages...</p>
                    <p>L.6.1 Submission. Proposals shall be submitted no later than 2:00 PM EST...</p>
                </div>
                <div style={styles.manualOverlay}>
                    <Clock size={16} /> 20+ HOURS REMAINING
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(255,255,255,0), #fff)', pointerEvents: 'none' }} />
             </div>
          </div>
        )}

        {step === 0 && (
          <div style={styles.stepContent} className="fade-in">
            <div style={styles.centerBox}>
              <div style={styles.badge}>INSTANT INGESTION</div>
              <h3 style={styles.stepTitle}>Drag RFP or Paste Link</h3>
              <div style={styles.activeInput}>
                <Globe size={18} color="#2563eb" />
                <span style={{color: '#0f172a'}}>sam.gov/opp/rtm-extraction-v1...</span>
                <div className="pulse-dot" />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={styles.stepContent} className="fade-in">
             <div style={styles.splitTransform}>
                <div style={styles.transformLeft}>
                    <div style={styles.pdfMini}>
                        <div style={{height: 10, width: '80%', background: '#e2e8f0', marginBottom: 6}} />
                        <div style={{height: 10, width: '100%', background: '#ff4d4d20', marginBottom: 6, borderLeft: '2px solid #ff4d4d'}} />
                        <div style={{height: 10, width: '90%', background: '#e2e8f0', marginBottom: 6}} />
                        <div style={{height: 10, width: '60%', background: '#e2e8f0', marginBottom: 6}} />
                    </div>
                </div>
                <div className="laser-line" />
                <div style={styles.transformRight}>
                    <div style={styles.matrixMini}>
                        <div style={styles.miniRow}><div style={styles.miniDot} /> <div style={styles.miniBar} /></div>
                        <div style={{...styles.miniRow, opacity: 0.5}}><div style={styles.miniDot} /> <div style={styles.miniBar} /></div>
                    </div>
                </div>
             </div>
             <div style={styles.terminalStatus}>
                <Loader2 size={14} className="animate-spin" />
                <span>SHREDDING_SECTION_L_REQUIREMENTS...</span>
             </div>
          </div>
        )}

        {step === 2 && (
          <div style={styles.stepContent} className="fade-in">
            <div style={styles.resultBox}>
              <div style={styles.resultHeader}>
                <div style={styles.resultStats}>
                    <div style={styles.scoreCircle}>84</div>
                    <div style={{fontSize: '11px', fontWeight: 900, color: '#ef4444'}}>TS/SCI_REQUIRED</div>
                </div>
                <div style={styles.resultMeta}>
                    <div style={styles.badge}>RFP_QUALIFIED</div>
                </div>
              </div>

              <div style={styles.matrixPreview}>
                <div className="matrix-slide-in" style={{...styles.matrixRow, animationDelay: '0.1s'}}>
                  <AlertTriangle size={14} color="#ef4444" />
                  <div style={styles.matrixText}>L.4.2 Security Clearance (TS/SCI)</div>
                  <div style={styles.matrixTag}>CRITICAL</div>
                </div>
                <div className="matrix-slide-in" style={{...styles.matrixRow, animationDelay: '0.2s'}}>
                  <CheckCircle size={14} color="#10b981" />
                  <div style={styles.matrixText}>M.2.1 Technical Approach Validation</div>
                  <div style={styles.matrixTag}>PASS</div>
                </div>
                <li className="matrix-slide-in" style={{...styles.matrixRow, animationDelay: '0.3s', listStyle: 'none'}}>
                  <AlertTriangle size={14} color="#f59e0b" />
                  <div style={styles.matrixText}>FAR 52.222-2 Payment for Overtime</div>
                  <div style={styles.matrixTag}>WARN</div>
                </li>
                <div className="matrix-slide-in" style={{...styles.matrixRow, animationDelay: '0.4s'}}>
                  <CheckCircle size={14} color="#10b981" />
                  <div style={styles.matrixText}>L.6.3 Past Performance References</div>
                  <div style={styles.matrixTag}>PASS</div>
                </div>
              </div>

              <div style={styles.lethalOverlay}>
                62 Requirements Found • 9 High-risk identified
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.stepContent} className="fade-in">
            <div style={{ ...styles.centerBox, padding: '20px' }}>
              <div style={styles.badge}>AUTONOMOUS DRAFTING</div>
              <h3 style={{ ...styles.stepTitle, fontSize: '20px' }}>Generating Final Proposal</h3>
              
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', textAlign: 'left', fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#38bdf8', marginBottom: '20px' }}>
                <p>{">"} INITIATING_DRAFT_VOLUME_I</p>
                <p>{">"} MAPPING_SECTION_L_TO_CRITERIA_M</p>
                <p style={{ color: '#fff' }}>[PROPOSAL_READY] Technical_Approach_v1.docx</p>
              </div>

              <button style={{ ...styles.heroBtn, width: '100%', padding: '12px', fontSize: '14px', borderRadius: '8px', cursor: 'default' }}>
                Download Proposal Package <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scroll {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        .pdf-scroll {
          animation: scroll 15s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
        .fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .pdf-scroll { animation: pdfScroll 20s linear infinite; }
        .laser-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #67e8f9;
          box-shadow: 0 0 15px #67e8f9;
          left: -100px;
          animation: laserMove 5s infinite;
          z-index: 5;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #2563eb;
          border-radius: 50%;
          margin-left: auto;
          animation: pulse 1.5s infinite;
        }
        .matrix-slide-in {
           opacity: 0;
           animation: slideIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pdfScroll { from { transform: translateY(0); } to { transform: translateY(-70%); } }
        @keyframes laserMove { 
          0% { left: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); } 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '540px',
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    position: 'relative',
    margin: '0 auto',
    fontFamily: "'Inter', sans-serif"
  },
  pdfBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '9px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 900,
    zIndex: 2,
    letterSpacing: '0.05em'
  },
  manualOverlay: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#ef4444',
    color: '#fff',
    fontSize: '10px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: 900,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)',
    zIndex: 10
  },
  browserHeader: {
    height: '44px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px'
  },
  controls: { display: 'flex', gap: '6px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%' },
  addressBar: {
    flex: 1,
    background: '#ffffff',
    height: '24px',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    fontFamily: 'JetBrains Mono, monospace',
    border: '1px solid #e2e8f0'
  },
  viewport: {
    height: '380px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#fcfcfd'
  },
  stepContent: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  centerBox: { textAlign: 'center' },
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    background: 'rgba(37, 99, 235, 0.05)',
    color: '#2563eb',
    fontSize: '10px',
    fontWeight: 800,
    borderRadius: '6px',
    letterSpacing: '0.1em',
    marginBottom: '20px'
  },
  stepTitle: { fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '32px', letterSpacing: '-0.02em' },
  activeInput: {
    background: '#fff',
    border: '2px solid #2563eb',
    borderRadius: '12px',
    padding: '16px 20px',
    fontSize: '14px',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    maxWidth: '420px',
    margin: '0 auto',
    boxShadow: '0 10px 30px rgba(37, 99, 235, 0.1)',
    fontWeight: 600
  },
  splitTransform: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2px',
    height: '180px',
    background: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    position: 'relative',
    overflow: 'hidden'
  },
  transformLeft: { padding: '20px', background: '#ffffff' },
  transformRight: { padding: '20px', background: 'rgba(37, 99, 235, 0.03)' },
  pdfMini: { display: 'flex', flexDirection: 'column', gap: '8px' },
  matrixMini: { display: 'flex', flexDirection: 'column', gap: '8px' },
  miniRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  miniDot: { width: 6, height: 6, borderRadius: '50%', background: '#2563eb' },
  miniBar: { height: 6, width: '70%', background: '#2563eb', opacity: 0.2, borderRadius: 3 },
  terminalStatus: {
    marginTop: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#2563eb',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono',
    fontWeight: 700,
    justifyContent: 'center'
  },
  resultBox: { background: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  resultStats: { display: 'flex', alignItems: 'center', gap: '12px' },
  resultMeta: { textAlign: 'right' },
  scoreCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid #ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 900,
    color: '#ef4444',
    boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)'
  },
  matrixPreview: { padding: '16px' },
  matrixRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#ffffff',
    borderRadius: '10px',
    marginBottom: '10px',
    border: '1px solid #e2e8f0'
  },
  matrixText: { fontSize: '12px', color: '#0f172a', flex: 1, fontWeight: 500 },
  matrixTag: { fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' },
  lethalOverlay: {
    padding: '16px',
    background: 'rgba(37, 99, 235, 0.05)',
    borderTop: '1px solid rgba(37, 99, 235, 0.1)',
    fontSize: '12px',
    fontWeight: 900,
    color: '#2563eb',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }
};
