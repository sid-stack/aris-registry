import React, { useState } from 'react';
import FatalErrorBanner from './FatalErrorBanner';

// Mobile-first testing examples for FatalErrorBanner
export const MobileTestExamples = () => {
  const [activeError, setActiveError] = useState(null);

  const mobileErrors = [
    {
      title: 'Network Error',
      error: {
        message: 'Unable to connect to server. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        timestamp: new Date().toISOString(),
        context: 'Mobile Network',
        stack: null
      },
      autoHide: true,
      autoHideDelay: 8000
    },
    {
      title: 'API Timeout',
      error: {
        message: 'Request timed out. The server took too long to respond.',
        code: 'API_TIMEOUT',
        timestamp: new Date().toISOString(),
        context: 'API Request',
        stack: 'Error: Request timeout\n    at fetch (native)\n    at ApiClient.request (api.js:45)'
      },
      showDetails: true,
      onRetry: () => console.log('Retrying API request...')
    },
    {
      title: 'Authentication Failed',
      error: {
        message: 'Your session has expired. Please log in again.',
        code: 'AUTH_EXPIRED',
        timestamp: new Date().toISOString(),
        context: 'Authentication',
        stack: null
      },
      showDetails: true,
      onRetry: () => console.log('Redirecting to login...')
    },
    {
      title: 'Critical System Error',
      error: {
        message: 'A critical error occurred in the application. Please refresh the page.',
        code: 'CRITICAL_ERROR',
        timestamp: new Date().toISOString(),
        context: 'Application Core',
        stack: 'Error: Critical system failure\n    at App.initialize (app.js:123)\n    at main.js:15\n    at Module.runMain (internal/modules/cjs/loader.js:847)'
      },
      showDetails: true,
      onRetry: () => window.location.reload()
    }
  ];

  return (
    <div style={{
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#0d0f14',
      color: '#e4e4e7',
      minHeight: '100vh'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 700,
        marginBottom: '20px',
        color: '#fff'
      }}>
        Mobile-First Error Banner Tests
      </h2>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <p style={{
          fontSize: '14px',
          lineHeight: '1.5',
          marginBottom: '12px',
          opacity: 0.9
        }}>
          Test the mobile-first FatalErrorBanner component. Each button triggers a different error scenario optimized for mobile devices.
        </p>
        
        <div style={{
          fontSize: '12px',
          opacity: 0.7,
          fontStyle: 'italic'
        }}>
          💡 Try resizing your browser to mobile width to see the responsive behavior
        </div>
      </div>

      <div style={{
        display: 'grid',
        gap: '12px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
      }}>
        {mobileErrors.map((testCase, index) => (
          <button
            key={index}
            onClick={() => setActiveError(testCase)}
            style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '4px'
            }}>
              {testCase.title}
            </div>
            
            <div style={{
              fontSize: '12px',
              opacity: 0.7,
              marginBottom: '8px'
            }}>
              Code: {testCase.error.code}
            </div>
            
            <div style={{
              fontSize: '11px',
              opacity: 0.6,
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {testCase.autoHide && <span>⏱️ Auto-hide</span>}
              {testCase.showDetails && <span>📋 Details</span>}
              {testCase.onRetry && <span>🔄 Retry</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Clear button */}
      {activeError && (
        <button
          onClick={() => setActiveError(null)}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#ef4444',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
          }}
        >
          Clear Error Banner
        </button>
      )}

      {/* Display the active error */}
      {activeError && (
        <FatalErrorBanner
          error={activeError.error}
          onDismiss={() => setActiveError(null)}
          onRetry={activeError.onRetry}
          showDetails={activeError.showDetails || false}
          autoHide={activeError.autoHide || false}
          autoHideDelay={activeError.autoHideDelay || 10000}
        />
      )}

      {/* Mobile viewport indicator */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#fff',
        fontFamily: "'IBM Plex Mono', monospace",
        opacity: 0.7
      }}>
        <div>Viewport: {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px</div>
        <div>Device: {typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : window.innerWidth < 1024 ? 'Tablet' : 'Desktop'}</div>
      </div>
    </div>
  );
};

// Responsive test component
export const ResponsiveTest = () => {
  const [showError, setShowError] = useState(false);

  const responsiveError = {
    message: 'This error banner adapts to your screen size. Try resizing the window!',
    code: 'RESPONSIVE_TEST',
    timestamp: new Date().toISOString(),
    context: 'Responsive Design Test',
    stack: null
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#0d0f14',
      color: '#e4e4e7',
      minHeight: '100vh'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: 700,
        marginBottom: '16px',
        color: '#fff'
      }}>
        Responsive Design Test
      </h2>

      <p style={{
        fontSize: '14px',
        lineHeight: '1.5',
        marginBottom: '24px',
        opacity: 0.9
      }}>
        Click the button below to show an error banner, then resize your browser to see how it adapts:
      </p>

      <button
        onClick={() => setShowError(!showError)}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: 'none',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '24px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {showError ? 'Hide' : 'Show'} Error Banner
      </button>

      {/* Breakpoint indicators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
            📱 Mobile (&lt;768px)
          </h3>
          <ul style={{ fontSize: '12px', opacity: 0.8, margin: 0, paddingLeft: '16px' }}>
            <li>Stacked button layout</li>
            <li>Smaller icons and text</li>
            <li>Tighter spacing</li>
            <li>Full-width buttons</li>
          </ul>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
            📱 Tablet (768px+)
          </h3>
          <ul style={{ fontSize: '12px', opacity: 0.8, margin: 0, paddingLeft: '16px' }}>
            <li>Horizontal button layout</li>
            <li>Medium icons and text</li>
            <li>Balanced spacing</li>
            <li>Inline actions</li>
          </ul>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
            🖥️ Desktop (1024px+)
          </h3>
          <ul style={{ fontSize: '12px', opacity: 0.8, margin: 0, paddingLeft: '16px' }}>
            <li>Optimized spacing</li>
            <li>Enhanced shadows</li>
            <li>Larger touch targets</li>
            <li>Hover effects</li>
          </ul>
        </div>
      </div>

      {showError && (
        <FatalErrorBanner
          error={responsiveError}
          onDismiss={() => setShowError(false)}
          showDetails={true}
          onRetry={() => console.log('Retry clicked')}
        />
      )}
    </div>
  );
};

export default {
  MobileTestExamples,
  ResponsiveTest
};
