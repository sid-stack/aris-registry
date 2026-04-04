import { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { getAuthRedirectUrl, hasSupabaseConfig, supabase } from '../lib/supabase';

/**
 * Login — real Supabase email/password auth.
 * Supports signup + login in one screen.
 * onLogin(user) called on success.
 *
 * NOTE: To skip email confirmation (recommended for prod),
 * go to Supabase Dashboard → Auth → Email → disable "Confirm email".
 */
export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl('/app'),
          },
        });
        if (err) {
          setError(err.message);
        } else if (data?.user && !data.session) {
          setInfo('Check your email for a confirmation link. After confirming, you will return to the app and can sign in immediately.');
          setMode('login');
        } else if (data?.user) {
          onLogin(data.user, data.session);
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (err) {
          setError(err.message === 'Invalid login credentials'
            ? 'Wrong email or password.'
            : err.message);
        } else {
          onLogin(data.user, data.session);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again or contact sid@bidsmith.pro');
    }

    setLoading(false);
  };

  return (
    <div style={s.root}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.icon}>
            <Shield size={22} color="#fff" />
          </div>
          <h1 style={s.title}>BidSmith</h1>
          <p style={s.sub}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={s.tabs}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setInfo(null); }}
              style={{
                ...s.tab,
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#0f172a' : '#94a3b8',
                fontWeight: mode === m ? 700 : 500,
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>
          {!hasSupabaseConfig && (
            <div style={s.errorBox}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              <span>Authentication is not configured for this deployment yet. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on the server runtime.</span>
            </div>
          )}

          <div style={s.field}>
            <label style={s.label}>Email</label>
            <div style={s.inputRow}>
              <Mail size={15} style={s.inputIcon} />
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={s.input}
                autoComplete="email"
              />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.inputRow}>
              <Lock size={15} style={s.inputIcon} />
              <input
                type="password"
                placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={s.input}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {error && (
            <div style={s.errorBox}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div style={s.infoBox}>
              <span>{info}</span>
            </div>
          )}

          <button type="submit" disabled={loading || !hasSupabaseConfig} style={s.btn}>
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
            }
          </button>
        </form>

        <p style={s.footer}>
          {mode === 'login'
            ? <>No account? <button onClick={() => { setMode('signup'); setError(null); }} style={s.link}>Sign up free</button></>
            : <>Already have an account? <button onClick={() => { setMode('login'); setError(null); }} style={s.link}>Sign in</button></>
          }
        </p>
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0a0d14',
    fontFamily: "'Inter', system-ui, sans-serif", padding: '20px',
  },
  card: {
    width: '100%', maxWidth: '400px',
    background: 'rgba(13,17,24,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px', padding: '36px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  header: { textAlign: 'center', marginBottom: '28px' },
  icon: {
    width: '44px', height: '44px', margin: '0 auto 14px',
    background: 'linear-gradient(135deg, #0B3D91, #1d4ed8)',
    borderRadius: '12px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px' },
  sub: { fontSize: '13px', color: '#64748b', margin: 0 },
  tabs: {
    display: 'flex', background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px', padding: '3px', marginBottom: '24px',
  },
  tab: {
    flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
    fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' },
  inputRow: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', color: '#475569', flexShrink: 0 },
  input: {
    width: '100%', padding: '11px 14px 11px 38px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: '#f1f5f9',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },
  errorBox: {
    padding: '10px 12px', background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '8px', color: '#f87171',
    fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
  },
  infoBox: {
    padding: '10px 12px', background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: '8px', color: '#4ade80', fontSize: '13px',
  },
  btn: {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #0B3D91, #1d4ed8)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontWeight: 700, fontSize: '14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    boxShadow: '0 4px 12px rgba(11,61,145,0.35)',
    transition: 'opacity 0.15s',
  },
  footer: { marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#475569' },
  link: {
    background: 'none', border: 'none', color: '#60a5fa',
    cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0,
  },
};
