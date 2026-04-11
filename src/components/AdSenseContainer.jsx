import { useEffect, useRef } from 'react';
import { devError, devWarn } from '../utils/devLog';
import './AdSenseContainer.css';

/**
 * AdSenseContainer
 *
 * A reusable Google AdSense display ad unit.
 *
 * Props:
 *   slot       — your AdSense ad-slot ID (required)
 *   format     — 'auto' | 'rectangle' | 'horizontal' | 'vertical' (default: 'auto')
 *   responsive — boolean, enables full-width responsive mode (default: true)
 *   className  — optional extra class names for the wrapper
 *
 * Usage:
 *   <AdSenseContainer slot="1234567890" format="auto" />
 *
 * Prerequisites:
 *   1. Add your AdSense script to index.html ONCE:
 *      <script async
 *        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
 *        crossOrigin="anonymous">
 *      </script>
 *   2. Set VITE_ADSENSE_CLIENT in your .env:
 *      VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
 */
const AdSenseContainer = ({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
}) => {
  const adRef = useRef(null);
  const pushed = useRef(false);

  const clientId = import.meta.env.VITE_ADSENSE_CLIENT;

  useEffect(() => {
    if (!clientId) {
      devWarn('[AdSense] VITE_ADSENSE_CLIENT is not set. Ad will not render.');
      return;
    }

    // Guard: only push once per mount (React strict-mode safe)
    if (pushed.current) return;
    pushed.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      devError('[AdSense] push error:', err);
    }

    return () => {
      // Reset on unmount so re-mount works correctly
      pushed.current = false;
    };
  }, [clientId]);

  // Don't render placeholder markup if no client is configured
  if (!clientId) {
    if (import.meta.env.DEV) {
      return (
        <div className={`adsense-dev-placeholder ${className}`}>
          <span>AdSense Placeholder</span>
          <small>Set VITE_ADSENSE_CLIENT in .env</small>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`adsense-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdSenseContainer;
