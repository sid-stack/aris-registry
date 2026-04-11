import "./NotFound.css";

export default function NotFound() {
  const requestedPath = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <main className="wanderer-page">
      <div className="wanderer-glow wanderer-glow-left" />
      <div className="wanderer-glow wanderer-glow-right" />

      <section className="wanderer-card" role="region" aria-label="Not found">
        <p className="wanderer-code">404</p>
        <h1 className="wanderer-title">Uhuh Oh Wanderer!</h1>
        <p className="wanderer-copy">
          This route is outside known coordinates. The page was removed, renamed, or never existed.
        </p>

        <p className="wanderer-path">Requested: {requestedPath}</p>

        <div className="wanderer-actions">
          <a href="/" className="wanderer-btn wanderer-btn-primary">Return Home</a>
          <a href="/dashboard" className="wanderer-btn wanderer-btn-secondary">Open Workspace</a>
        </div>
      </section>
    </main>
  );
}
