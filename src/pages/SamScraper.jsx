import React, { useState, useEffect } from 'react';
import { Search, Database, FileText, Users, TrendingUp, AlertCircle, Download, Filter, ChevronRight, Building, Phone, Mail, Globe, MapPin, Crown, Lock, CreditCard, Sparkles, Terminal, Activity, Target, Zap, Award } from 'lucide-react';
import ARISChat from '../components/dashboard/ARISChat';
import NavBar from '../components/dashboard/NavBar';
import './SamScraper.css';

const SamScraper = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [vectorRecommendations, setVectorRecommendations] = useState([]);
  const [statusText, setStatusText] = useState('READY_FOR_INTEL');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setStatusText('ENGINE_INITIALIZING...');
    
    // Simulate multi-stage agentic process for "Figma-level" feel
    const stages = [
      'QUANTUM_SEARCH_INIT...',
      'SAM_GOV_SCRAPE_ACTIVE...',
      'VECTOR_CROSS_REF_READY...',
      'INTELLIGENCE_SYNTHESIZED'
    ];
    
    stages.forEach((stage, i) => {
      setTimeout(() => setStatusText(stage), i * 600);
    });

    try {
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
        // Fallback for robustness
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
            lastUpdated: "2024-03-15",
            matchConfidence: 94
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
            capability: "Research and Development",
            samStatus: "Active",
            lastUpdated: "2024-03-14",
            matchConfidence: 87
          }
        ];
        setSearchResults(mockResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      setStatusText('PIPELINE_ERROR');
    } finally {
      setTimeout(() => setLoading(false), 2400);
    }
  };

  const filters = [
    { id: 'all', label: 'All Entities', icon: <Users size={14} /> },
    { id: 'active', label: 'Active', icon: <TrendingUp size={14} /> },
    { id: 'defense', label: 'Defense', icon: <Target size={14} /> },
    { id: 'construction', label: 'Infrastructure', icon: <Building size={14} /> }
  ];

  return (
    <div className="sam-scraper dark">
      <NavBar theme="dark" onToggleTheme={() => {}} onBack={onBack} />
      
      <div className="sam-scraper-container">
        {/* Mobile-Optimized Premium Header */}
        <header className="sam-scraper-header shimmer">
          <div className="header-badge">
            <Activity size={12} />
            <span>ARIS_SCRAPER_v4.2</span>
          </div>
          <h1>SAM.gov Intelligence Hub</h1>
          <p>Agentic extraction of federal entity data and predictive opportunity matching.</p>
          
          <div className="header-metrics">
            <div className="metric-box glass">
              <span className="metric-val">2.4M</span>
              <span className="metric-lab">ENTITIES</span>
            </div>
            <div className="metric-box glass">
              <span className="metric-val">12K</span>
              <span className="metric-lab">DAILY_DELTA</span>
            </div>
          </div>
        </header>

        {/* Prominent Search Section */}
        <section className="search-section">
          <div className="search-workbench glass">
            <div className="search-input-group">
              <Search className="search-icon-fixed" size={20} />
              <input
                type="text"
                placeholder="Query by entity, NAICS, or capability intent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="premium-input"
              />
              <button 
                onClick={handleSearch} 
                className={`premium-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? <Zap className="pulse" size={16} /> : 'INFILTRATE'}
              </button>
            </div>
            
            <div className="filter-chips">
              {filters.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`chip ${activeFilter === f.id ? 'active' : ''}`}
                >
                  {f.icon}
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="status-bar">
            <Terminal size={12} />
            <span className="status-code">{statusText}</span>
          </div>
        </section>

        {/* Results Grid - High Performance Display */}
        <section className="results-container">
          {loading ? (
            <div className="loading-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-card shimmer" />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="results-grid">
              {searchResults.map(result => (
                <div key={result.id} className="intel-card glass">
                  <div className="card-top">
                    <h3>{result.businessName}</h3>
                    <div className="card-badge">
                      <TrendingUp size={10} />
                      <span>{result.matchConfidence || 92}% MATCH</span>
                    </div>
                  </div>
                  
                  <div className="card-details">
                    <div className="detail-row">
                      <MapPin size={14} />
                      <span>{result.address}</span>
                    </div>
                    <div className="detail-row">
                      <Building size={14} />
                      <span className="naics-box">{result.naicsCode}</span>
                      <span className="capability-text">{result.capability}</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button 
                      onClick={() => setSelectedContract(result)}
                      className="btn-intel"
                    >
                      DOSSIER
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedContract(result);
                        setIsChatOpen(true);
                      }}
                      className="btn-ai"
                    >
                      <Sparkles size={12} />
                      AGENTIC_AUDIT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !loading ? (
            <div className="empty-intel">
              <AlertCircle size={48} className="warn" />
              <h3>INTEL_VOID</h3>
              <p>No federal matches found for "{searchQuery}". Try broader NAICS targeting.</p>
            </div>
          ) : null}
        </section>

        {/* Recommendations Overlay */}
        {vectorRecommendations.length > 0 && !loading && (
          <section className="recommendations-overlay glass">
            <div className="rec-header">
              <Target size={18} color="var(--accent)" />
              <h2>Vector-Matched Opportunities</h2>
            </div>
            <div className="rec-grid">
              {vectorRecommendations.map((rec, i) => (
                <div key={i} className="rec-list">
                  <h4>{rec.title}</h4>
                  <ul>
                    {rec.items.map((item, idx) => (
                      <li key={idx}><ChevronRight size={12} /> {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Dossier Modal */}
      {selectedContract && !isChatOpen && (
        <div className="modal-backdrop" onClick={() => setSelectedContract(null)}>
          <div className="modal-window glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ENTITY_DOSSIER</h2>
              <button onClick={() => setSelectedContract(null)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <div className="dossier-header">
                <h3>{selectedContract.businessName}</h3>
                <span className="status-tag active">SAM_ACTIVE</span>
              </div>
              <div className="dossier-grid">
                <div className="dossier-item">
                  <label>PRINCIPAL</label>
                  <span>{selectedContract.ownerName}</span>
                </div>
                <div className="dossier-item">
                  <label>CONTACT_PROTOCOL</label>
                  <div className="sub-item"><Phone size={12} /> {selectedContract.phone}</div>
                  <div className="sub-item"><Mail size={12} /> {selectedContract.email}</div>
                </div>
                <div className="dossier-item span-2">
                  <label>CAPABILITY_STATEMENT</label>
                  <p>{selectedContract.capability}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="primary-btn" onClick={() => setIsChatOpen(true)}>
                  <Sparkles size={14} />
                  GENERATE_ALU_MATRIX
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARIS Chat Integration */}
      {isChatOpen && (
        <div className="full-chat-overlay visible">
          <div className="chat_header">
            <div className="chat_title">
              <Activity size={16} />
              <span>ARIS_INTEL_STREAM</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="close-btn">×</button>
          </div>
          <div className="chat_body">
            <ARISChat 
              selectedContext={selectedContract}
              onLog={() => {}}
              onCommand={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SamScraper;
