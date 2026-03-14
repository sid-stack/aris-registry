import React from 'react';
import { Shield, Lock, Server, RefreshCw, BadgeCheck, FileShield, Database, Cpu } from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';

const ARIS_PROTOCOL_STEPS = [
  {
    icon: <Lock size={24} color="#818cf8" />,
    title: "Zero-Knowledge Vault",
    description: "Your raw solicitations and competitive technical data are never persisted. ARIS uses ephemeral RAM slots that exist only for the duration of the audit cycle."
  },
  {
    icon: <Server size={24} color="#818cf8" />,
    title: "Stateless Bridge",
    description: "Linguistic processing occurs over a stateless bridge. We route the logic but never store a single byte of your intellectual property in a permanent database."
  },
  {
    icon: <RefreshCw size={24} color="#818cf8" />,
    title: "Cryptographic Purge",
    description: "Upon session termination or task completion, a tiered cryptographic wipe is initiated across all processing buffers, ensuring zero data residue."
  },
  {
    icon: <Database size={24} color="#818cf8" />,
    title: "Sovereign Audit Trail",
    description: "Compliance matrices and risk reports are issued directly to the client's local session. ARIS does not maintain copies of generated intelligence."
  }
];

const Security = ({ onBack }) => {
  return (
    <div style={{ backgroundColor: '#09090b', color: '#a1a1aa', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <NavBar onBack={onBack} />
      
      <main style={{ flex: 1, padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#1e1b4b', border: '1px solid #312e81', borderRadius: '999px', marginBottom: '24px' }}>
            <BadgeCheck size={14} color="#818cf8" />
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#818cf8', letterSpacing: '0.1em' }}>DEFENSE-GRADE SECURITY</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#f4f4f5', marginBottom: '20px', letterSpacing: '-0.02em' }}>
            The ARIS Security Protocol
          </h1>
          <p style={{ fontSize: '18px', color: '#71717a', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
            Engineered for Federal Primes. We didn't just build an AI tool—we built a <strong>Stateless Execution Layer</strong> that makes data spills architecturally impossible.
          </p>
        </section>

        {/* The Protocol Grid */}
        <section style={{ marginBottom: '100px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {ARIS_PROTOCOL_STEPS.map((step, i) => (
              <div key={i} style={{ padding: '32px', background: '#0c0c0e', border: '1px solid #1a1a1a', borderRadius: '12px', transition: 'transform 0.2s' }}>
                <div style={{ marginBottom: '20px' }}>{step.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f4f4f5', marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: '#71717a', lineHeight: 1.6 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Deep Dive */}
        <section style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '16px', padding: '48px', position: 'relative', overflow: 'hidden', marginBottom: '80px' }}>
           <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1 }}>
             <Shield size={300} color="#27272a" strokeWidth={0.5} />
           </div>
           
           <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#f4f4f5', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <Cpu size={20} color="#818cf8" />
             Infrastructure & Compliance
           </h2>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
             <div>
               <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#52525b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Data Sovereignty</h4>
               <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.7 }}>
                 ARIS operates on a <strong>Local-Out</strong> principle. All generated compliance matrices and technical narratives are streamed via WebSocket to your session for manual download. No "Master Database" of contractor intelligence exists to be breached.
               </p>
             </div>
             <div>
               <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#52525b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Compliance Roadmap</h4>
               <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {[
                   "SOC 2 Type II (Designated Audit Period)",
                   "NIST 800-171 Revision 2 Compliance",
                   "CMMC 2.0 Level 2 Self-Assessment Ready",
                   "FedRAMP High Processing Alignment"
                 ].map((item, i) => (
                   <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#d4d4d8' }}>
                     <BadgeCheck size={14} color="#22c55e" />
                     {item}
                   </li>
                 ))}
               </ul>
             </div>
           </div>
        </section>

        {/* Footer CTA */}
        <section style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid #1a1a1a' }}>
           <p style={{ fontSize: '14px', color: '#71717a', marginBottom: '24px' }}>
             Concerned about data handling requirements? Speak with our Chief Security Architect.
           </p>
           <a 
            href="mailto:sid@bidsmith.pro?subject=Security%20Protocol%20Inquiry"
            style={{ 
              display: 'inline-block',
              padding: '12px 32px', 
              background: '#f4f4f5', 
              color: '#09090b', 
              borderRadius: '6px', 
              fontSize: '14px', 
              fontWeight: 700, 
              textDecoration: 'none' 
            }}
          >
             Request Security Whitepaper
           </a>
        </section>
      </main>

      <footer style={{ height: '32px', borderTop: '1px solid #1a1a1a', background: '#09090b', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '9px', color: '#3f3f46', fontWeight: 600 }}>SECURITY_VERSION: 3.4.0 • PROTOCOL: STATELESS_BRIDGE</div>
        <div style={{ display: 'flex', gap: '24px' }}>
           <span style={{ fontSize: '9px', color: '#3f3f46' }}>AES-256-GCM ENCRYPTED</span>
           <span style={{ fontSize: '9px', color: '#3f3f46' }}>SOC_READY: OK</span>
        </div>
      </footer>
    </div>
  );
};

export default Security;
