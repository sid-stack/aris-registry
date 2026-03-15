import React, { useState } from 'react';
import { FileText, Share2, Link, Shield, Sun, Moon, Check, ArrowLeft } from 'lucide-react';
import { triggerPDFExport } from './ExportToolbar';

const NavBar = ({ theme, onToggleTheme, onBack }) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePDF = async () => {
    setPdfLoading(true);
    await triggerPDFExport();
    setPdfLoading(false);
  };

  const handleShare = () => {
    const url  = window.location.href;
    const text = 'BidSmith Intelligence Report — DHA Video Imaging Archive (DHANOISS022426). Pre-bid risk analysis via ARIS Protocol.';
    if (navigator.share) {
      navigator.share({ title: 'BidSmith Intelligence Report', text, url }).catch(() => {});
    } else {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        '_blank', 'noopener,noreferrer'
      );
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = window.location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnStyle = (overrides = {}) => ({
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 9px',
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '10px',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.07em',
    fontWeight: 700,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    ...overrides,
  });

  const hoverOn  = e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent)'; };
  const hoverOff = e => { e.currentTarget.style.color = e.currentTarget.dataset.copied ? 'var(--success)' : 'var(--text-secondary)'; e.currentTarget.style.borderColor = e.currentTarget.dataset.copied ? 'var(--success)' : 'var(--border)'; };

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        {onBack && (
          <button 
            className="back-button"
            onClick={onBack}
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
            <span className="back-label">Back</span>
          </button>
        )}
        <Shield size={15} color="#1e7fff" className="brand-icon" />
        <span className="brand-text">
          BIDSMITH <span style={{ color: '#1e7fff' }}>INTEL</span>
        </span>
        <span className="beta-badge">BETA</span>
      </div>

      {/* Actions */}
      <div className="navbar-actions">

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={11} /> : <Moon size={11} />}
          <span className="nav-btn-label">{isDark ? 'LIGHT' : 'DARK'}</span>
        </button>

        {/* PDF */}
        <button
          className={`nav-button ${pdfLoading ? 'loading' : ''}`}
          onClick={handlePDF}
          disabled={pdfLoading}
        >
          <FileText size={12} />
          <span className="nav-btn-label">{pdfLoading ? 'SAVING...' : 'PDF'}</span>
        </button>

        {/* Share */}
        <button className="nav-button" onClick={handleShare}>
          <Share2 size={12} />
          <span className="nav-btn-label">SHARE</span>
        </button>

        {/* Copy Link */}
        <button
          className={`nav-button ${copied ? 'copied' : ''}`}
          onClick={handleCopyLink}
        >
          {copied ? <Check size={12} /> : <Link size={12} />}
          <span className="nav-btn-label">{copied ? 'COPIED!' : 'LINK'}</span>
        </button>

        {/* Mobile menu button */}
        <button className="mobile-menu-toggle" aria-label="Menu">
          <div className="hamburger"></div>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
