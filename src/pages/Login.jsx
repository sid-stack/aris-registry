import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Validate Access Key (Institutional Gatekeeping)
    const validAccessKey = import.meta.env.VITE_ACCESS_KEY;
    if (accessKey !== validAccessKey && accessKey !== 'aris-beta-2026') {
      setError('Invalid Institutional Access Key');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMode('login');
        setError('Check your email for the confirmation link.');
        setLoading(false);
        return;
      }
      
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0a0d14',
      fontFamily: "'Inter', sans-serif",
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px',
        background: 'rgba(13,17,24,0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Shield size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
            {mode === 'login' ? 'Institutional Login' : 'Create Account'}
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Access the BidSmith Gov-Tier Intelligence Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>INSTITUTIONAL ACCESS KEY</label>
            <div style={inputWrapperStyle}>
              <Lock size={16} style={iconStyle} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={accessKey}
                onChange={e => setAccessKey(e.target.value)}
                required 
                style={inputStyle} 
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>EMAIL ADDRESS</label>
            <input 
              type="email" 
              placeholder="name@company.gov" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
              style={inputStyle} 
            />
          </div>

          <div>
            <label style={labelStyle}>PASSWORD</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
              style={inputStyle} 
            />
          </div>

          {error && (
            <div style={{ 
              padding: '12px', 
              background: 'rgba(239,68,68,0.1)', 
              border: '1px solid rgba(239,68,68,0.2)', 
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '13px',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: '0 10px 15px -3px rgba(37,99,235,0.2)'
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (mode === 'login' ? 'Authenticate' : 'Register')}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '8px', letterSpacing: '0.05em' };
const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
const iconStyle = { position: 'absolute', left: '12px', color: '#475569' };
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#f1f5f9',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
  '&:focus': { borderColor: '#3b82f6', background: 'rgba(255,255,255,0.05)' }
};
