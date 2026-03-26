import React, { useState } from 'react';
import { Shield, Zap, Globe, Lock, ArrowRight, CheckCircle } from 'lucide-react';

const BidSmithBeta = ({ onBack }) => {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const resp = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, metadata: { page: 'BidSmithBeta' } })
      });
      if (resp.ok) setSubmitted(true);
    } catch (err) {
      console.error("[BETA_SIGNUP] error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bidsmith-beta-container" style={{
      minHeight: '100vh',
      background: '#05070b',
      color: '#f4f7ff',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: isMobile ? '20px' : '40px 20px',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: isMobile ? '100%' : '600px', height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }}></div>

      {/* Header */}
      <nav style={{ 
        width: '100%', maxWidth: '1100px', display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        gap: isMobile ? '12px' : '0',
        marginBottom: isMobile ? '40px' : '80px', 
        zIndex: 1 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={onBack} className="clickable">
          <Shield size={24} color="var(--text-primary)" />
          <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '18px' }}>BIDSMITH BETA</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>
          PROTOCOL V2.1 // STABLE
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ width: '100%', maxWidth: '800px', textAlign: 'center', zIndex: 1 }}>
        <div className="animate-in" style={{ 
          background: 'rgba(59, 130, 246, 0.1)', color: 'rgb(96, 165, 250)', 
          padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 800,
          display: 'inline-block', marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.2)',
          letterSpacing: '0.05em'
        }}>
          🚀 PRIVATE BETA ACCESS
        </div>

        <h1 className="animate-in" style={{ 
          fontSize: isMobile ? '36px' : 'clamp(32px, 8vw, 64px)', fontWeight: 800, letterSpacing: '-0.04em',
          lineHeight: 1.1, marginBottom: '24px'
        }}>
          The machine that tracks the <span style={{ color: 'var(--text-secondary)' }}>logic the government forgets.</span>
        </h1>

        <p className="animate-in" style={{ 
          fontSize: isMobile ? '16px' : '18px', color: 'var(--text-secondary)', lineHeight: 1.6, 
          marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto'
        }}>
          We are opening BidSmith to select GovCon firms for a private boarding-level trial. 
          Move from "Vibe-based" bidding to high-precision federal intelligence.
        </p>

        {/* Signup Form / Success State */}
        {!submitted ? (
          <form className="animate-in" onSubmit={handleSubmit} style={{
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px', maxWidth: '500px', margin: '0 auto 80px auto',
            background: isMobile ? 'transparent' : 'rgba(255, 255, 255, 0.03)', 
            padding: isMobile ? '0' : '8px', 
            borderRadius: '14px',
            border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)', 
            backdropFilter: 'blur(10px)'
          }}>
            <input 
              type="email" 
              placeholder="Enter firm email..."
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: isMobile ? 'rgba(255,255,255,0.03)' : 'transparent', 
                border: isMobile ? '1px solid rgba(255,255,255,0.1)' : 'none', 
                outline: 'none', color: '#fff',
                padding: '12px 16px', flex: 1, fontSize: '15px',
                borderRadius: isMobile ? '12px' : '0'
              }}
            />
            <button type="submit" disabled={loading} style={{
              background: '#fff', color: '#000', fontWeight: 700, padding: '12px 24px',
              borderRadius: isMobile ? '12px' : '10px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'transform 0.2s', border: 'none',
              opacity: loading ? 0.7 : 1
            }} className="hover:scale-95">
              {loading ? "Registering..." : "Apply for BidSmith Beta"} { !loading && <ArrowRight size={16} /> }
            </button>
          </form>
        ) : (
          <div className="animate-in" style={{
            background: 'rgba(34, 197, 94, 0.05)', 
            border: '1px solid rgba(34, 197, 94, 0.2)',
            padding: '48px 32px', 
            borderRadius: '24px', 
            maxWidth: '600px', 
            margin: '0 auto 80px auto',
            textAlign: 'center',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}>
              <CheckCircle size={32} color="rgb(34, 197, 94)" />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '28px', marginBottom: '12px', color: '#fff' }}>Application Logged.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, marginBottom: '32px' }}>
              Your interest in v2.1 has been cryptographically logged. 
              Our Lead Architect will contact you at <strong>{email}</strong> once your firm's credentials are verified.
            </p>
            <button 
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                padding: '12px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
              }}
            >
              Return to Terminal
            </button>
          </div>
        )}

        {/* Feature Grid */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '32px', textAlign: 'left', marginTop: '40px' 
        }}>
          {[
            { icon: Lock, title: 'Zero-Knowledge', desc: 'Ephemeral memory remains stateless. No data persisted.' },
            { icon: Globe, title: 'Modular Registry', desc: 'JSON-RPC bridges to SAM.gov, FDIC, and more.' },
            { icon: Zap, title: 'Win-Theme AI', desc: 'Aggressive consultant logic extracted from Logic_Library.' }
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: 'rgba(255, 255, 255, 0.02)', padding: '24px', borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Icon size={20} color="rgb(96, 165, 250)" style={{ marginBottom: '16px' }} />
              <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>{title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ marginTop: '120px', color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.05em' }}>
        © 2026 BIDSMITH // ARIS POWERED // PRIVATE STAGING
      </footer>
    </div>
  );
};

export default BidSmithBeta;
