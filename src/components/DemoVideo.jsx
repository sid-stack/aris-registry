import React from 'react';

export default function DemoVideo() {
  return (
    <video
      src="/ARIS Labs Demo.mp4"
      autoPlay
      loop
      muted
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
    />
  );
}
