export default function NotFound() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <p style={styles.code}>404</p>
        <h1 style={styles.title}>Page not found</h1>
        <p style={styles.copy}>
          The page you requested does not exist or has been moved.
        </p>
        <a href="/" style={styles.link}>Go back to home</a>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f8fafc",
    padding: 20,
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 28,
    textAlign: "center",
  },
  code: { margin: 0, color: "#4338ca", fontWeight: 800, letterSpacing: "0.04em" },
  title: { margin: "4px 0 10px", color: "#0f172a", fontSize: "1.9rem" },
  copy: { margin: 0, color: "#475569", lineHeight: 1.6 },
  link: { display: "inline-block", marginTop: 14, color: "#4338ca", textDecoration: "none", fontWeight: 700 },
};

