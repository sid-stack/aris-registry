import { useState, useEffect } from 'react';
import { Shield, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Protocol Authentication Logic
    const targetUser = "sid";
    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    // 1. Check against Environment Variable
    const envPassword = (import.meta.env.VITE_ACCESS_KEY || "").trim();
    // 2. Hardcoded Recovery Pattern (Directly requested by Sid)
    const recoveryPassword = "aris369";
    
    const isAuthorizedUser = inputUser === targetUser;
    const isAuthorizedPass = (inputPass === envPassword && envPassword !== "") || (inputPass === recoveryPassword);

    if (!isAuthorizedUser) {
      setError('ACCESS_DENIED: Unauthorized User Identity');
      setLoading(false);
      return;
    }

    if (!isAuthorizedPass) {
      setError('ACCESS_DENIED: Invalid Protocol Password');
      setLoading(false);
      return;
    }

    // Success Sequence
    console.log("[ARIS_AUTH] Authenticated Successfully as " + targetUser.toUpperCase());
    localStorage.setItem('aris_authenticated', 'true');
    onLogin();
    setLoading(false);
  };

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.iconContainer}>
            <Shield size={24} color="white" />
          </div>
          <h1 style={styles.title}>Sovereign Login</h1>
          <p style={styles.subtitle}>
            Enter Sid's credentials to gain root access to the ARIS Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>USER IDENTITY</label>
            <div style={styles.inputWrapper}>
              <User size={16} style={styles.icon} />
              <input 
                type="text" 
                placeholder="sid" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
                style={styles.input} 
                autoComplete="off"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>PROTOCOL KEY</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} style={styles.icon} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                style={styles.input} 
              />
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'AUTHENTICATE_PROTOCOL'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={{ color: '#475569', fontSize: '11px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {import.meta.env.VITE_ACCESS_KEY ? (
              <><CheckCircle size={10} color="#10b981" /> KEY_STATE: LOADED</>
            ) : (
              <><AlertCircle size={10} color="#f59e0b" /> KEY_STATE: RECOVERY_ENABLED</>
            )}
            <span style={{ opacity: 0.2 }}>|</span>
            SECURED_BY: ARIS_CORE VPC
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0d14', fontFamily: "'Inter', sans-serif", padding: '20px' },
  card: { width: '100%', maxWidth: '400px', background: 'rgba(13,17,24,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
  cardHeader: { textAlign: 'center', marginBottom: '32px' },
  iconContainer: { width: '48px', height: '48px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#94a3b8', lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '12px', color: '#475569' },
  input: { width: '100%', padding: '12px 16px 12px 40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none', transition: 'all 0.2s' },
  errorBox: { padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' },
  submitBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(37,99,235,0.2)' },
  footer: { marginTop: '32px', textAlign: 'center' }
};
