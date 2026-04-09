import React from 'react';
import { Shield, CheckCircle, ArrowRight, Zap, FileText, Search } from 'lucide-react';

export default function RfpMatrixGenerator({ onUpload }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <main style={styles.page}>
      {/* SECTION 1: HERO */}
      <section style={styles.hero}>
        <div style={styles.badge}>FREE TOOL</div>
        <h1 style={styles.title}>Free RFP Compliance Matrix Generator</h1>
        <p style={styles.subtitle}>
          Turn any RFP into a structured compliance matrix instantly. 
          Save hours and avoid missing critical requirements.
        </p>
        <button style={styles.heroBtn} onClick={onUpload}>
          Upload RFP → Get Matrix
        </button>
      </section>

      {/* SECTION 2: EXPLANATION */}
      <section style={styles.explanation}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Why use an RFP compliance matrix generator?</h2>
          <p style={styles.text}>
            Reviewing RFPs manually is time-consuming and error-prone. 
            Missing a single requirement can disqualify your bid and waste weeks of proposal effort. 
            Our <strong>RFP compliance matrix generator</strong> automates the "shredding" process, 
            extracting every "shall", "must", and "will" statement in seconds.
          </p>
        </div>
      </section>

      {/* SECTION 3: DEMO EMBED */}
      <section style={styles.demoSection}>
        <div style={styles.videoCard}>
          <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            style={styles.video}
            poster="/assets/demo/video-poster.png"
          >
            <source src="/aris-demo.mp4" type="video/mp4" />
            <source src="/assets/demo/aris-demo.mp4" type="video/mp4" />
          </video>
          <div style={styles.videoCaption}>
            BidSmith RFP compliance matrix generator in action: 90-second extraction.
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section style={styles.howItWorks}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>How the Matrix Generator Works</h2>
          <div style={styles.stepsGrid}>
            <div style={styles.step}>
              <div style={styles.stepNum}>1</div>
              <h3>Upload RFP</h3>
              <p>Upload your solicitation PDF or paste a SAM.gov link.</p>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNum}>2</div>
              <h3>Extract Requirements</h3>
              <p>Our AI identifies every compliance trigger and FAR/DFARS clause.</p>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNum}>3</div>
              <h3>Get Compliance Matrix</h3>
              <p>Review and download your structured matrix immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: BENEFITS */}
      <section style={styles.benefits}>
        <div style={styles.container}>
           <div style={styles.benefitsGrid}>
              <div style={styles.benefitItem}>
                <Zap size={24} color="#0B3D91" />
                <h4>Save 20+ Hours</h4>
                <p>Stop manual shredding. Let the RFP compliance matrix generator do the heavy lifting.</p>
              </div>
              <div style={styles.benefitItem}>
                <Shield size={24} color="#16a34a" />
                <h4>Catch Hidden Risks</h4>
                <p>Detect high-risk clauses and missing certifications early in the bid cycle.</p>
              </div>
              <div style={styles.benefitItem}>
                <FileText size={24} color="#2563eb" />
                <h4>Export-Ready</h4>
                <p>Generate a professional matrix that is ready for your proposal team.</p>
              </div>
           </div>
        </div>
      </section>

      {/* SECTION 6: TOOL EMBED (Direct Upload) */}
      <section style={styles.toolEmbed}>
        <div style={styles.toolCard}>
          <h2 style={{ marginBottom: 16 }}>Ready to generate your matrix?</h2>
          <p style={{ marginBottom: 32, opacity: 0.8 }}>Upload your solicitation PDF to start the 90-second audit.</p>
          <button style={styles.uploadBtn} onClick={onUpload}>
            <Search size={20} /> Select RFP File
          </button>
        </div>
      </section>

      {/* SECTION 7: FINAL CTA */}
      <section style={styles.footerCta}>
        <h2 style={{ marginBottom: 24 }}>Try it now → Upload RFP</h2>
        <button style={styles.heroBtn} onClick={onUpload}>
          Launch Generator
        </button>
      </section>
    </main>
  );
}

const styles = {
  page: { background: '#fff', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  container: { maxWidth: '900px', margin: '0 auto', padding: '0 24px' },
  hero: { textAlign: 'center', padding: '100px 24px', background: '#f8fafc' },
  badge: { display: 'inline-block', padding: '6px 14px', background: '#0B3D91', color: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 800, marginBottom: 24 },
  title: { fontSize: '3.5rem', fontWeight: 900, color: '#0B3D91', marginBottom: 20, letterSpacing: '-0.03em' },
  subtitle: { fontSize: '1.25rem', color: '#475569', maxWidth: '640px', margin: '0 auto 40px', lineHeight: 1.6 },
  heroBtn: { padding: '20px 48px', background: '#0B3D91', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 20px 48px rgba(11,61,145,0.2)' },
  
  explanation: { padding: '80px 0', borderBottom: '1px solid #e2e8f0' },
  sectionTitle: { fontSize: '2.25rem', fontWeight: 800, color: '#0B3D91', marginBottom: 24, textAlign: 'center' },
  text: { fontSize: '1.15rem', color: '#475569', lineHeight: 1.8, textAlign: 'center' },

  demoSection: { padding: '80px 24px', background: '#f8fafc' },
  videoCard: { maxWidth: '1000px', margin: '0 auto', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 32px 64px rgba(0,0,0,0.1)' },
  video: { width: '100%', display: 'block' },
  videoCaption: { padding: '20px', textAlign: 'center', fontSize: '14px', color: '#64748b', background: '#fff' },

  howItWorks: { padding: '80px 0' },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', marginTop: 48 },
  step: { textAlign: 'center' },
  stepNum: { width: '48px', height: '48px', background: '#0B3D91', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.25rem', fontWeight: 900 },

  benefits: { padding: '80px 0', background: '#0B3D91', color: '#fff' },
  benefitsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '48px' },
  benefitItem: { textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px' },

  toolEmbed: { padding: '100px 24px', textAlign: 'center' },
  toolCard: { maxWidth: '700px', margin: '0 auto', padding: '64px', border: '2px dashed #e2e8f0', borderRadius: '32px', background: '#f8fafc' },
  uploadBtn: { padding: '16px 32px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 12 },

  footerCta: { padding: '100px 24px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }
};
