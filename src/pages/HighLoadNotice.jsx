export default function HighLoadNotice() {
  return (
    <main style={styles.page}>
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <section style={styles.card} aria-label="High load notice">
        <div style={styles.kicker}>BidSmith</div>
        <h1 style={styles.title}>Facing high server load currently, try again after some time</h1>
        <p style={styles.body}>
          The audit workspace is temporarily unavailable while capacity stabilizes.
        </p>
        <div style={styles.actions}>
          <a href="/" style={{ ...styles.button, ...styles.primaryButton }}>Return Home</a>
          <a href="/contact" style={{ ...styles.button, ...styles.secondaryButton }}>Contact Us</a>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'radial-gradient(circle at top, rgba(29,78,216,0.14), transparent 34%), #07111f',
    color: '#e2e8f0',
    fontFamily: "'Inter', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: '-140px',
    left: '-120px',
    width: '320px',
    height: '320px',
    borderRadius: '999px',
    background: 'rgba(96,165,250,0.14)',
    filter: 'blur(40px)',
  },
  glowBottom: {
    position: 'absolute',
    right: '-100px',
    bottom: '-120px',
    width: '280px',
    height: '280px',
    borderRadius: '999px',
    background: 'rgba(14,165,233,0.12)',
    filter: 'blur(40px)',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '680px',
    padding: '40px 36px',
    borderRadius: '24px',
    border: '1px solid rgba(148,163,184,0.22)',
    background: 'rgba(8,15,28,0.9)',
    boxShadow: '0 30px 80px rgba(2,6,23,0.45)',
    textAlign: 'center',
  },
  kicker: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#93c5fd',
    marginBottom: '14px',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
    lineHeight: 1.12,
    fontWeight: 800,
    color: '#f8fafc',
  },
  body: {
    margin: '18px auto 0',
    maxWidth: '520px',
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#94a3b8',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '28px',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '150px',
    padding: '12px 18px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 700,
    textDecoration: 'none',
  },
  primaryButton: {
    background: '#eff6ff',
    color: '#0f172a',
  },
  secondaryButton: {
    background: 'transparent',
    color: '#cbd5e1',
    border: '1px solid rgba(148,163,184,0.28)',
  },
};
