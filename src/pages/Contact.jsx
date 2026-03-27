import React, { useState } from 'react';
import { Mail, MessageSquare, Shield, Globe, Send, CheckCircle2 } from 'lucide-react';

const Contact = ({ onBack }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // For now, we'll simulate a submission to a Google Form backend
    // USER: Replace the action URL with your actual Google Form 'formResponse' URL
    // and make sure the 'name' attributes match your form's entry IDs (e.g., entry.123456)
    
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      // Optional: Post to actual GForm via fetch/iframe if URL provided
    }, 1500);
  };

  if (submitted) {
    return (
      <div style={s.successContainer}>
        <CheckCircle2 color="#10B981" size={64} />
        <h1 style={s.title}>Message Received</h1>
        <p style={s.subtitle}>A BidSmith capture specialist will contact you within 24 hours.</p>
        <button onClick={onBack} style={s.backBtn}>Return Home</button>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={{ ...s.sidebar, display: isMobile ? 'none' : 'flex' }}>
        <div style={s.logo}>BidSmith / Sales</div>
        <div style={s.sidebarContent}>
          <h2 style={s.sidebarTitle}>Scale your federal practice.</h2>
          <p style={s.sidebarText}>
            Join the elite capture teams using BidSmith to automate compliance and win more contracts.
          </p>
          
          <div style={s.featureList}>
            <div style={s.feature}>
              <Shield size={20} color="#0B3D91" />
              <span>Zero-Knowledge Security</span>
            </div>
            <div style={s.feature}>
              <Globe size={20} color="#0B3D91" />
              <span>Institutional Grade Intelligence</span>
            </div>
            <div style={s.feature}>
              <MessageSquare size={20} color="#0B3D91" />
              <span>24/7 Federal Support</span>
            </div>
          </div>
        </div>
        <button onClick={onBack} style={s.backBtn}>Back</button>
      </div>

      <div style={s.formContent}>
        <div style={s.formHeader}>
          <h1 style={s.formTitle}>Contact Sales</h1>
          <p style={s.formSubtitle}>Enter your details and our team will be in touch shortly.</p>
        </div>

        <form style={s.form} onSubmit={handleSubmit}>
          <div style={s.inputGroup}>
            <label style={s.label}>Full Name</label>
            <input 
              type="text" 
              required 
              style={s.input} 
              placeholder="John Doe" 
              name="entry.fullname" 
            />
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>Work Email</label>
            <input 
              type="email" 
              required 
              style={s.input} 
              placeholder="john@company.com" 
              name="entry.email"
            />
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>Company / Agency</label>
            <input 
              type="text" 
              required 
              style={s.input} 
              placeholder="Cyber Systems Inc." 
              name="entry.company"
            />
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>How can we help?</label>
            <textarea 
              required 
              style={{ ...s.input, height: '120px', resize: 'none' }} 
              placeholder="Tell us about your team's needs..." 
              name="entry.message"
            />
          </div>

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? 'Sending...' : 'Request a Consultation'}
            {!loading && <Send size={18} style={{ marginLeft: '8px' }} />}
          </button>
        </form>

        <div style={s.formFooter}>
          <p style={s.footerText}>
            Prefer email? <a href="mailto:sid@bidsmith.pro" style={s.link}>sid@bidsmith.pro</a>
          </p>
        </div>
      </div>
    </div>
  );
};

const s = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    padding: '24px',
    background: '#F8FAFC',
  },
  sidebar: {
    width: '400px',
    background: '#F8FAFC',
    borderRight: '1px solid #E2E8F0',
    padding: '48px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  logo: {
    fontSize: '18px',
    fontWeight: 900,
    color: '#0B3D91',
    letterSpacing: '-0.02em',
  },
  sidebarTitle: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#0F172A',
    lineHeight: 1.1,
    marginBottom: '24px',
  },
  sidebarText: {
    fontSize: '18px',
    color: '#64748B',
    lineHeight: 1.5,
    marginBottom: '48px',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#334155',
  },
  backBtn: {
    padding: '12px 24px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    color: '#64748B',
    fontWeight: 700,
    cursor: 'pointer',
    width: 'fit-content',
  },
  formContent: {
    flex: 1,
    padding: '80px 24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    maxWidth: '800px',
    margin: '0 auto',
  },
  formHeader: {
    marginBottom: '48px',
  },
  formTitle: {
    fontSize: '40px',
    fontWeight: 900,
    color: '#0F172A',
    marginBottom: '12px',
    letterSpacing: '-0.03em',
  },
  formSubtitle: {
    fontSize: '18px',
    color: '#64748B',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#334155',
  },
  input: {
    padding: '16px',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
    '&:focus': {
      border: '1px solid #0B3D91',
      boxShadow: '0 0 0 4px rgba(11, 61, 145, 0.1)',
    },
  },
  submitBtn: {
    padding: '18px',
    background: '#0B3D91',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease, background 0.2s ease',
    '&:hover': {
      background: '#082f6e',
      transform: 'translateY(-2px)',
    },
    '&:disabled': {
      background: '#94A3B8',
      cursor: 'not-allowed',
    },
  },
  formFooter: {
    marginTop: '48px',
    paddingTop: '32px',
    borderTop: '1px solid #F1F5F9',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '14px',
    color: '#94A3B8',
  },
  link: {
    color: '#0B3D91',
    textDecoration: 'none',
    fontWeight: 700,
  },
  title: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#0F172A',
    marginTop: '24px',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#64748B',
    marginBottom: '32px',
  }
};

export default Contact;
