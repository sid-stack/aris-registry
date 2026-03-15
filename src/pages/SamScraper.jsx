import React, { useState, useEffect } from 'react';
import { Search, Database, FileText, Users, TrendingUp, AlertCircle, Download, Filter, ChevronRight, Building, Phone, Mail, Globe, MapPin, Crown, Lock, CreditCard } from 'lucide-react';
import ARISChat from '../components/dashboard/ARISChat';
import NavBar from '../components/dashboard/NavBar';
import SubscriptionManager from '../components/SubscriptionManager';
import './SamScraper.css';

const SamScraper = ({ onBack }) => {
  const [theme, setTheme] = useState('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [vectorRecommendations, setVectorRecommendations] = useState([]);
  const [userTier, setUserTier] = useState('free');
  const [searchCount, setSearchCount] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Check usage limits for free tier
    if (userTier === 'free' && searchCount >= 5) {
      setShowSubscriptionModal(true);
      return;
    }
    
    setSearchCount(prev => prev + 1);
    setLoading(true);
    try {
      // Mock API call for SAM.gov scraping
      const response = await fetch('/api/sam-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, filter: activeFilter })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setVectorRecommendations(data.recommendations || []);
      } else {
        // Fallback mock data
        const mockResults = [
          {
            id: 1,
            businessName: "Federal Construction Solutions LLC",
            ownerName: "John Smith",
            address: "123 Government St, Washington DC 20500",
            phone: "(555) 123-4567",
            email: "info@federalconstruction.com",
            website: "www.federalconstruction.com",
            naicsCode: "236220",
            capability: "Commercial and Institutional Building Construction",
            samStatus: "Active",
            lastUpdated: "2024-03-15"
          },
          {
            id: 2,
            businessName: "Defense Technology Innovations",
            ownerName: "Sarah Johnson",
            address: "456 Defense Ave, Arlington VA 22201",
            phone: "(555) 987-6543",
            email: "contact@defensetech.com",
            website: "www.defensetech.com",
            naicsCode: "541715",
            capability: "Research and Development in the Physical, Engineering, and Life Sciences",
            samStatus: "Active",
            lastUpdated: "2024-03-14"
          },
          {
            id: 3,
            businessName: "Healthcare Systems Group",
            ownerName: "Michael Chen",
            address: "789 Medical Blvd, Bethesda MD 20814",
            phone: "(555) 456-7890",
            email: "admin@healthcaresystems.com",
            website: "www.healthcaresystems.com",
            naicsCode: "621499",
            capability: "Ambulatory Health Care Services",
            samStatus: "Active",
            lastUpdated: "2024-03-13"
          }
        ];
        setSearchResults(mockResults);
        
        // Mock vector recommendations
        const mockRecommendations = [
          {
            type: "similar_business",
            title: "Similar Government Contractors",
            items: [
              "Advanced Engineering Solutions",
              "Strategic Defense Partners",
              "Federal Healthcare Associates"
            ]
          },
          {
            type: "opportunity_match",
            title: "Matching Opportunities",
            items: [
              "DOD Construction Contract - $2.5M",
              "VA Healthcare Services - $1.2M",
              "GSA IT Modernization - $3.8M"
            ]
          }
        ];
        setVectorRecommendations(mockRecommendations);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Check if user has permission to export
    if (userTier === 'free') {
      setShowSubscriptionModal(true);
      return;
    }
    
    const csvContent = [
      ['Business Name', 'Owner Name', 'Address', 'Phone', 'Email', 'Website', 'NAICS Code', 'Capability'],
      ...searchResults.map(result => [
        result.businessName,
        result.ownerName,
        result.address,
        result.phone,
        result.email,
        result.website,
        result.naicsCode,
        result.capability
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sam-contractors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleChatLog = (log) => {
    // Chat logs handled by analytics in production
  };

  const handleCommand = (command) => {
    // Commands handled by analytics in production
  };

  const handleUpgrade = (tierId) => {
    setUserTier(tierId);
    setShowSubscriptionModal(false);
    // Track upgrade event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'subscription_upgrade', {
        event_category: 'monetization',
        event_label: tierId,
        value: tierId === 'professional' ? 299 : tierId === 'enterprise' ? 999 : 0
      });
    }
  };

  const remainingSearches = userTier === 'free' ? Math.max(0, 5 - searchCount) : 'Unlimited';

  const filters = [
    { id: 'all', label: 'All Contractors', icon: <Users size={16} /> },
    { id: 'active', label: 'Active Only', icon: <TrendingUp size={16} /> },
    { id: 'construction', label: 'Construction', icon: <Building size={16} /> },
    { id: 'defense', label: 'Defense', icon: <Globe size={16} /> },
    { id: 'healthcare', label: 'Healthcare', icon: <FileText size={16} /> }
  ];

  return (
    <div className={`sam-scraper ${theme}`}>
      <NavBar theme={theme} onToggleTheme={toggleTheme} onBack={onBack} />
      
      <div className="sam-scraper-container">
        <header className="sam-scraper-header">
          <div className="header-content">
            <div className="header-text">
              <h1>
                <Database size={32} />
                SAM.gov Intelligence Scraper
              </h1>
              <p>
                Advanced data extraction and vector-powered recommendations for government contracting opportunities
              </p>
            </div>
            <div className="header-stats">
              <div className="stat">
                <div className="stat-number">2.4M</div>
                <div className="stat-label">Active Contractors</div>
              </div>
              <div className="stat">
                <div className="stat-number">850K</div>
                <div className="stat-label">Opportunities</div>
              </div>
              <div className="stat">
                <div className="stat-number">12K</div>
                <div className="stat-label">Daily Updates</div>
              </div>
            </div>
          </div>
        </header>

        <section className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search contractors by name, NAICS code, capability, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button onClick={handleSearch} disabled={loading} className="search-button">
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="filters">
              {filters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`filter-button ${activeFilter === filter.id ? 'active' : ''}`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {vectorRecommendations.length > 0 && (
          <section className="recommendations-section">
            <h2>
              <TrendingUp size={24} />
              Vector-Powered Recommendations
            </h2>
            <div className="recommendations-grid">
              {vectorRecommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <h3>{rec.title}</h3>
                  <ul>
                    {rec.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <ChevronRight size={14} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="results-section">
            <div className="results-header">
              <h2>
                <Users size={24} />
                Search Results ({searchResults.length})
              </h2>
              <div className="usage-info">
                {userTier === 'free' && (
                  <div className="usage-remaining">
                    <span className="remaining-count">{remainingSearches}</span>
                    <span className="usage-label">searches remaining this month</span>
                    <button 
                      onClick={() => setShowSubscriptionModal(true)}
                      className="upgrade-button"
                    >
                      <Crown size={14} />
                      Upgrade
                    </button>
                  </div>
                )}
                {userTier !== 'free' && (
                  <div className="current-tier">
                    <span className="tier-badge">{userTier}</span>
                    <span className="usage-label">Unlimited searches</span>
                  </div>
                )}
              </div>
              {searchResults.length > 0 && userTier !== 'free' && (
                <button onClick={handleExport} className="export-button">
                  <Download size={16} />
                  Export CSV
                </button>
              )}
            </div>

          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Scraping SAM.gov database...</p>
            </div>
          )}

          {!loading && searchResults.length === 0 && searchQuery && (
            <div className="empty-state">
              <AlertCircle size={48} />
              <h3>No results found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          )}

          <div className="results-grid">
            {searchResults.map(result => (
              <div key={result.id} className="contractor-card">
                <div className="contractor-header">
                  <h3>{result.businessName}</h3>
                  <span className={`status ${result.samStatus.toLowerCase()}`}>
                    {result.samStatus}
                  </span>
                </div>
                
                <div className="contractor-info">
                  <div className="info-item">
                    <Users size={16} />
                    <span>{result.ownerName}</span>
                  </div>
                  <div className="info-item">
                    <MapPin size={16} />
                    <span>{result.address}</span>
                  </div>
                  <div className="info-item">
                    <Phone size={16} />
                    <span>{result.phone}</span>
                  </div>
                  <div className="info-item">
                    <Mail size={16} />
                    <span>{result.email}</span>
                  </div>
                  <div className="info-item">
                    <Globe size={16} />
                    <span>{result.website}</span>
                  </div>
                </div>

                <div className="contractor-details">
                  <div className="detail-item">
                    <strong>NAICS Code:</strong> {result.naicsCode}
                  </div>
                  <div className="detail-item">
                    <strong>Capability:</strong> {result.capability}
                  </div>
                  <div className="detail-item">
                    <strong>Last Updated:</strong> {result.lastUpdated}
                  </div>
                </div>

                <div className="contractor-actions">
                  <button 
                    onClick={() => setSelectedContract(result)}
                    className="action-button primary"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="action-button secondary"
                  >
                    Analyze with AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedContract && (
          <div className="contractor-modal" onClick={() => setSelectedContract(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedContract.businessName}</h2>
                <button onClick={() => setSelectedContract(null)} className="close-button">
                  ×
                </button>
              </div>
              <div className="modal-body">
                {/* Detailed contractor information */}
                <div className="detail-section">
                  <h3>Contact Information</h3>
                  <p><strong>Owner:</strong> {selectedContract.ownerName}</p>
                  <p><strong>Address:</strong> {selectedContract.address}</p>
                  <p><strong>Phone:</strong> {selectedContract.phone}</p>
                  <p><strong>Email:</strong> {selectedContract.email}</p>
                  <p><strong>Website:</strong> {selectedContract.website}</p>
                </div>
                <div className="detail-section">
                  <h3>Business Details</h3>
                  <p><strong>NAICS Code:</strong> {selectedContract.naicsCode}</p>
                  <p><strong>Capability:</strong> {selectedContract.capability}</p>
                  <p><strong>SAM Status:</strong> {selectedContract.samStatus}</p>
                  <p><strong>Last Updated:</strong> {selectedContract.lastUpdated}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isChatOpen && (
          <div className="chat-overlay">
            <div className="chat-container">
              <div className="chat-header">
                <h3>AI Contract Analysis</h3>
                <button onClick={() => setIsChatOpen(false)} className="close-button">×</button>
              </div>
              <ARISChat 
                selectedContext={selectedContract}
                onLog={handleChatLog}
                onCommand={handleCommand}
              />
            </div>
          </div>
        )}
      {showSubscriptionModal && (
          <div className="subscription-modal">
            <div className="modal-content">
              <button onClick={() => setShowSubscriptionModal(false)} className="close-button">×</button>
              <SubscriptionManager 
                currentTier={userTier}
                onUpgrade={handleUpgrade}
                onManageBilling={() => console.log('Manage billing')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SamScraper;
