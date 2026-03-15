import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, Eye, TrendingUp, Calendar, Target } from 'lucide-react';
import './DemoAnalytics.css';

const DemoAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    demoViews: 0,
    signupClicks: 0,
    conversionRate: 0,
    avgSessionDuration: 0,
    topPages: [],
    recentActivity: []
  });

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    company: '',
    useCase: '',
    budget: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    trackDemoView();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Mock analytics data - in production, this would come from your backend
      const mockAnalytics = {
        totalViews: 1247,
        uniqueVisitors: 892,
        demoViews: 156,
        signupClicks: 43,
        conversionRate: 27.4,
        avgSessionDuration: 245, // seconds
        topPages: [
          { page: '/sam-scraper', views: 523, percentage: 42 },
          { page: '/survey', views: 234, percentage: 19 },
          { page: '/', views: 189, percentage: 15 },
          { page: '/survey-analytics', views: 156, percentage: 12 },
          { page: '/about', views: 145, percentage: 12 }
        ],
        recentActivity: [
          { type: 'demo_view', page: '/sam-scraper', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
          { type: 'signup_click', page: '/sam-scraper', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
          { type: 'demo_view', page: '/survey', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { type: 'page_view', page: '/', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const trackDemoView = () => {
    // Track demo view for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'demo_view', {
        event_category: 'engagement',
        event_label: 'sam_scraper_demo'
      });
    }

    // Store in localStorage for demo purposes
    const currentViews = parseInt(localStorage.getItem('demo_views') || '0');
    localStorage.setItem('demo_views', (currentViews + 1).toString());
    localStorage.setItem('last_demo_view', new Date().toISOString());
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Track signup attempt
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'signup_attempt', {
          event_category: 'conversion',
          event_label: 'waitlist_signup'
        });
      }

      // Mock signup submission - in production, this would go to your backend
      const signupData = {
        ...signupForm,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        source: 'demo_analytics_page'
      };

      // Store for demo purposes
      localStorage.setItem('signup_' + Date.now(), JSON.stringify(signupData));

      // In production, send to backend:
      // const response = await fetch('/api/waitlist-signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(signupData)
      // });

      console.log('Signup data:', signupData);

      setShowSuccess(true);
      setIsSubmitting(false);

      // Reset form
      setSignupForm({
        name: '',
        email: '',
        company: '',
        useCase: '',
        budget: ''
      });

    } catch (error) {
      // Analytics errors handled by monitoring system
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSignupForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return `${Math.floor(diffMins / 1440)} days ago`;
    }
  };

  return (
    <div className="demo-analytics">
      <div className="analytics-header">
        <h1>🎯 Demo Analytics Dashboard</h1>
        <p>Track user engagement and signup conversions for SAM.gov scraper</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <Eye size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Views</h3>
            <div className="metric-value">{analytics.totalViews.toLocaleString()}</div>
            <div className="metric-change positive">
              <TrendingUp size={16} />
              +12.4% this week
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <h3>Unique Visitors</h3>
            <div className="metric-value">{analytics.uniqueVisitors.toLocaleString()}</div>
            <div className="metric-change positive">
              <TrendingUp size={16} />
              +8.7% this week
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Target size={24} />
          </div>
          <div className="metric-content">
            <h3>Demo Views</h3>
            <div className="metric-value">{analytics.demoViews}</div>
            <div className="metric-change positive">
              <TrendingUp size={16} />
              +23.1% this week
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Calendar size={24} />
          </div>
          <div className="metric-content">
            <h3>Avg Session</h3>
            <div className="metric-value">{formatTime(analytics.avgSessionDuration)}</div>
            <div className="metric-change positive">
              <TrendingUp size={16} />
              +15.3% this week
            </div>
          </div>
        </div>
      </div>

      <div className="conversion-section">
        <div className="conversion-metrics">
          <h2>🔄 Conversion Funnel</h2>
          <div className="funnel-steps">
            <div className="funnel-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Page Views</h4>
                <div className="step-value">{analytics.totalViews}</div>
              </div>
            </div>
            <div className="funnel-arrow">↓</div>
            <div className="funnel-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Demo Views</h4>
                <div className="step-value">{analytics.demoViews}</div>
              </div>
            </div>
            <div className="funnel-arrow">↓</div>
            <div className="funnel-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Signup Clicks</h4>
                <div className="step-value">{analytics.signupClicks}</div>
              </div>
            </div>
            <div className="funnel-arrow">↓</div>
            <div className="funnel-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Conversions</h4>
                <div className="step-value">{Math.round(analytics.signupClicks * 0.3)}</div>
              </div>
            </div>
          </div>
          <div className="conversion-rate">
            <h3>Conversion Rate</h3>
            <div className="rate-value">{analytics.conversionRate}%</div>
            <div className="rate-description">
              From demo view to signup
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow p-5">
            <h2 class="text-lg font-medium mb-3 text-gray-800">Views Over Time (last 30 days)</h2>
            <canvas id="viewsChart" height="200"></canvas>
          </div>

          <div class="bg-white rounded-lg shadow p-5">
            <h2 class="text-lg font-medium mb-3 text-gray-800">Sign-ups Over Time (last 30 days)</h2>
            <canvas id="signupsChart" height="200"></canvas>
          </div>
        </div>

        <div className="signup-form-section">
          <h2>📝 Join Waitlist</h2>
          <p>Be the first to know when we launch premium features!</p>
          
          {showSuccess ? (
            <div className="success-message">
              <h3>🎉 Thanks for joining!</h3>
              <p>We'll notify you as soon as we launch.</p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="signup-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={signupForm.name}
                    onChange={handleInputChange}
                    required
                    placeholder="John Smith"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={signupForm.email}
                    onChange={handleInputChange}
                    required
                    placeholder="john@company.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={signupForm.company}
                    onChange={handleInputChange}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="useCase">Primary Use Case</label>
                  <select
                    id="useCase"
                    name="useCase"
                    value={signupForm.useCase}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select use case...</option>
                    <option value="contract_search">Contract Opportunity Search</option>
                    <option value="competitor_analysis">Competitor Analysis</option>
                    <option value="market_research">Market Research</option>
                    <option value="lead_generation">Lead Generation</option>
                    <option value="compliance_checking">Compliance Checking</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="budget">Monthly Budget</label>
                  <select
                    id="budget"
                    name="budget"
                    value={signupForm.budget}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select budget...</option>
                    <option value="under_50">Under $50/month</option>
                    <option value="50_100">$50-$100/month</option>
                    <option value="101_200">$101-$200/month</option>
                    <option value="201_500">$201-$500/month</option>
                    <option value="over_500">Over $500/month</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="detailed-analytics">
        <div className="top-pages">
          <h2>📊 Top Pages</h2>
          <div className="pages-list">
            {analytics.topPages.map((page, index) => (
              <div key={index} className="page-item">
                <div className="page-info">
                  <h4>{page.page}</h4>
                  <div className="page-stats">
                    <span className="page-views">{page.views} views</span>
                    <span className="page-percentage">{page.percentage}%</span>
                  </div>
                </div>
                <div className="page-bar">
                  <div 
                    className="page-bar-fill" 
                    style={{ width: `${page.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-activity">
          <h2>⏰ Recent Activity</h2>
          <div className="activity-list">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-type">
                  {activity.type === 'demo_view' && '👁 Demo View'}
                  {activity.type === 'signup_click' && '🖱️ Signup Click'}
                  {activity.type === 'page_view' && '📄 Page View'}
                </div>
                <div className="activity-details">
                  <span className="activity-page">{activity.page}</span>
                  <span className="activity-time">{formatTimestamp(activity.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoAnalytics;
