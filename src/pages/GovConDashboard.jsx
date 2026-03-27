import { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  MessageSquare, 
  Layers, 
  Download, 
  Settings, 
  ArrowLeft,
  Lock,
  Zap,
  CheckCircle,
  AlertOctagon,
  Mic,
  Plus,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ComplianceMatrix from '../components/dashboard/ComplianceMatrix';
import ExecutiveSummary from '../components/dashboard/ExecutiveSummary';
import BidSmithChat from '../components/dashboard/BidSmithChat';
import ExportToolbar from '../components/dashboard/ExportToolbar';

export default function GovConDashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('workspace');
  const [processing, setProcessing] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Set landing theme variables to light
    document.documentElement.style.setProperty('--background', '#ffffff');
    document.documentElement.style.setProperty('--card', '#f8fafc');
    document.documentElement.style.setProperty('--border', '#e2e8f0');
    document.documentElement.style.setProperty('--text-primary', '#0f172a');
    document.documentElement.style.setProperty('--text-secondary', '#475569');
    document.documentElement.style.setProperty('--accent', '#2563eb');
    document.documentElement.style.setProperty('--accent-soft', 'rgba(37,99,235,0.05)');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('aris_authenticated');
    window.location.href = '/';
  };

  return (
    <div className="dashboard-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: '#f1f5f9', // Institutional Gray
      color: '#0f172a',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Government Institutional Top Bar */}
      <div className="dashboard-header" style={{
        padding: '0 24px',
        height: '64px',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={onBack}>
            <Shield size={24} color="#002244" />
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 800, 
              color: '#002244', 
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              BidSmith <span style={{ color: '#64748b', fontWeight: 500, fontSize: '14px' }}>| GOV-TIER</span>
            </div>
          </div>
          
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
          
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
            <span>Workspace</span>
            <ChevronRight size={12} />
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{activeTab === 'workspace' ? 'Compliance Matrix' : activeTab === 'proposal' ? 'Proposal Drafting' : 'Capture Assistant'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <ExportToolbar />
          <div style={{ width: '1px', height: '32px', background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{session?.user?.email?.split('@')[0].toUpperCase() || 'OFFICIAL'}</div>
               <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>INSTITUTIONAL ACCESS</div>
             </div>
             <img src="/aris-logo.png" alt="ARIS Logo" style={{ height: '28px', marginLeft: '8px' }} />
             <button 
               onClick={handleLogout}
               style={{ 
                 background: 'none', 
                 border: 'none', 
                 color: '#ef4444', 
                 cursor: 'pointer',
                 padding: '4px'
               }}
               title="Secure Logout"
             >
               <LogOut size={18} />
             </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Navigation (Light) */}
        <nav style={{ 
          width: '260px', 
          borderRight: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0'
        }}>
          <div style={{ padding: '0 20px 24px 20px' }}>
             <button style={{
               width: '100%',
               padding: '12px',
               background: '#002244',
               color: 'white',
               border: 'none',
               borderRadius: '8px',
               fontWeight: 700,
               fontSize: '13px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '8px',
               cursor: 'pointer',
               boxShadow: '0 4px 12px rgba(0,34,68,0.15)'
             }}>
               <Plus size={16} />
               New Solicitation
             </button>
          </div>

          <div style={{ padding: '0 24px 12px 24px', fontSize: '11px', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Governance</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px' }}>
            <NavButton 
              active={activeTab === 'workspace'} 
              icon={<Layers size={18} />} 
              label="Compliance Matrix" 
              onClick={() => setActiveTab('workspace')} 
            />
            <NavButton 
              active={activeTab === 'proposal'} 
              icon={<FileText size={18} />} 
              label="Proposal Drafting" 
              onClick={() => setActiveTab('proposal')} 
            />
            <NavButton 
              active={activeTab === 'chat'} 
              icon={<MessageSquare size={18} />} 
              label="Capture Assistant" 
              onClick={() => setActiveTab('chat')} 
            />
          </div>

          <div style={{ marginTop: 'auto', padding: '24px 20px' }}>
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '12px', 
              padding: '16px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Zap size={14} color="#f59e0b" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>COMPUTE QUOTA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                  <div style={{ width: '85%', height: '100%', background: '#002244', borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>85%</span>
              </div>
              <div style={{ marginTop: '12px', fontSize: '10px', color: '#94a3b8', fontWeight: 500, textAlign: 'center' }}>
                Renewed on 04/01/2026
              </div>
            </div>
          </div>
        </nav>

        {/* Main Workspace Area (Light) */}
        <main style={{ 
          flex: 1, 
          overflowY: 'auto', 
          position: 'relative', 
          background: '#f1f5f9',
          padding: '32px'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {activeTab === 'workspace' && <ComplianceMatrix />}
            {activeTab === 'proposal' && <ExecutiveSummary />}
            {activeTab === 'chat' && <BidSmithChat />}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        body { margin: 0; background: #f1f5f9; }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .dashboard-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          padding: 24px;
        }

        :root {
          --background: #ffffff;
          --card: #ffffff;
          --border: #e2e8f0;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --accent: #002244;
          --accent-soft: rgba(0,34,68,0.05);
        }
      `}} />
    </div>
  );
}

function NavButton({ active, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      width: '100%',
      background: active ? '#f1f5f9' : 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: active ? '#002244' : '#64748b',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? 700 : 600,
      transition: 'all 0.2s',
      position: 'relative'
    }}>
      {icon}
      <span>{label}</span>
      {active && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', background: '#002244', borderRadius: '0 4px 4px 0' }} />}
    </button>
  );
}
