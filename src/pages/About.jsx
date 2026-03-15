import React from 'react';
import { Briefcase, Users, Building2, Globe, Shield, Rocket, Target } from 'lucide-react';
import NavBar from '../components/dashboard/NavBar';

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
    <div style={{ backgroundColor: '#09090b', color: '#a1a1aa', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <NavBar onBack={onBack} />
      
      <main style={{ flex: 1, padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'left', marginBottom: '80px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '999px', marginBottom: '24px' }}>
            <Building2 size={14} color="#3b82f6" />
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#3b82f6', letterSpacing: '0.1em' }}>ARIS LABS // ABOUT</span>
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 810, color: '#f4f4f5', marginBottom: '24px', letterSpacing: '-0.03em' }}>
            Engineering the Future of Defense Intelligence.
          </h1>
          <p style={{ fontSize: '20px', color: '#71717a', maxWidth: '800px', lineHeight: 1.6 }}>
            Aris Labs is a GovCon-first engineering firm. We build the <strong>Intelligence Workbench</strong> for federal primes who demand absolute data sovereignty and high-performance execution.
          </p>
        </section>

        {/* Our Mission */}
        <section style={{ marginBottom: '100px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#52525b', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '40px' }}>The Sovereignty Protocol</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {MISSION_VALUES.map((value, i) => (
              <div key={i} style={{ padding: '32px', background: '#0c0c0e', border: '1px solid #1a1a1a', borderRadius: '12px' }}>
                <div style={{ marginBottom: '20px' }}>{value.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f4f4f5', marginBottom: '12px' }}>{value.title}</h3>
                <p style={{ fontSize: '14px', color: '#71717a', lineHeight: 1.6 }}>{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The Lab Section */}
        <section style={{ background: 'linear-gradient(145deg, #0c0c0e 0%, #09090b 100%)', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '60px', marginBottom: '80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f4f4f5', marginBottom: '20px' }}>Labs headquarters: San Francisco, CA</h2>
              <p style={{ fontSize: '15px', color: '#a1a1aa', lineHeight: 1.8, marginBottom: '24px' }}>
                Operating at the intersection of Silicon Valley engineering and Beltway compliance requirements. Our remote-first team is anchored in San Francisco, building the next generation of stateless defense software.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#52525b', fontWeight: 600 }}>
                  <Globe size={14} color="#3b82f6" />
                  GLOBAL OPERATIONS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#52525b', fontWeight: 600 }}>
                  <Users size={14} color="#3b82f6" />
                  FEDERAL-FIRST TEAM
                </div>
              </div>
            </div>
            <div style={{ padding: '40px', background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', textAlign: 'center' }}>
               <Briefcase size={40} color="#3b82f6" style={{ marginBottom: '20px', opacity: 0.5 }} />
               <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5', marginBottom: '10px' }}>Interested in Joining?</h4>
               <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '20px' }}>We are always looking for security-minded engineers and GovCon specialists.</p>
               <a href="mailto:careers@bidsmith.pro" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid #3b82f6' }}>View Open Roles →</a>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section style={{ textAlign: 'center', padding: '60px 0', borderTop: '1px solid #1a1a1a' }}>
           <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#f4f4f5', marginBottom: '16px' }}>Ready to eliminate the risk in your bidding?</h3>
           <p style={{ fontSize: '14px', color: '#71717a', marginBottom: '32px' }}>Start your first compliance audit in under 60 seconds.</p>
           <button 
            onClick={() => window.location.href = '/app'}
            style={{ 
              padding: '12px 32px', 
              background: '#3b82f6', 
              color: 'white', 
              borderRadius: '6px', 
              fontSize: '14px', 
              fontWeight: 700, 
              border: 'none', 
              cursor: 'pointer' 
            }}
           >
             Open Intelligence Workbench
           </button>
        </section>
      </main>

      <footer style={{ height: '40px', borderTop: '1px solid #1a1a1a', background: '#09090b', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '10px', color: '#3f3f46', fontWeight: 600 }}>© 2026 ARIS LABS • SAN FRANCISCO, CA</div>
        <div style={{ fontSize: '10px', color: '#3f3f46', fontWeight: 600 }}>PROTOCOL: STATELESS_EXECUTION_v1</div>
      </footer>
    </div>
  );
};

export default About;
