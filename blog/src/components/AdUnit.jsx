import React, { useState, useEffect, useRef } from 'react';

const AdUnit = ({ slot, type = 'horizontal' }) => {
  const pushed = useRef(false);
  const clientId = "ca-pub-1777022448474054"; // Hardcoded for this subdomain specifically

  useEffect(() => {
    if (!pushed.current && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, []);

  return (
    <div style={{ margin: '20px 0', minHeight: '90px', display: 'flex', justifyContent: 'center' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdUnit;
