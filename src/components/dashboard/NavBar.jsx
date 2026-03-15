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
    const url = window.location.origin + window.location.pathname;
    if (navigator.share) {
      navigator.share({ 
        title: 'BidSmith Intelligence Report', 
        url 
      }).catch(() => {});
    } else {
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
        '_blank', 'noopener,noreferrer'
      );
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
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
    color: '#5a7a9a',
    border: '1px solid #1a2840',
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

  const hoverOn  = e => { e.currentTarget.style.color = '#d4e4f7'; e.currentTarget.style.borderColor = '#1e3050'; };
  const hoverOff = e => { e.currentTarget.style.color = e.currentTarget.dataset.copied ? '#22c55e' : '#5a7a9a'; e.currentTarget.style.borderColor = e.currentTarget.dataset.copied ? '#22c55e' : '#1a2840'; };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 24px',
      height: '68px',
      background: 'var(--nav-bg)',
      borderBottom: '1px solid var(--nav-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      gap: '20px',
    }}>

      {/* Brand */}
      <a href="/" className="navbar-brand-link" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '14px', 
        textDecoration: 'none',
      }}>
        {onBack && (
          <button 
            onClick={(e) => { e.preventDefault(); onBack(); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#d4e4f7',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px 0 0',
              marginRight: '8px',
              borderRight: '1px solid var(--nav-border)',
              height: '32px',
              transition: 'color 0.2s ease'
            }}
            aria-label="Back to home"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="brand-logo-zoom" style={{ display: 'flex', alignItems: 'center', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <Shield size={24} color="#1e7fff" style={{ flexShrink: 0 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="brand-name-nav" style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800, 
            fontSize: '1.25rem', 
            letterSpacing: '-0.02em', 
            color: '#ffffff',
            whiteSpace: 'nowrap',
            transition: 'color 0.2s ease, transform 0.2s ease'
          }}>
            BidSmith <span style={{ color: '#1e7fff', fontFamily: "'Space Mono', monospace", fontSize: '0.9rem', letterSpacing: '0.1em', marginLeft: '4px' }}>INTEL</span>
          </span>
          <span className="hide-mobile" style={{
            background: 'rgba(30,127,255,0.1)', border: '1px solid rgba(30,127,255,0.3)',
            color: '#1e7fff', fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
            letterSpacing: '0.1em', fontFamily: "'Space Mono', monospace", fontWeight: 800,
            flexShrink: 0,
          }}>BETA</span>
        </div>
      </a>

      {/* Actions */}
      <div className="navbar-actions">

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
          style={{ marginRight: '4px', flexShrink: 0 }}
        >
          {isDark ? <><Sun size={11} /><span className="nav-btn-label"> LIGHT</span></> : <><Moon size={11} /><span className="nav-btn-label"> DARK</span></>}
        </button>

        {/* PDF */}
        <button
          style={btnStyle({ opacity: pdfLoading ? 0.6 : 1 })}
          onClick={handlePDF}
          disabled={pdfLoading}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          <FileText size={12} />
          <span className="nav-btn-label">{pdfLoading ? 'SAVING...' : 'PDF'}</span>
        </button>

        {/* Share */}
        <button style={btnStyle()} onClick={handleShare} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
          <Share2 size={12} />
          <span className="nav-btn-label">SHARE</span>
        </button>

        {/* Copy Link */}
        <button
          style={btnStyle({ color: copied ? '#22c55e' : '#5a7a9a', borderColor: copied ? '#22c55e' : '#1a2840' })}
          onClick={handleCopyLink}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          {copied ? <Check size={12} /> : <Link size={12} />}
          <span className="nav-btn-label">{copied ? 'COPIED!' : 'LINK'}</span>
        </button>

      </div>
    </nav>
  );
};

export default NavBar;
