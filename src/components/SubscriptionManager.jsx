import React, { useState, useEffect } from 'react';
import { Check, X, CreditCard, Users, Zap, Crown } from 'lucide-react';
import './SubscriptionManager.css';

const SubscriptionManager = ({ currentTier, onUpgrade, onManageBilling }) => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const tiers = [
    {
      id: 'free',
      name: 'Lead Generation Starter',
      price: 'Free',
      description: '5 SAM.gov searches per month',
      features: ['Basic search', 'Limited filters', 'Contact preview'],
      limitations: ['5 searches/month', 'No export', 'No AI analysis'],
      current: currentTier === 'free'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: billingCycle === 'monthly' ? '$299/month' : '$2,990/year',
      description: 'Unlimited searches with advanced features',
      features: ['Unlimited searches', 'Advanced filters', 'Full contact export', 'Vector recommendations', 'AI analysis', 'Priority support'],
      current: currentTier === 'professional',
      savings: billingCycle === 'yearly' ? 'Save $598' : null
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: billingCycle === 'monthly' ? '$999/month' : '$9,990/year',
      description: 'Everything in Professional plus scale',
      features: ['Everything in Professional', 'Bulk search (1000)', 'API access', 'Custom models', 'Dedicated support', 'SLA guarantees', 'White-label options'],
      current: currentTier === 'enterprise',
      savings: billingCycle === 'yearly' ? 'Save $1,998' : null,
      popular: true
    }
  ];

  const creditPacks = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 50,
      price: '$99',
      description: 'Perfect for testing',
     性价比: '1.98 per search'
    },
    {
      id: 'professional',
      name: 'Professional Pack',
      credits: 200,
      price: '$299',
      description: 'Best value for regular use',
     性价比: '1.50 per search',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Pack',
      credits: 500,
      price: '$499',
      description: 'Maximum value for teams',
     性价比: '1.00 per search'
    }
  ];

  const handleUpgrade = (tierId) => {
    if (tierId === 'free') {
      window.location.href = '/sam-scraper';
    } else {
      onUpgrade(tierId);
    }
  };

  const handlePurchaseCredits = (packId) => {
    onUpgrade(`credit_pack_${packId}`);
  };

  return (
    <div className="subscription-manager">
      <div className="subscription-header">
        <h2>Choose Your Plan</h2>
        <div className="billing-toggle">
          <button
            className={`toggle-button ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`toggle-button ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Annual <span className="savings-badge">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="tiers-grid">
        {tiers.map(tier => (
          <div key={tier.id} className={`tier-card ${tier.current ? 'current' : ''} ${tier.popular ? 'popular' : ''}`}>
            {tier.popular && <div className="popular-badge">Most Popular</div>}
            {tier.current && <div className="current-badge">Current Plan</div>}
            
            <div className="tier-header">
              <h3>{tier.name}</h3>
              <div className="tier-price">
                <span className="price">{tier.price}</span>
                {tier.savings && <span className="savings">{tier.savings}</span>}
              </div>
              <p className="tier-description">{tier.description}</p>
            </div>

            <div className="tier-features">
              {tier.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <Check size={16} className="feature-icon" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {tier.limitations && (
              <div className="tier-limitations">
                {tier.limitations.map((limitation, index) => (
                  <div key={index} className="limitation-item">
                    <X size={14} className="limitation-icon" />
                    <span>{limitation}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="tier-actions">
              {tier.current ? (
                <button onClick={onManageBilling} className="manage-button">
                  Manage Billing
                </button>
              ) : (
                <button 
                  onClick={() => handleUpgrade(tier.id)} 
                  className={`upgrade-button ${tier.id === 'enterprise' ? 'enterprise' : ''}`}
                >
                  {tier.id === 'free' ? 'Get Started' : `Upgrade to ${tier.name}`}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="credit-packs-section">
        <h3>Pay-Per-Use Credits</h3>
        <p className="section-description">Flexible credit packs for occasional use</p>
        
        <div className="credit-packs-grid">
          {creditPacks.map(pack => (
            <div key={pack.id} className={`credit-pack ${pack.popular ? 'popular' : ''}`}>
              {pack.popular && <div className="popular-badge">Best Value</div>}
              
              <div className="pack-header">
                <h4>{pack.name}</h4>
                <div className="pack-price">{pack.price}</div>
                <p className="pack-description">{pack.description}</p>
              </div>

              <div className="pack-details">
                <div className="credits-info">
                  <CreditCard size={16} className="credits-icon" />
                  <span>{pack.credits} searches</span>
                </div>
                <div className="efficiency-info">
                  <Zap size={14} className="efficiency-icon" />
                  <span>{pack.性价比}</span>
                </div>
              </div>

              <button 
                onClick={() => handlePurchaseCredits(pack.id)}
                className="purchase-button"
              >
                Purchase Credits
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="value-proposition">
        <div className="value-card">
          <Crown size={24} className="value-icon" />
          <h3>Enterprise Benefits</h3>
          <ul>
            <li>Dedicated account manager</li>
            <li>99.9% uptime SLA</li>
            <li>Priority support (24hr response)</li>
            <li>Custom training sessions</li>
            <li>White-label options</li>
          </ul>
        </div>
      </div>

      {showCancelConfirm && (
        <div className="cancel-modal">
          <div className="modal-content">
            <h3>Cancel Subscription?</h3>
            <p>You'll lose access to premium features at the end of your billing cycle.</p>
            <div className="modal-actions">
              <button onClick={() => setShowCancelConfirm(false)} className="cancel-button">
                Keep Subscription
              </button>
              <button onClick={() => {/* Handle cancellation */}} className="confirm-cancel">
                Cancel Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
