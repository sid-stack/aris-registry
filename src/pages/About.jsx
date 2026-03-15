import React from 'react';
import { Briefcase, Users, Building2, Globe, Shield, Rocket, Target } from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';
import './About.css';

const MISSION_VALUES = [
  {
    icon: <Target size={24} color="#3b82f6" />,
    title: "Mission Precision",
    description: "In the Federal space, a 1% error is a disqualification. We build for zero-tolerance environments where compliance is the absolute priority."
  },
  {
    icon: <Shield size={24} color="#3b82f6" />,
    title: "Data Sovereignty",
    description: "Your intellectual property is the moat of your business. Our architecture makes it impossible for us to ever see, store, or leak your bid data."
  },
  {
    icon: <Rocket size={24} color="#3b82f6" />,
    title: "Agentic Velocity",
    description: "Automating the 40-hour RFP shred in 90 seconds. We don't just 'assist'—we deploy agentic pipelines that act as a force multiplier for capture teams."
  }
];

const About = ({ onBack }) => {
  return (
    <div className="about-page">
      <NavBar onBack={onBack} />
      
      <main className="about-main">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-badge">
            <Building2 size={14} color="#3b82f6" />
            <span className="about-badge-text">ARIS LABS // ABOUT</span>
          </div>
          <h1 className="about-title">
            Engineering the Future of Defense Intelligence.
          </h1>
          <p className="about-description">
            Aris Labs is a GovCon-first engineering firm. We build the <strong>Intelligence Workbench</strong> for federal primes who demand absolute data sovereignty and high-performance execution.
          </p>
        </section>

        {/* Our Mission */}
        <section style={{ marginBottom: '80px' }}>
          <h2 className="about-section-label">The Sovereignty Protocol</h2>
          <div className="values-grid">
            {MISSION_VALUES.map((value, i) => (
              <div key={i} className="value-card">
                <div className="value-icon">{value.icon}</div>
                <h3 className="value-title">{value.title}</h3>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The Lab Section */}
        <section className="lab-section">
          <div className="lab-grid">
            <div>
              <h2 className="lab-title">Labs headquarters: San Francisco, CA</h2>
              <p className="lab-text">
                Operating at the intersection of Silicon Valley engineering and Beltway compliance requirements. Our remote-first team is anchored in San Francisco, building the next generation of stateless defense software.
              </p>
              <div className="lab-stats">
                <div className="stat-item">
                  <Globe size={14} color="#3b82f6" />
                  GLOBAL OPERATIONS
                </div>
                <div className="stat-item">
                  <Users size={14} color="#3b82f6" />
                  FEDERAL-FIRST TEAM
                </div>
              </div>
            </div>
            <div className="lab-cta-card">
               <Briefcase size={40} color="#3b82f6" style={{ marginBottom: '20px', opacity: 0.5 }} />
               <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5', marginBottom: '10px' }}>Interested in Joining?</h4>
               <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '20px' }}>We are always looking for security-minded engineers and GovCon specialists.</p>
               <a href="mailto:careers@bidsmith.pro" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid #3b82f6' }}>View Open Roles →</a>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="cta-section">
           <h3 className="cta-title">Ready to eliminate the risk in your bidding?</h3>
           <p style={{ fontSize: '14px', color: '#71717a', marginBottom: '32px' }}>Start your first compliance audit in under 60 seconds.</p>
           <button 
            onClick={() => window.location.href = '/app'}
            className="about-cta-btn"
           >
             Open Intelligence Workbench
           </button>
        </section>
      </main>

      <footer className="about-footer">
        <div className="footer-copy">© 2026 ARIS LABS • SAN FRANCISCO, CA</div>
        <div className="footer-protocol">PROTOCOL: STATELESS_EXECUTION_v1</div>
      </footer>
    </div>
  );
};

export default About;
