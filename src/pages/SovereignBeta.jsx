import React, { useState } from 'react';
import { Shield, Zap, Globe, Lock, ArrowRight, CheckCircle } from 'lucide-react';

const SovereignBeta = ({ onBack }) => {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="sovereign-beta-container" style={{
      minHeight: '100vh',
      background: '#05070b',
      color: '#f4f7ff',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }}></div>

      {/* Header */}
      <nav style={{ 
        width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', marginBottom: '80px', zIndex: 1 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={onBack} className="clickable">
          <Shield size={24} color="var(--text-primary)" />
          <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '18px' }}>ARIS SOVEREIGN</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>
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
          fontSize: 'clamp(32px, 8vw, 64px)', fontWeight: 800, letterSpacing: '-0.04em',
          lineHeight: 1.1, marginBottom: '24px'
        }}>
          The machine that tracks the <span style={{ color: 'var(--text-secondary)' }}>logic the government forgets.</span>
        </h1>

        <p className="animate-in" style={{ 
          fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, 
          marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto'
        }}>
          We are opening Sovereign v2.1 to 5 select GovCon firms for a private boarding-level trial. 
          Move from "Vibe-based" bidding to high-precision federal intelligence.
        </p>

        {/* Signup Form / Success State */}
        {!submitted ? (
          <form className="animate-in" onSubmit={handleSubmit} style={{
            display: 'flex', gap: '12px', maxWidth: '500px', margin: '0 auto 80px auto',
            background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)'
          }}>
            <input 
              type="email" 
              placeholder="Enter firm email..."
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none', color: '#fff',
                padding: '12px 16px', flex: 1, fontSize: '15px'
              }}
            />
            <button type="submit" style={{
              background: '#fff', color: '#000', fontWeight: 700, padding: '12px 24px',
              borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', transition: 'transform 0.2s', border: 'none'
            }} className="hover:scale-95">
              Apply for Sovereign Beta <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <div className="animate-in" style={{
            background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)',
            padding: '24px', borderRadius: '16px', maxWidth: '500px', margin: '0 auto 80px auto',
            display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left'
          }}>
            <CheckCircle size={32} color="rgb(34, 197, 94)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>Application Received.</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Our Lead Architect will contact you shortly.</div>
            </div>
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
        © 2026 ARIS PROTOCOL // PRIVATE STAGING
      </footer>
    </div>
  );
};

export default SovereignBeta;
