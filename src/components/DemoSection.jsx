import React from 'react';
import {
  Shield,
  CheckCircle,
  FileCheck,
  Zap,
  Lock,
  ArrowRight,
  Play
} from 'lucide-react';

export default function DemoSection({ onTryDemo }) {
  const videoRef = React.useRef(null);
  const [videoError, setVideoError] = React.useState(false);

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.demoWrapper}>
          <div style={styles.videoCard}>
            <div style={styles.videoHeader}>
              <div style={styles.dotRow}>
                <div style={{...styles.dot, background: '#ff5f56'}} />
                <div style={{...styles.dot, background: '#ffbd2e'}} />
                <div style={{...styles.dot, background: '#27c93f'}} />
              </div>
              <div style={styles.videoStatus}>
                <Shield size={12} color="#002244" />
                <span>LIVE SESSION: GOVCON_INTELLIGENCE_v4.5</span>
              </div>
            </div>

            <div style={styles.videoFrame}>
              {videoError ? (
                <div style={styles.videoFallback}>
                  <img
                    src="/assets/demo/video-poster.png"
                    alt="BidSmith audit workspace demo"
                    style={styles.posterImg}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <button style={styles.watchDemoBtn} onClick={onTryDemo}>
                    <span style={styles.playCircle}><Play size={20} color="#fff" /></span>
                    Launch Audit Engine
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/assets/demo/video-poster.png"
                  style={styles.video}
                  onError={() => setVideoError(true)}
                >
                  <source src="/assets/demo/aris-demo.mp4" type="video/mp4" />
                  <source src="/aris-demo.mp4" type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        </div>

        <div style={styles.header}>
          <div style={styles.badge}>INSTITUTIONAL GRADE • BUILT FOR FEDERAL CAPTURE</div>
          <h2 style={styles.title}>The Bid Acceleration Engine</h2>
          <p style={styles.subtitle}>
            Replace $5,000+ in proposal preparation with an institutional compliance matrix and risk assessment in 90 seconds.
          </p>
        </div>
   {/* Floating High-Conversion Features */}
          <div style={styles.featuresGrid}>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}><FileCheck size={20} color="#002244" /></div>
              <div>
                <h4 style={styles.featureTitle}>Shred Section L/M</h4>
                <p style={styles.featureDesc}>Instantly extract submission instructions and evaluation criteria.</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}><Lock size={20} color="#002244" /></div>
              <div>
                <h4 style={styles.featureTitle}>Zero-Knowledge</h4>
                <p style={styles.featureDesc}>Transient processing only. No data is stored, ever.</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}><Zap size={20} color="#002244" /></div>
              <div>
                <h4 style={styles.featureTitle}>90s Execution</h4>
                <p style={styles.featureDesc}>Save 40+ hours per bid cycle on manual requirement shredding.</p>
              </div>
            </div>
          </div>

        <div style={styles.ctaRow}>
           <button style={styles.mainCta} onClick={onTryDemo}>
             Start Your First Audit No-Cost <ArrowRight size={18} />
           </button>
           <p style={styles.ctaFootnote}>Trusted by over 450+ Federal Prime Contractors.</p>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: '100px 24px',
    background: '#ffffff', // Clean white for government tier
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '64px',
  },
  badge: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '0.1em',
    marginBottom: '16px',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 900,
    color: '#002244',
    letterSpacing: '-0.02em',
    marginBottom: '20px',
    margin: 0,
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#475569',
    lineHeight: 1.6,
    margin: 0,
  },
  demoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
    alignItems: 'center',
  },
  videoCard: {
    width: '100%',
    maxWidth: '1000px',
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 24px 64px rgba(0,34,68,0.08)',
    overflow: 'hidden',
  },
  videoHeader: {
    height: '40px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    justifyContent: 'space-between',
  },
  dotRow: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '11px',
    height: '11px',
    borderRadius: '50%',
  },
  videoStatus: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    letterSpacing: '0.05em',
  },
  videoFrame: {
    position: 'relative',
    cursor: 'pointer',
    background: '#000',
    aspectRatio: '16/9',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  videoFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: '#0d1117',
  },
  posterImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.7,
  },
  watchDemoBtn: {
    position: 'relative',
    zIndex: 2,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    background: '#002244',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '16px 28px',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  playCircle: {
    width: '36px',
    height: '36px',
    background: '#2563eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,34,68,0.2)',
    backdropFilter: 'blur(2px)',
  },
  playBtn: {
    width: '80px',
    height: '80px',
    background: '#2563eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
    paddingLeft: '6px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px',
    width: '100%',
    marginTop: '20px',
  },
  featureItem: {
    display: 'flex',
    gap: '16px',
    padding: '24px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  featureIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#002244',
    margin: '0 0 6px 0',
    letterSpacing: '-0.01em',
  },
  featureDesc: {
    fontSize: '13px',
    color: '#475569',
    lineHeight: 1.5,
    margin: 0,
  },
  ctaRow: {
    textAlign: 'center',
    marginTop: '64px',
  },
  mainCta: {
    padding: '18px 36px',
    fontSize: '16px',
    fontWeight: 800,
    background: '#002244',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 8px 24px rgba(0,34,68,0.15)',
    transition: 'transform 0.2s',
  },
  ctaFootnote: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '16px',
    fontWeight: 600,
  }
};
