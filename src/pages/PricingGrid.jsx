import React from 'react';
import { Shield, CheckCircle, ArrowRight, Zap, Lock, MessageSquare } from 'lucide-react';

export default function PricingGrid({ onTryFree, onGetPro, onGetEnterprise }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <main style={styles.page}>
      {/* SECTION 1: HERO */}
      <section style={styles.hero}>
        <h1 style={styles.title}>Simple, Transparent Pricing</h1>
        <p style={styles.subtitle}>
          Analyze RFPs in seconds. Pay only when you need full exports.
        </p>
      </section>

      {/* SECTION 2: PRICING CARDS */}
      <section style={styles.pricingSection}>
        <div style={styles.grid}>
          {/* Card 1: Starter */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTier}>Starter</h3>
              <div style={styles.price}>$99</div>
            </div>
            <ul style={styles.featureList}>
              <li style={styles.featureItem}><CheckCircle size={16} color="#16a34a" /> 1 full RFP audit</li>
              <li style={styles.featureItem}><CheckCircle size={16} color="#16a34a" /> Basic compliance matrix</li>
              <li style={styles.featureItem}><CheckCircle size={16} color="#16a34a" /> PDF / SAM.gov support</li>
            </ul>
            <button style={styles.freeBtn} onClick={onTryFree}>
              Get Started
            </button>
          </div>

          {/* Card 2: Pro */}
          <div style={{...styles.card, ...styles.proCard}}>
            <div style={styles.badge}>MOST POPULAR</div>
            <div style={styles.cardHeader}>
              <h3 style={{...styles.cardTier, color: '#fff'}}>Pro</h3>
              <div style={{...styles.price, color: '#fff'}}>$499<span style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.8 }}>/mo</span></div>
            </div>
            <ul style={styles.featureList}>
              <li style={{...styles.featureItem, color: '#e2e8f0'}}><CheckCircle size={16} color="#fff" /> Unlimited RFP audits</li>
              <li style={{...styles.featureItem, color: '#e2e8f0'}}><CheckCircle size={16} color="#fff" /> Multi-section extraction</li>
              <li style={{...styles.featureItem, color: '#e2e8f0'}}><CheckCircle size={16} color="#fff" /> Full exports (.XLSX, .DOCX)</li>
              <li style={{...styles.featureItem, color: '#e2e8f0'}}><CheckCircle size={16} color="#fff" /> Requirement editing & tagging</li>
            </ul>
            <button style={styles.proBtn} onClick={onGetPro}>
              Go Pro
            </button>
          </div>

          {/* Card 3: Enterprise */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTier}>Enterprise</h3>
              <div style={styles.price}>$999<span style={{ fontSize: '1.2rem', fontWeight: 600 }}>/mo</span></div>
            </div>
            <ul style={styles.featureList}>
              <li style={styles.featureItem}><CheckCircle size={16} color="#16a34a" /> Everything in Pro</li>
              <li style={styles.featureItem}><CheckCircle size={16} color="#16a34a" /> Team collaboration workflows</li>
              <li style={styles.featureItem}><CheckCircle size={16} color="#16a34a" /> Priority processing pipeline</li>
              <li style={styles.featureItem}><CheckCircle size={16} color="#16a34a" /> Dedicated GovCon consultant</li>
            </ul>
            <button style={styles.freeBtn} onClick={onGetEnterprise}>
              Get Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: VALUE JUSTIFICATION */}
      <section style={styles.valueSection}>
        <div style={styles.valueBox}>
          <Zap size={24} color="#0B3D91" style={{ marginBottom: 16 }} />
          <p style={styles.valueText}>
            Most teams spend <strong>$5,000+</strong> and <strong>20–50 hours</strong> on proposal prep. <br />
            BidSmith reduces this to <strong>under 2 minutes</strong> for a fraction of the cost.
          </p>
        </div>
      </section>

      {/* SECTION 4: TRUST */}
      <section style={styles.trustSection}>
        <div style={styles.trustItem}><Lock size={18} /> Secure processing</div>
        <div style={styles.trustItem}><Shield size={18} /> No data stored</div>
        <div style={styles.trustItem}><CheckCircle size={18} /> Built for government contractors</div>
      </section>

      {/* SECTION 5: FINAL CTA */}
      <section style={styles.finalCta}>
        <button style={styles.mainCta} onClick={onTryFree}>
          Upload RFP → Get Matrix <ArrowRight size={20} />
        </button>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
    padding: '80px 24px',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '64px',
  },
  title: {
    fontSize: '3.5rem',
    fontWeight: 900,
    color: '#0B3D91',
    letterSpacing: '-0.02em',
    marginBottom: '16px',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#64748b',
    maxWidth: '600px',
    margin: '0 auto',
  },
  pricingSection: {
    maxWidth: '1000px',
    margin: '0 auto 80px',
  },
  grid: {
    display: 'flex',
    gap: '32px',
    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
  },
  card: {
    flex: 1,
    padding: '48px 32px',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  proCard: {
    background: '#0B3D91',
    borderColor: '#0B3D91',
    boxShadow: '0 24px 64px rgba(11,61,145,0.15)',
    transform: 'scale(1.05)',
  },
  badge: {
    position: 'absolute',
    top: '-14px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#2563eb',
    color: '#fff',
    padding: '6px 16px',
    borderRadius: '99px',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.05em',
  },
  cardHeader: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  cardTier: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#64748b',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: '4rem',
    fontWeight: 900,
    color: '#0B3D91',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 40px 0',
    flex: 1,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '1rem',
    color: '#475569',
    marginBottom: '16px',
    fontWeight: 500,
  },
  freeBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid #0B3D91',
    background: 'transparent',
    color: '#0B3D91',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  proBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: '#fff',
    color: '#0B3D91',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  valueSection: {
    maxWidth: '1000px',
    margin: '0 auto 80px',
    textAlign: 'center',
  },
  valueBox: {
    padding: '48px',
    background: '#f8fafc',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
  },
  valueText: {
    fontSize: '1.5rem',
    color: '#475569',
    lineHeight: 1.5,
  },
  trustSection: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    marginBottom: '80px',
    flexWrap: 'wrap',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem',
    color: '#64748b',
    fontWeight: 600,
  },
  finalCta: {
    textAlign: 'center',
  },
  mainCta: {
    padding: '24px 64px',
    borderRadius: '16px',
    border: 'none',
    background: '#0B3D91',
    color: '#fff',
    fontSize: '1.25rem',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    boxShadow: '0 20px 48px rgba(11,61,145,0.2)',
  }
};
