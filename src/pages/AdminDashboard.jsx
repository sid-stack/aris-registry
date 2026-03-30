import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, MousePointer2, TrendingUp, ShieldCheck,
  ArrowUpRight, Activity, Filter, RefreshCw, DollarSign
} from 'lucide-react';

const COLORS = ['#0B3D91', '#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD'];

const FUNNEL_ORDER = ['Landing', 'Pricing', 'App/Demo', 'Pro Subscription'];

function buildFunnelData(funnelRows) {
  const map = Object.fromEntries((funnelRows || []).map(r => [r.stage, parseInt(r.value)]));
  return FUNNEL_ORDER.map(stage => ({ stage, value: map[stage] || 0 }));
}

function buildFeatureData(featureRows) {
  if (!featureRows || featureRows.length === 0) return [
    { name: 'RFP Audit', value: 0 },
    { name: 'SAM Scraper', value: 0 },
    { name: 'Matrix Gen', value: 0 },
    { name: 'Outreach', value: 0 },
  ];
  return featureRows.map(r => ({ name: r.name, value: parseInt(r.value) }));
}

function buildTrafficData(dailyRows) {
  if (!dailyRows || dailyRows.length === 0) {
    return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => ({ day, visitors: 0, conversions: 0 }));
  }
  return dailyRows.map(r => ({
    day: r.day,
    visitors: parseInt(r.visitors),
    conversions: parseInt(r.conversions),
  }));
}

