/**
 * Hides workspace UI on viewports where the Command Center layout is unsupported.
 * Uses CSS media queries only (no layout shift / hydration mismatch).
 */
import { Monitor } from "lucide-react";
import "./DesktopOnlyGate.css";

export default function DesktopOnlyGate({ children, onBackHome }) {
  return (
    <div className="desktop-only-gate-root">
      <div
        className="desktop-only-gate-mobile"
        role="alertdialog"
        aria-labelledby="desktop-only-title"
        aria-describedby="desktop-only-desc"
      >
        <Monitor size={40} color="#93c5fd" strokeWidth={1.75} aria-hidden style={{ marginBottom: 18 }} />
        <h1 id="desktop-only-title">Open the workspace on a desktop</h1>
        <p id="desktop-only-desc">
          The BidSmith Command Center is built for wide screens — multi-panel layout, hot RFPs, and
          analysis rails do not work well on phones or small tablets. Use a laptop or desktop (about
          1024px wide or larger), or continue on the marketing site below.
        </p>
        <div className="desktop-only-gate-actions">
          <a className="desktop-only-gate-btn desktop-only-gate-btn--primary" href="/">
            Back to BidSmith home
          </a>
          <button type="button" className="desktop-only-gate-btn desktop-only-gate-btn--ghost" onClick={onBackHome}>
            ← Go back
          </button>
        </div>
      </div>
      <div className="desktop-only-gate-desktop">{children}</div>
    </div>
  );
}
