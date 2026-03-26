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
  Plus
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
      background: '#0a0d14', 
      color: '#f1f5f9',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Institutional Top Bar */}
      <div className="dashboard-header" style={{
        padding: '12px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10,13,20,0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={onBack}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#94a3b8', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} />
            Back to Hub
          </button>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>ARIS GOV-TIER</div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>INSTITUTIONAL WORKSPACE</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ExportToolbar />
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <button style={{ 
               background: 'rgba(255,255,255,0.03)', 
               border: '1px solid rgba(255,255,255,0.08)',
               padding: '6px 12px',
               borderRadius: '6px',
               color: '#f1f5f9',
               fontSize: '12px',
               fontWeight: 500,
               cursor: 'pointer'
             }} onClick={handleLogout}>
               Logout
             </button>
             <div style={{ fontSize: '12px', color: '#94a3b8' }}>
               {session?.user?.email || 'Institutional Guest'}
             </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar - Navigation */}
        <nav style={{ 
          width: '240px', 
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(13,17,24,0.4)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0'
        }}>
          <div style={{ padding: '0 16px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
             <button style={{
               width: '100%',
               padding: '10px',
               background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
               color: 'white',
               border: 'none',
               borderRadius: '8px',
               fontWeight: 600,
               fontSize: '13px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '8px',
               cursor: 'pointer',
               boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
             }}>
               <Plus size={16} />
               New Solicitation
             </button>
          </div>

          <div style={{ padding: '20px 16px 10px 16px', fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>MAIN NAV</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px' }}>
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

          <div style={{ marginTop: 'auto', padding: '20px 16px' }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '12px', 
              padding: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap size={14} color="#f6ad55" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>CREDITS REMAINING</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                  <div style={{ width: '85%', height: '100%', background: '#2563eb', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>85/100</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Workspace Area */}
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', background: 'radial-gradient(circle at top left, rgba(37,99,235,0.03) 0%, transparent 40%)' }}>
          <div style={{ padding: '32px' }}>
            {activeTab === 'workspace' && <ComplianceMatrix />}
            {activeTab === 'proposal' && <ExecutiveSummary />}
            {activeTab === 'chat' && <BidSmithChat />}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap');
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
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
      padding: '10px 12px',
      width: '100%',
      background: active ? 'rgba(37,99,235,0.1)' : 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: active ? '#60a5fa' : '#94a3b8',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      transition: 'all 0.2s',
      borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
      position: 'relative'
    }}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