const AdminDashboard = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
      setLastFetched(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...(stats?.beta_signups?.recent || [])]
    .filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const sortedEvents = [...(stats?.events?.recent || [])]
    .filter(e => e.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) || e.path?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const totalEvents = stats?.events?.by_type?.reduce((s, e) => s + parseInt(e.count), 0) || 0;
  const auditEvents = stats?.events?.by_type?.find(e => e.event_type?.includes('audit'));
  const auditCount = auditEvents ? parseInt(auditEvents.count) : 0;
  const checkoutEvents = stats?.events?.by_type?.find(e => e.event_type?.includes('checkout'));
  const revenue = checkoutEvents ? (parseInt(checkoutEvents.count) * 99) : 0;

  const trafficData = buildTrafficData(stats?.daily_traffic);
  const funnelData = buildFunnelData(stats?.funnel);
  const featureData = buildFeatureData(stats?.feature_usage);

  return (
    <div style={s.container}>
      <div style={s.sidebar}>
        <div style={s.logo}>ARIS_ADMIN</div>
        <div style={s.navGroup}>
          <div onClick={() => setActiveTab('overview')} style={{ ...s.navItem, ...(activeTab === 'overview' ? s.navActive : {}) }}>
            <Activity size={18} /> Overview
          </div>
          <div onClick={() => setActiveTab('users')} style={{ ...s.navItem, ...(activeTab === 'users' ? s.navActive : {}) }}>
            <Users size={18} /> User Directory
          </div>
          <div onClick={() => setActiveTab('sessions')} style={{ ...s.navItem, ...(activeTab === 'sessions' ? s.navActive : {}) }}>
            <MousePointer2 size={18} /> Session Intel
          </div>
          <div onClick={() => setActiveTab('analytics')} style={{ ...s.navItem, ...(activeTab === 'analytics' ? s.navActive : {}) }}>
            <TrendingUp size={18} /> External Ops
          </div>
          <div style={s.navItem}><ShieldCheck size={18} /> VPC Security</div>
        </div>
        <button onClick={onBack} style={s.backBtn}>TERMINATE ADMIN SESSION</button>
      </div>

      <div style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Protocol Command Center</h1>
            <p style={s.subtitle}>
              Sovereign Analytics Dashboard · {lastFetched ? `Updated ${lastFetched}` : 'Loading...'}
            </p>
          </div>
          <div style={s.controls}>
             {activeTab !== 'overview' && activeTab !== 'analytics' && (
                <div style={{ position: 'relative' }}>
                  <Filter size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                  <input 
                    placeholder="Search matrix..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    style={s.searchInput}
                  />
                </div>
             )}
            <button style={s.refreshBtn} onClick={fetchStats} disabled={loading}>
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'SYNCING...' : 'REFRESH_STREAM'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fda4af', borderRadius: 12, padding: '16px', marginBottom: 24, color: '#be123c', fontSize: 13, fontWeight: 600 }}>
             INTELLIGENCE_BLOCK: {error}
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            <div style={s.cardRow}>
              <StatCard title="Active Protocol Signups" value={stats?.beta_signups?.total ?? '—'} trend={null} icon={<Users color="#0B3D91" />} loading={loading} />
              <StatCard title="Stateless Events" value={totalEvents || '—'} trend={null} icon={<MousePointer2 color="#0B3D91" />} loading={loading} />
              <StatCard title="RFP Audits Deployed" value={auditCount || '—'} trend={null} icon={<Activity color="#0B3D91" />} loading={loading} />
              <StatCard title="Estimated Revenue" value={revenue ? `$${revenue.toLocaleString()}` : '—'} trend={null} icon={<DollarSign color="#0B3D91" />} loading={loading} />
            </div>

            <div style={s.chartGrid}>
              <div style={s.chartCard}>
                <div style={s.chartHeader}><h3 style={s.chartTitle}>Protocol Traffic (7d)</h3></div>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="visitors" stroke="#0B3D91" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                      <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={s.chartCard}>
                <div style={s.chartHeader}><h3 style={s.chartTitle}>Compliance Funnel (30d)</h3></div>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} width={120} style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0B3D91" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
               <h3 style={s.chartTitle}>Institutional User Directory</h3>
               <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Manual verification required for Gov-tier access.</p>
            </div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th} onClick={() => handleSort('email')}>User Entity <ArrowUpRight size={12} /></th>
                  <th style={s.th} onClick={() => handleSort('created_at')}>Registration Date <ArrowUpRight size={12} /></th>
                  <th style={s.th}>Protocol Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.td}>{u.email}</td>
                    <td style={s.td}>{new Date(u.created_at).toLocaleString()}</td>
                    <td style={s.td}><span style={s.badge}>UN_VERIFIED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
               <h3 style={s.chartTitle}>Live Session Intelligence</h3>
               <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Real-time telemetry from the stateless bridge.</p>
            </div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th} onClick={() => handleSort('created_at')}>Timestamp</th>
                  <th style={s.th} onClick={() => handleSort('event_type')}>Event_Key</th>
                  <th style={s.th}>Path</th>
                  <th style={s.th}>Entity_UID</th>
                  <th style={s.th}>Value</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((e, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={{ ...s.td, fontSize: 11, color: '#94a3b8' }}>{new Date(e.created_at).toLocaleTimeString()}</td>
                    <td style={{ ...s.td, fontWeight: 700, color: '#0B3D91' }}>{e.event_type}</td>
                    <td style={s.td}>{e.path}</td>
                    <td style={{ ...s.td, fontSize: 11, fontFamily: 'monospace' }}>{e.uid?.substring(0,8)}...</td>
                    <td style={{ ...s.td, fontWeight: 800 }}>${e.value || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={s.chartGrid}>
             <div style={s.chartCard}>
                <div style={s.chartHeader}><h3 style={s.chartTitle}>Vercel Intelligence</h3></div>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                   <div style={{ marginBottom: '24px', opacity: 0.5 }}><ShieldCheck size={48} color="#0B3D91" /></div>
                   <p style={{ fontSize: 14, color: '#475569', marginBottom: '24px' }}>Real-time traffic, deployment speed, and vital signs.</p>
                   <button onClick={() => window.open('https://vercel.com/aris-labs/aris-registry/analytics', '_blank')} style={s.extBtn}>Open Vercel Dashboard</button>
                </div>
             </div>
             <div style={s.chartCard}>
                <div style={s.chartHeader}><h3 style={s.chartTitle}>PostHog Behavioral Matrix</h3></div>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                   <div style={{ marginBottom: '24px', opacity: 0.5 }}><MousePointer2 size={48} color="#0B3D91" /></div>
                   <p style={{ fontSize: 14, color: '#475569', marginBottom: '24px' }}>Deep-shred behavioral analytics and user journey maps.</p>
                   <button onClick={() => window.open('https://app.posthog.com', '_blank')} style={s.extBtn}>Open PostHog Interface</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, loading }) => (
  <div style={s.card}>
    <div style={s.cardHeader}>
      <span style={s.cardTitle}>{title}</span>
      <div style={s.cardIcon}>{icon}</div>
    </div>
    <div style={s.cardValue}>{loading ? '...' : value}</div>
    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Sovereign Feed: LIVE</div>
  </div>
);

const s = {
  container: { display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" },
  sidebar: { width: '280px', background: '#FFFFFF', borderRight: '1px solid #E2E8F0', padding: '32px 24px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' },
  logo: { fontSize: '22px', fontWeight: 900, color: '#0B3D91', marginBottom: '48px', letterSpacing: '0.1em' },
  navGroup: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderRadius: '12px', color: '#64748B', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  navActive: { background: '#F1F5F9', color: '#0B3D91', fontWeight: 800 },
  backBtn: { padding: '14px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', fontWeight: 800, fontSize: '11px', cursor: 'pointer', marginTop: 'auto', letterSpacing: '0.05em' },
  content: { flex: 1, padding: '48px 64px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' },
  title: { fontSize: '32px', fontWeight: 900, color: '#0B3D91', margin: 0, marginBottom: '8px', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '15px', color: '#64748B', margin: 0, fontWeight: 500 },
  controls: { display: 'flex', gap: '16px' },
  refreshBtn: { background: '#0B3D91', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(11,61,145,0.2)' },
  searchInput: { padding: '10px 16px 10px 40px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', outline: 'none', width: '240px' },
  cardRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardTitle: { fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' },
  cardIcon: { width: '36px', height: '36px', background: 'rgba(11,61,145,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardValue: { fontSize: '36px', fontWeight: 900, color: '#0B3D91', marginBottom: '4px', letterSpacing: '-0.04em' },
  chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' },
  chartCard: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' },
  chartHeader: { marginBottom: '32px' },
  chartTitle: { fontSize: '20px', fontWeight: 900, color: '#0B3D91', margin: 0, letterSpacing: '-0.01em' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '12px' },
  th: { textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' },
  tr: { borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' },
  td: { padding: '16px', fontSize: '13px', color: '#334155', fontWeight: 500 },
  badge: { fontSize: '10px', fontWeight: 800, background: '#F1F5F9', color: '#64748b', padding: '4px 8px', borderRadius: '4px' },
  extBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0B3D91', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }
};

export default AdminDashboard;
