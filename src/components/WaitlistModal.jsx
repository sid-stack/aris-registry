/**
 * WaitlistModal — BidSmith Early Access Request
 * Captures: name, email, company, role, use_case
 * POSTs to /api/waitlist → saves to DB + sends confirmation email
 */

import { useState } from 'react';
import { Shield, Zap, CheckCircle, X } from 'lucide-react';

const ROLES = [
  'Founder / CEO',
  'Head of Business Development',
  'Capture Manager',
  'Proposal Manager',
  'Director of Proposals',
  'VP Sales / BD',
  'Other',
];

export default function WaitlistModal({ onClose, source = 'app' }) {
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', company: '', role: '', use_case: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, backdropFilter: 'blur(6px)', padding: '16px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Header stripe */}
        <div style={{
          background: 'linear-gradient(135deg, #002244 0%, #0B3D91 100%)',
          padding: '24px 28px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Shield size={20} color="#93c5fd" />
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '0.04em', fontFamily: "'Georgia', serif" }}>
              BIDSMITH
            </span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#c4b5fd', background: 'rgba(196,181,253,0.15)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(196,181,253,0.3)' }}>
              EARLY ACCESS
            </span>
          </div>
          <p style={{ color: '#bfdbfe', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
            AI-powered RFP audit engine for government contractors. 90-second compliance analysis, bid/no-bid verdict, price-to-win.
          </p>
        </div>

        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
          width: '28px', height: '28px', cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <X size={14} />
        </button>

        {step === 'success' ? (
          <div style={{ padding: '40px 28px', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', background: '#f0fdf4',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle size={28} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
              You're on the list
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
              Check your inbox — we sent a confirmation. You'll get a personal invite when we open access.
            </p>
            <button onClick={onClose} style={{
              background: '#002244', color: '#fff', border: 'none',
              borderRadius: '10px', padding: '12px 28px',
              fontWeight: 700, fontSize: '14px', cursor: 'pointer'
            }}>
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <Field label="Full Name *" value={form.name} onChange={v => set('name', v)} placeholder="Alex Johnson" required />
              <Field label="Work Email *" value={form.email} onChange={v => set('email', v)} placeholder="alex@company.com" type="email" required />
            </div>
            <Field label="Company" value={form.company} onChange={v => set('company', v)} placeholder="Acme Federal Solutions" mb={12} />

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '5px' }}>
                Your Role
              </label>
              <select
                value={form.role} onChange={e => set('role', e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '13px',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  color: form.role ? '#0f172a' : '#94a3b8', background: '#f8fafc',
                  outline: 'none', appearance: 'none'
                }}
              >
                <option value="">Select your role…</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '5px' }}>
                What are you trying to solve?
              </label>
              <textarea
                value={form.use_case}
                onChange={e => set('use_case', e.target.value)}
                placeholder="e.g. We respond to 10+ RFPs a month and spend too much time on compliance review…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '13px',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  color: '#0f172a', background: '#f8fafc', resize: 'none',
                  outline: 'none', lineHeight: 1.5, fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#002244'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {error && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fca5a5',
                borderRadius: '8px', padding: '10px 12px',
                fontSize: '12px', color: '#dc2626', marginBottom: '14px'
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading || !form.name.trim() || !form.email.trim()} style={{
              width: '100%', padding: '13px',
              background: loading || !form.name.trim() || !form.email.trim() ? '#94a3b8' : '#002244',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontWeight: 800, fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.15s'
            }}>
              <Zap size={15} />
              {loading ? 'Submitting…' : 'Request Early Access'}
            </button>

            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: '10px 0 0', lineHeight: 1.5 }}>
              No spam. No credit card. You'll get a personal invite.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', required, mb = 0 }) {
  return (
    <div style={{ marginBottom: mb }}>
      <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '5px' }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{
          width: '100%', padding: '10px 12px', fontSize: '13px',
          border: '1px solid #e2e8f0', borderRadius: '8px',
          color: '#0f172a', background: '#f8fafc',
          outline: 'none', boxSizing: 'border-box'
        }}
        onFocus={e => e.target.style.borderColor = '#002244'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
    </div>
  );
}
