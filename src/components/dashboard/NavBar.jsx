import React from 'react';
import { FileText, FileDown, Share2, Link, Shield, Sun, Moon } from 'lucide-react';

const NavBar = ({ theme, onToggleTheme }) => {
  const isDark = theme === 'dark';

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
          fontWeight: 700,
          fontSize: '13px',
          letterSpacing: '0.05em',
          color: '#d4e4f7',
        }}>
          BIDSMITH <span style={{ color: '#1e7fff' }}>INTELLIGENCE</span>
        </span>
        <span style={{
          background: 'rgba(30,127,255,0.1)',
          border: '1px solid rgba(30,127,255,0.3)',
          color: '#1e7fff',
          fontSize: '9px',
          padding: '2px 7px',
          borderRadius: '2px',
          letterSpacing: '0.1em',
          fontFamily: "'Space Mono', monospace",
          fontWeight: 700,
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

        {/* Nav export buttons (decorative — real exports in masthead) */}
        {[
          { icon: <FileText size={13} />, label: 'PDF' },
          { icon: <FileDown size={13} />, label: 'DOCX' },
          { icon: <Share2 size={13} />, label: 'SHARE' },
          { icon: <Link size={13} />, label: 'COPY LINK' },
        ].map(({ icon, label }) => (
          <button key={label} style={{
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
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#d4e4f7'; e.currentTarget.style.borderColor = '#1e3050'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#5a7a9a'; e.currentTarget.style.borderColor = '#1a2840'; }}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;
