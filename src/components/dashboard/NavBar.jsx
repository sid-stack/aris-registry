import React, { useState } from 'react';
import { FileText, Share2, Link, Shield, Sun, Moon, Check } from 'lucide-react';
import { triggerPDFExport } from './ExportToolbar';

const NavBar = ({ theme, onToggleTheme }) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePDF = async () => {
    setPdfLoading(true);
    await triggerPDFExport();
    setPdfLoading(false);
  };

  const handleShare = () => {
    const url   = window.location.href;
    const text  = 'BidSmith Intelligence Report — DHA Video Imaging Archive (DHANOISS022426). Pre-bid risk analysis via ARIS Protocol.';
    // Try native share API first (mobile), fall back to Twitter/X
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard API
      const ta = document.createElement('textarea');
      ta.value = window.location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '5px 10px',
    background: 'transparent',
    color: '#5a7a9a',
    border: '1px solid #1a2840',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '10px',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.08em',
    fontWeight: 700,
    transition: 'all 0.15s',
  };

  const hoverOn  = e => { e.currentTarget.style.color = '#d4e4f7'; e.currentTarget.style.borderColor = '#1e3050'; };
  const hoverOff = e => { e.currentTarget.style.color = '#5a7a9a'; e.currentTarget.style.borderColor = '#1a2840'; };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 24px',
      height: '52px',
      background: 'var(--nav-bg)',
      borderBottom: '1px solid var(--nav-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Shield size={16} color="#1e7fff" />
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', color: '#d4e4f7',
        }}>
          BIDSMITH <span style={{ color: '#1e7fff' }}>INTELLIGENCE</span>
        </span>
        <span style={{
          background: 'rgba(30,127,255,0.1)', border: '1px solid rgba(30,127,255,0.3)',
          color: '#1e7fff', fontSize: '9px', padding: '2px 7px', borderRadius: '2px',
          letterSpacing: '0.1em', fontFamily: "'Space Mono', monospace", fontWeight: 700,
        }}>BETA</span>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ marginRight: '8px' }}
        >
          {isDark ? <><Sun size={12} /> LIGHT</> : <><Moon size={12} /> DARK</>}
        </button>

        {/* PDF */}
        <button
          style={{ ...btnStyle, opacity: pdfLoading ? 0.6 : 1 }}
          onClick={handlePDF}
          disabled={pdfLoading}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          <FileText size={13} />
          {pdfLoading ? 'GENERATING...' : 'PDF'}
        </button>

        {/* Share */}
        <button style={btnStyle} onClick={handleShare} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
          <Share2 size={13} /> SHARE
        </button>

        {/* Copy Link */}
        <button
          style={{ ...btnStyle, color: copied ? '#22c55e' : '#5a7a9a', borderColor: copied ? '#22c55e' : '#1a2840' }}
          onClick={handleCopyLink}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          {copied ? <Check size={13} /> : <Link size={13} />}
          {copied ? 'COPIED!' : 'COPY LINK'}
        </button>

      </div>
    </nav>
  );
};

export default NavBar;
