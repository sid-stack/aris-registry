import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, Bug } from 'lucide-react';

const FatalErrorBanner = ({ 
  error = null, 
  onDismiss = null, 
  onRetry = null,
  showDetails = false,
  autoHide = false,
  autoHideDelay = 10000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(autoHideDelay / 1000);

  useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (!isVisible) {
    return null;
  }

  // Default error if none provided
  const defaultError = {
    message: 'A critical error has occurred',
    code: 'FATAL_ERROR',
    timestamp: new Date().toISOString(),
    context: 'Unknown',
    stack: null
  };

  const currentError = error || defaultError;

  return (
    <div className="fatal-error-banner" style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: 9999,
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      borderBottom: '1px solid #991b1b',
      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
      animation: 'slideDown 0.3s ease-out',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Mobile-first main container */}
      <div style={{
        padding: '12px 16px',
        maxWidth: '100vw'
      }}>
        {/* Header row with icon and message */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '8px'
        }}>
          {/* Error Icon - Mobile optimized */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <AlertTriangle size={14} color="#fff" />
          </div>

          {/* Error Message - Mobile first */}
          <div style={{
            flex: 1,
            minWidth: 0,
            paddingRight: '8px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '4px',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}>
              {currentError.message}
            </div>
            
            {/* Error meta info - Mobile optimized */}
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
              lineHeight: '1.4'
            }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                fontWeight: 500
              }}>
                {currentError.code}
              </span>
              
              {currentError.context && (
                <span style={{
                  fontSize: '10px',
                  opacity: 0.9
                }}>
                  {currentError.context}
                </span>
              )}
              
              {autoHide && timeRemaining > 0 && (
                <span style={{
                  fontSize: '10px',
                  opacity: 0.7,
                  fontWeight: 500
                }}>
                  {timeRemaining}s
                </span>
              )}
            </div>
          </div>

          {/* Close button - Always visible on mobile */}
          <button
            onClick={handleDismiss}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>

        {/* Action buttons - Mobile stack layout */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingLeft: '36px' // Align with error message
        }}>
          {/* Retry button */}
          {onRetry && (
            <button
              onClick={handleRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: 'fit-content',
                maxWidth: '100%'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <RefreshCw size={12} />
              Try Again
            </button>
          )}

          {/* Details toggle button */}
          {showDetails && (
            <button
              onClick={toggleExpanded}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: 'fit-content',
                maxWidth: '100%'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <Bug size={12} />
              {expanded ? 'Hide Details' : 'Show Details'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details - Mobile optimized */}
      {expanded && showDetails && (
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: "'IBM Plex Mono', monospace",
            lineHeight: '1.5'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#fff', fontSize: '12px' }}>Error Details</strong>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <strong>Code:</strong> {currentError.code}
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <strong>Time:</strong> {new Date(currentError.timestamp).toLocaleString()}
            </div>
            
            {currentError.context && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Context:</strong> {currentError.context}
              </div>
            )}
            
            {currentError.stack && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Stack Trace:</strong>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px',
                  borderRadius: '4px',
                  marginTop: '8px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '10px',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {currentError.stack}
                </pre>
              </div>
            )}
            
            <div style={{ 
              marginTop: '16px', 
              fontSize: '10px', 
              opacity: 0.7,
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              If this error persists, please contact support with the error code above.
            </div>
          </div>
        </div>
      )}

      {/* Mobile-first responsive styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .fatal-error-banner {
          box-sizing: border-box;
        }

        /* Tablet and up - adjust layout */
        @media (min-width: 768px) {
          .fatal-error-banner > div:first-child {
            padding: 16px 24px;
          }
          
          .fatal-error-banner > div:first-child > div:first-child {
            align-items: center;
            margin-bottom: 0;
          }
          
          .fatal-error-banner > div:first-child > div:first-child > div:first-child {
            width: 32px;
            height: 32px;
            margin-top: 0;
          }
          
          .fatal-error-banner > div:first-child > div:first-child > div:first-child svg {
            width: 18px;
            height: 18px;
          }
          
          .fatal-error-banner > div:first-child > div:first-child > div:nth-child(2) > div:first-child {
            font-size: '15px';
            margin-bottom: '2px';
          }
          
          .fatal-error-banner > div:first-child > div:first-child > div:nth-child(2) > div:nth-child(2) {
            flexWrap: 'nowrap';
          }
          
          .fatal-error-banner > div:first-child > div:nth-child(2) {
            flexDirection: 'row';
            alignItems: 'center';
            gap: '12px';
            paddingLeft: 0;
            marginTop: '8px';
          }
          
          .fatal-error-banner > div:first-child > div:nth-child(2) button {
            padding: '6px 12px';
            fontSize: '12px';
          }
        }

        /* Desktop - further refinements */
        @media (min-width: 1024px) {
          .fatal-error-banner {
            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)';
          }
          
          .fatal-error-banner > div:first-child {
            padding: '12px 20px';
          }
        }
      `}</style>
    </div>
  );
};

export default FatalErrorBanner;
