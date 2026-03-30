import React from 'react';
import { Shield, Zap, Target, ArrowRight, CheckCircle, Clock, Search, Briefcase, Globe, FileText, ChevronRight, BarChart3, Activity } from 'lucide-react';

export default function ArisConsulting({ onGetStarted }) {
  const scrollToPricing = () => {
    document.getElementById('services-grid').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={styles.container}>
      {/* --- ELITE NAVIGATION (Embedded) --- */}
      <nav style={styles.miniNav}>
        <div style={styles.navLogo}>ARIS_STRATEGIC</div>
        <div style={styles.navLinks}>
          <a href="#protocol" style={styles.navLink}>Protocol</a>
          <a href="#services-grid" style={styles.navLink}>Services</a>
          <button style={styles.navBtn} onClick={() => window.location.href = 'mailto:sid@bidsmith.pro'}>Consultation</button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>INSTITUTIONAL GRADE</div>
          <h1 style={styles.heroTitle}>
            High-Stakes <span style={{ color: '#0B3D91' }}>Federal</span> <br /> 
            Intelligence & Strategy
          </h1>
          <p style={styles.heroSubtitle}>
            Dominate the GovCon landscape with the ARIS 7-Day Protocol. We deploy sovereign AI to architect winning compliance matrices for the world's most complex solicitations.
          </p>
          <div style={styles.heroActions}>
            <button style={styles.primaryBtn} onClick={() => window.open('https://buy.stripe.com/5kA9D6g6Ie0S5EY6oo', '_blank')}>
              Book 7-Day Audit Briefing <ArrowRight size={20} />
            </button>
            <button style={styles.secondaryBtn} onClick={scrollToPricing}>
              View Capabilities
            </button>
          </div>
        </div>
        
        <div style={styles.heroStats}>
           <div style={styles.statBox}>
              <div style={styles.statValue}>100%</div>
              <div style={styles.statLabel}>Compliance Accuracy</div>
           </div>
           <div style={styles.statBox}>
              <div style={styles.statValue}>7 Days</div>
              <div style={styles.statLabel}>Full Audit Delivery</div>
           </div>
           <div style={styles.statBox}>
              <div style={styles.statValue}>$2B+</div>
              <div style={styles.statLabel}>Contract Volume Audited</div>
           </div>
        </div>
      </header>

      {/* --- PROOF STRIP --- */}
      <div style={styles.proofStrip}>
         <span style={styles.proofText}>TRUSTED FOR AUDITS AT</span>
         <div style={styles.proofLogos}>
            <div style={styles.proofLogo}>DOD_CERTIFIED</div>
            <div style={styles.proofLogo}>NASA_STANDARDS</div>
            <div style={styles.proofLogo}>HHS_COMPLIANT</div>
            <div style={styles.proofLogo}>DHS_ALIGNED</div>
         </div>
      </div>

      {/* --- THE 7-DAY PROTOCOL --- */}
      <section id="protocol" style={styles.protocol}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={styles.sectionTitle}>The Strategic Extraction Protocol</h2>
          <p style={styles.sectionSubtitle}>A systematic, AI-driven timeline from ingest to win-theme.</p>
        </div>
        
        <div style={styles.timeline}>
          <div style={styles.timelineTrack} />
          <TimelineStep day="01" title="Signal Ingest" desc="Deep-shred ingestion of RFP, SOW, and Evaluation Factors into our sovereign memory." icon={<Search size={24} />} />
          <TimelineStep day="03" title="Risk Topology" desc="Identification of high-penalty disqualifiers and strategic compliance gaps." icon={<Shield size={24} />} />
          <TimelineStep day="05" title="Strategy Forge" desc="Win-theme synthesis and automated proposal outline mapping." icon={<Target size={24} />} />
          <TimelineStep day="07" title="Final Handover" desc="Delivery of the Master Compliance Matrix and Strategic Executive Brief." icon={<FileText size={24} />} />
        </div>
      </section>

      {/* --- SERVICES GRID --- */}
      <section id="services-grid" style={styles.services}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={styles.sectionTitle}>Strategic Engagement Tiers</h2>
          <p style={styles.sectionSubtitle}>Immediate operational intelligence for elite federal capture teams.</p>
        </div>

        <div style={styles.grid}>
          <ServiceCard 
            icon={<Activity size={32} color="#0B3D91" />}
            title="Strategic Consultation"
            price="$499 / sesión"
            desc="Deep-dive 1:1 strategy with ARIS leads to optimize your internal capture workflows."
            cta="Book Now"
            link="https://buy.stripe.com/5kA9D6g6Ie0S5EY6oo"
          />
          <ServiceCard 
            icon={<Zap size={32} color="#fff" />}
            title="7-Day Audit Protocol"
            price="$2,499+"
            desc="Our flagship service. A full-spectrum AI-driven compliance audit and win-theme report."
            cta="Commence Audit"
            link="mailto:sid@bidsmith.pro?subject=High-Stakes Audit Request"
            featured
          />
          <ServiceCard 
            icon={<Globe size={32} color="#0B3D91" />}
            title="Private ML Training"
            price="Custom"
            desc="Deploy a zero-knowledge AI model trained exclusively on your past proposal history."
            cta="Inquire"
            link="/contact"
          />
        </div>
      </section>

      {/* --- VALUE PROP --- */}
      <section style={styles.valueProp}>
        <div style={styles.valueInner}>
           <div style={styles.valueTextSide}>
              <h3 style={styles.valueHeading}>Why wait 30 days for a manual audit?</h3>
              <p style={styles.valuePara}>
                 Traditional consulting firms charge <strong>$25k+</strong> and take <strong>weeks</strong> to shred an RFP. 
                 Aris Strategic Ops delivers deeper intelligence in <strong>168 hours</strong> at a fraction of the cost. 
                 It's not just faster; it's architected for 100% win-theme alignment.
              </p>
              <div style={styles.valueChecklist}>
                 <div style={styles.checkItem}><CheckCircle size={18} color="#10b981" /> Zero-Knowledge Data Privacy</div>
                 <div style={styles.checkItem}><CheckCircle size={18} color="#10b981" /> FAR/DFARS/NIST Precision</div>
                 <div style={styles.checkItem}><CheckCircle size={18} color="#10b981" /> Automated RTM Generation</div>
              </div>
           </div>
           <div style={styles.valueImageSide}>
              <div style={styles.impactCard}>
                 <div style={styles.impactValue}>90%</div>
                 <div style={styles.impactLabel}>Reduction in Prep Time</div>
              </div>
           </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <h2 style={styles.footerTitle}>Scale Your Federal Footprint</h2>
          <p style={styles.footerText}>
             The difference between a "Go" and a "No-Go" is intelligence. Secure yours now.
          </p>
          <div style={styles.footerBtns}>
             <button style={styles.footerPrimary} onClick={() => window.open('https://buy.stripe.com/5kA9D6g6Ie0S5EY6oo', '_blank')}>
                Book Immediate Briefing <ArrowRight size={20} />
             </button>
             <button style={styles.footerSecondary} onClick={() => window.location.href = 'mailto:sid@bidsmith.pro'}>
                Contact Strategic Ops
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

const TimelineStep = ({ day, title, desc, icon }) => (
  <div style={styles.step}>
    <div style={styles.stepHeader}>
       <div style={styles.stepDay}>{day}</div>
       <div style={styles.stepIcon}>{icon}</div>
    </div>
    <h4 style={styles.stepTitle}>{title}</h4>
    <p style={styles.stepDesc}>{desc}</p>
  </div>
);

const ServiceCard = ({ icon, title, price, desc, cta, link, featured }) => (
  <div style={{ ...styles.card, ...(featured ? styles.cardFeatured : {}) }}>
    <div style={styles.cardHeader}>
       <div style={styles.cardIcon}>{icon}</div>
       <h3 style={{ ...styles.cardTitle, ...(featured ? {color: '#fff'} : {}) }}>{title}</h3>
    </div>
    <div style={{ ...styles.cardPrice, ...(featured ? {color: '#60A5FA'} : {}) }}>{price}</div>
    <p style={{ ...styles.cardDesc, ...(featured ? {color: 'rgba(255,255,255,0.8)'} : {}) }}>{desc}</p>
    <button 
      onClick={() => window.open(link, featured ? '_self' : '_blank')}
      style={{ ...styles.cardBtn, ...(featured ? styles.cardBtnFeatured : {}) }}
    >
      {cta}
    </button>
  </div>
);

const styles = {
  container: { background: '#ffffff', fontFamily: "'Inter', sans-serif" },
  miniNav: { padding: '24px 64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', background: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { fontWeight: 900, fontSize: '18px', color: '#0B3D91', letterSpacing: '0.05em' },
  navLinks: { display: 'flex', gap: '32px', alignItems: 'center' },
  navLink: { fontSize: '13px', fontWeight: 700, color: '#64748b', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' },
  navBtn: { background: '#0B3D91', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' },
  
  hero: { padding: '120px 64px', display: 'flex', alignItems: 'center', gap: '100px', maxWidth: '1400px', margin: '0 auto', minHeight: '80vh' },
  heroContent: { flex: 1.5 },
  badge: { display: 'inline-block', padding: '6px 12px', background: 'rgba(11,61,145,0.05)', color: '#0B3D91', borderRadius: '6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '32px' },
  heroTitle: { fontSize: '72px', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: '32px', letterSpacing: '-0.04em' },
  heroSubtitle: { fontSize: '20px', color: '#475569', lineHeight: 1.6, marginBottom: '48px', maxWidth: '640px' },
  heroActions: { display: 'flex', gap: '20px' },
  primaryBtn: { background: '#0B3D91', color: '#fff', border: 'none', padding: '20px 40px', borderRadius: '12px', fontSize: '16px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 20px 40px rgba(11,61,145,0.15)' },
  secondaryBtn: { background: 'transparent', color: '#0B3D91', border: '2px solid #e2e8f0', padding: '18px 40px', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: 'pointer' },
  
  heroStats: { flex: 1, display: 'grid', gridTemplateColumns: '1fr', gap: '24px' },
  statBox: { padding: '32px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' },
  statValue: { fontSize: '40px', fontWeight: 900, color: '#0B3D91', marginBottom: '4px' },
  statLabel: { fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },

  proofStrip: { padding: '40px 64px', background: '#f8fafc', borderY: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '60px' },
  proofText: { fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.15em' },
  proofLogos: { display: 'flex', gap: '40px' },
  proofLogo: { fontSize: '13px', fontWeight: 900, color: '#cbd5e1', letterSpacing: '0.05em' },

  protocol: { padding: '140px 64px', background: '#fff' },
  sectionTitle: { fontSize: '48px', fontWeight: 900, color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.03em' },
  sectionSubtitle: { fontSize: '20px', color: '#64748b', maxWidth: '800px', margin: '0 auto' },
  timeline: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '60px', maxWidth: '1200px', margin: '80px auto 0', position: 'relative' },
  timelineTrack: { position: 'absolute', top: '30px', left: '0', right: '0', height: '2px', background: '#f1f5f9', zIndex: 0 },
  step: { position: 'relative', zIndex: 1 },
  stepHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  stepDay: { fontSize: '32px', fontWeight: 900, color: '#0B3D91' },
  stepIcon: { width: '48px', height: '48px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' },
  stepTitle: { fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' },
  stepDesc: { fontSize: '15px', color: '#64748b', lineHeight: 1.6 },

  services: { padding: '140px 64px', background: '#f8fafc' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', maxWidth: '1300px', margin: '0 auto' },
  card: { background: '#fff', padding: '64px 48px', borderRadius: '32px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', transition: 'all 0.3s' },
  cardFeatured: { background: '#0B3D91', color: '#fff', transform: 'scale(1.05)', boxShadow: '0 40px 80px rgba(11,61,145,0.15)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' },
  cardTitle: { fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 },
  cardPrice: { fontSize: '14px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '0.1em' },
  cardDesc: { fontSize: '16px', color: '#64748b', lineHeight: 1.6, marginBottom: '40px', flex: 1 },
  cardBtn: { width: '100%', padding: '18px', borderRadius: '12px', border: '2px solid #0B3D91', background: 'transparent', color: '#0B3D91', fontWeight: 900, fontSize: '15px', cursor: 'pointer' },
  cardBtnFeatured: { background: '#fff', color: '#0B3D91', border: 'none' },

  valueProp: { padding: '140px 64px', maxWidth: '1200px', margin: '0 auto' },
  valueInner: { display: 'flex', gap: '80px', alignItems: 'center' },
  valueTextSide: { flex: 1.5 },
  valueHeading: { fontSize: '40px', fontWeight: 900, color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.02em' },
  valuePara: { fontSize: '18px', color: '#475569', lineHeight: 1.7, marginBottom: '40px' },
  valueChecklist: { display: 'flex', flexDirection: 'column', gap: '16px' },
  checkItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 600, color: '#334155' },
  valueImageSide: { flex: 1, display: 'flex', justifyContent: 'center' },
  impactCard: { width: '100%', padding: '60px', background: '#0B3D91', borderRadius: '32px', textAlign: 'center', color: '#fff' },
  impactValue: { fontSize: '80px', fontWeight: 900, marginBottom: '8px' },
  impactLabel: { fontSize: '15px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' },

  footer: { padding: '140px 64px', background: '#0a0d14' },
  footerContent: { textAlign: 'center', maxWidth: '800px', margin: '0 auto' },
  footerTitle: { fontSize: '56px', fontWeight: 900, color: '#fff', marginBottom: '24px', letterSpacing: '-0.03em' },
  footerText: { fontSize: '20px', color: '#94a3b8', marginBottom: '56px' },
  footerBtns: { display: 'flex', gap: '20px', justifyContent: 'center' },
  footerPrimary: { background: '#2563EB', color: '#fff', border: 'none', padding: '20px 48px', borderRadius: '14px', fontSize: '18px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' },
  footerSecondary: { background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '18px 48px', borderRadius: '14px', fontSize: '18px', fontWeight: 800, cursor: 'pointer' }
};
