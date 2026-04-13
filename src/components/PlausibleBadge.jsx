import React from 'react';
import { BarChart3, Shield, Zap } from 'lucide-react';
import './PlausibleBadge.css';

const PlausibleBadge = ({ showDetails = false }) => {
  return (
    <div className="plausible-badge">
      <div className="plausible-info">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>Privacy-Focused Analytics</span>
        </div>
        {showDetails && (
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Lightweight script</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span>No cookies required</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>GDPR compliant</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlausibleBadge;
