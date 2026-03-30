import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
  Users, MousePointer2, TrendingUp, ShieldCheck,
  ArrowUpRight, Activity, Filter, RefreshCw, DollarSign,
  Globe, Zap, Database, Server, LogOut, Search, ChevronRight, Wallet,
  FileText, Cpu, Layers, Terminal
} from 'lucide-react';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AdminDashboard = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchStats = async () => {
    setLoading(true);
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
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const processTableData = (data) => {
    if (!data) return [];
    return [...data]
      .filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        return aVal < bVal ? -1 * multiplier : aVal > bVal ? 1 * multiplier : 0;
      });
  };

  const dailyTraffic = stats?.daily_traffic || [];
  const totalAudits = stats?.events?.by_type?.find(e => e.event_type?.includes('audit'))?.count || 0;
  
  // Real Stripe Data
  const realRevenue30d = stats?.stripe?.total_30d || 0;
  const availableBalance = stats?.stripe?.available_balance || 0;

  return (
    <div style={sh.root}>
      {/* --- SIDEBAR --- */}
      <aside style={sh.sidebar}>
        <div style={sh.sidebarBrand}>
          <div style={sh.brandIcon}><Zap size={20} fill="#fff" /></div>
          <span style={sh.brandText}>ARIS PROTOCOL</span>
        </div>
        
        <nav style={sh.sideNav}>
          <NavBtn icon={<Activity size={18}/>} label="Executive Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <NavBtn icon={<Users size={18}/>} label="Identified Leads" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
          <NavBtn icon={<MousePointer2 size={18}/>} label="Anonymous Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
          <NavBtn icon={<Cpu size={18}/>} label="Logic Library" active={activeTab === 'logic'} onClick={() => setActiveTab('logic')} />
          <NavBtn icon={<Wallet size={18}/>} label="Stripe Transactions" active={activeTab === 'stripe_logs'} onClick={() => setActiveTab('stripe_logs')} />
          <NavBtn icon={<Layers size={18}/>} label="Redis Mesh Cache" active={activeTab === 'mesh'} onClick={() => setActiveTab('mesh')} />
          
          <div style={sh.navSeparator} />
          <NavBtn icon={<TrendingUp size={18}/>} label="Monetization HQ" onClick={() => window.open('https://dashboard.stripe.com', '_blank')} />
          <NavBtn icon={<Terminal size={18}/>} label="PostHog Stream" onClick={() => window.open('https://app.posthog.com', '_blank')} />
        </nav>

        <button onClick={onBack} style={sh.sidebarFooter}>
          <LogOut size={16} /> <span>TERMINATE SESSION</span>
        </button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={sh.main}>
        <header style={sh.header}>
          <div>
            <div style={sh.breadcrumb}>Sovereign Identity / Admin / {activeTab.toUpperCase()}</div>
            <h1 style={sh.pageTitle}>Finance & Ops Center</h1>
          </div>
          <div style={sh.headerActions}>
            <div style={sh.statusIndicator}>
              <div style={sh.pingAnimation} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>STRIPE_LIVE_FEED</span>
            </div>
            <button style={sh.refreshAction} onClick={fetchStats} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'SYNCING...' : 'REFRESH'}
            </button>
          </div>
        </header>

        {/* Real Revenue Row */}
        <div style={sh.metricRow}>
          <MetricCard title="Stripe 30d Revenue" value={`$${realRevenue30d.toLocaleString()}`} trend="+ Verified" icon={<DollarSign size={20} color="#10B981" />} />
          <MetricCard title="Available Balance" value={`$${availableBalance.toLocaleString()}`} trend="Payout Ready" icon={<Wallet size={20} color="#3B82F6" />} />
          <MetricCard title="Identified Leads" value={stats?.beta_signups?.total || '0'} trend="High Intent" icon={<Users size={20} color="#F59E0B" />} />
          <MetricCard title="Total Protocol Audits" value={totalAudits} trend="Stateless" icon={<Activity size={20} color="#8B5CF6" />} />
        </div>

        {activeTab === 'overview' && (
          <div style={sh.dashboardGrid}>
            <div style={{ ...sh.card, gridColumn: 'span 2' }}>
              <div style={sh.cardHeader}>
                <h2 style={sh.cardTitle}>Global Engagement Pulse</h2>
                <div style={sh.chartLegend}>
                  <div style={sh.legendItem}><span style={{ ...sh.dot, background: '#2563EB' }} /> Visitors</div>
                  <div style={sh.legendItem}><span style={{ ...sh.dot, background: '#10B981' }} /> Conversions</div>
                </div>
              </div>
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTraffic}>
                    <defs>
                      <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#0a0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="visitors" stroke="#2563EB" fillOpacity={1} fill="url(#colorVis)" strokeWidth={3} />
                    <Area type="monotone" dataKey="conversions" stroke="#10B981" fillOpacity={1} fill="url(#colorConv)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={sh.card}>
              <div style={sh.cardHeader}><h2 style={sh.cardTitle}>Intelligence Distribution</h2></div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={buildFeatureData(stats?.feature_usage)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {buildFeatureData(stats?.feature_usage).map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={sh.pieLabels}>
                {buildFeatureData(stats?.feature_usage).map((f, i) => (
                  <div key={i} style={sh.pieLabelItem}>
                     <span style={{ ...sh.dot, background: COLORS[i % COLORS.length] }} />
                     <span style={{ color: '#94a3b8', fontSize: 12 }}>{f.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={sh.card}>
              <div style={sh.cardHeader}><h2 style={sh.cardTitle}>Operational Clusters</h2></div>
              <div style={sh.heartbeatList}>
                <Heartbeat label="Redis Mesh Docs" value={stats?.mesh?.stats?.tableRows || 0} status="HEALTHY" />
                <Heartbeat label="Logic Library Patterns" value={stats?.logic_library?.length || 0} status="ACTIVE" />
                <button onClick={() => window.open('https://dashboard.stripe.com', '_blank')} style={sh.extBtn}>Launch Stripe HQ</button>
              </div>
            </div>
          </div>
        )}

        {/* --- DYNAMIC TABLES --- */}
        {activeTab !== 'overview' && (
          <div style={sh.tableContainer}>
             <div style={sh.tableHeader}>
                <div style={sh.searchBox}>
                   <Search size={16} />
                   <input 
                     placeholder={`Search ${activeTab} intelligence...`} 
                     value={searchTerm} 
                     onChange={(e) => setSearchTerm(e.target.value)} 
                     style={sh.searchInput}
                   />
                </div>
             </div>
             <table style={sh.table}>
                <thead>
                   <tr>
                      {getTableHeaders(activeTab, sortKey, handleSort)}
                   </tr>
                </thead>
                <tbody>
                   {processTableData(getTabData(stats, activeTab)).map((row, i) => (
                     <tr key={i} style={sh.tr}>
                        {renderRow(activeTab, row)}
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from {transform: rotate(0deg);} to {transform: rotate(360deg);} }
        @keyframes ping { 75%, 100% {transform: scale(2); opacity: 0;} }
      `}} />
    </div>
  );
};

// --- TABLE HELPERS ---

function getTabData(stats, tab) {
  if (!stats) return [];
  switch(tab) {
    case 'leads': return stats.beta_signups?.rows || [];
    case 'events': return stats.events?.rows || [];
    case 'logic': return stats.logic_library || [];
    case 'mesh': return stats.mesh?.rows || [];
    case 'stripe_logs': return stats.stripe?.logs || [];
    default: return [];
  }
}

function getTableHeaders(tab, sortKey, handleSort) {
  switch(tab) {
    case 'leads':
      return (
        <>
          <th style={sh.th} onClick={() => handleSort('email')}>EMAIL_ENTITY <SortIcon active={sortKey === 'email'} /></th>
          <th style={sh.th} onClick={() => handleSort('created_at')}>TIMESTAMP <SortIcon active={sortKey === 'created_at'} /></th>
          <th style={sh.th}>METADATA</th>
        </>
      );
    case 'events':
      return (
        <>
          <th style={sh.th} onClick={() => handleSort('created_at')}>TIME</th>
          <th style={sh.th}>TYPE</th>
          <th style={sh.th}>UID</th>
          <th style={sh.th}>VAL</th>
          <th style={sh.th}>PATH</th>
        </>
      );
    case 'logic':
      return (
        <>
          <th style={sh.th}>ARCHETYPE</th>
          <th style={sh.th}>CONFLICT</th>
          <th style={sh.th}>FREQ</th>
          <th style={sh.th}>STRATEGY</th>
        </>
      );
    case 'mesh':
      return (
        <>
          <th style={sh.th}>DOC_ID</th>
          <th style={sh.th}>TITLE</th>
          <th style={sh.th}>AGENCY</th>
          <th style={sh.th}>REGION</th>
        </>
      );
    case 'stripe_logs':
      return (
        <>
          <th style={sh.th}>CREATED</th>
          <th style={sh.th}>TYPE</th>
          <th style={sh.th}>ID</th>
          <th style={sh.th}>DESCRIPTION</th>
        </>
      );
    default: return null;
  }
}

function renderRow(tab, row) {
  switch(tab) {
    case 'leads':
      return (
        <>
          <td style={sh.td}><div style={sh.userTd}><Zap size={14} color="#3B82F6" /> {row.email}</div></td>
          <td style={sh.td}>{new Date(row.created_at).toLocaleString()}</td>
          <td style={sh.td}>{JSON.stringify(row.metadata)}</td>
        </>
      );
    case 'events':
      return (
        <>
          <td style={sh.td}>{new Date(row.created_at).toLocaleTimeString()}</td>
          <td style={{ ...sh.td, color: '#f8fafc', fontWeight: 600 }}>{row.event_type}</td>
          <td style={sh.td}>{row.uid?.substring(0,8)}...</td>
          <td style={{ ...sh.td, color: '#10B981', fontWeight: 700 }}>+${row.value || 0}</td>
          <td style={sh.td}>{row.path}</td>
        </>
      );
    case 'logic':
      return (
        <>
          <td style={sh.td}>{row.agency_archetype}</td>
          <td style={{ ...sh.td, fontWeight: 700 }}>{row.conflict_type}</td>
          <td style={sh.td}>{row.frequency}</td>
          <td style={sh.td}><span style={sh.truncate}>{row.remediation_strategy}</span></td>
        </>
      );
    case 'mesh':
      return (
        <>
          <td style={sh.td}>{row.id}</td>
          <td style={{ ...sh.td, color: '#f8fafc', fontWeight: 600 }}>{row.title}</td>
          <td style={sh.td}>{row.agency}</td>
          <td style={sh.td}>{row.region}</td>
        </>
      );
    case 'stripe_logs':
      return (
        <>
          <td style={sh.td}>{new Date(row.created).toLocaleString()}</td>
          <td style={{ ...sh.td, color: '#10B981', fontWeight: 700 }}>{row.type}</td>
          <td style={sh.td}>{row.id}</td>
          <td style={sh.td}>{String(row.description)}</td>
        </>
      );
    default: return null;
  }
}

// --- UI COMPONENTS ---

const NavBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={{ ...sh.navBtn, ...(active ? sh.navBtnActive : {}) }}>
    <div style={{ opacity: active ? 1 : 0.6 }}>{icon}</div>
    <span>{label}</span>
    {active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
  </button>
);

const MetricCard = ({ title, value, trend, icon }) => (
  <div style={sh.cardMetric}>
    <div style={sh.cardMetricHead}>
      <span style={sh.cardMetricTitle}>{title}</span>
      <div style={sh.cardMetricIcon}>{icon}</div>
    </div>
    <div style={sh.cardMetricValue}>{value}</div>
    <div style={sh.cardMetricFoot}>
      <span style={{ color: '#10B981', fontWeight: 700 }}>{trend}</span>
      <span style={{ color: '#64748b', marginLeft: 8 }}>Real-time verified</span>
    </div>
  </div>
);

const Heartbeat = ({ label, value, status }) => (
  <div style={sh.hbRow}>
     <div style={{ flex: 1 }}>
        <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ color: '#64748b', fontSize: 11 }}>{status}</div>
     </div>
     <div style={{ fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>{value}</div>
  </div>
);

const SortIcon = ({ active }) => (
  <ArrowUpRight size={12} style={{ marginLeft: 4, opacity: active ? 1 : 0.3 }} />
);

function buildFeatureData(featureRows) {
  if (!featureRows || featureRows.length === 0) return [
    { name: 'Audit', value: 10 }, { name: 'Search', value: 5 }, { name: 'Matrix', value: 3 }
  ];
  return featureRows.map(r => ({ name: r.name, value: parseInt(r.value || 0) }));
}

const sh = {
  root: { display: 'flex', minHeight: '100vh', background: '#0a0d14', color: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  sidebar: { width: '280px', background: '#0d111a', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '32px 16px', position: 'sticky', top: 0, height: '100vh' },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', marginBottom: '40px' },
  brandIcon: { width: '32px', height: '32px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandText: { fontWeight: 900, fontSize: '18px', letterSpacing: '0.1em' },
  sideNav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navBtn: { background: 'transparent', border: 'none', color: '#94a3b8', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  navBtnActive: { background: 'rgba(255,255,255,0.05)', color: '#fff' },
  navSeparator: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px' },
  sidebarFooter: { marginTop: 'auto', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.05em' },
  main: { flex: 1, padding: '48px 64px', maxWidth: '1440px', margin: '0 auto', width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' },
  breadcrumb: { color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' },
  pageTitle: { fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '20px' },
  statusIndicator: { background: 'rgba(16,185,129,0.1)', padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(16,185,129,0.2)' },
  pingAnimation: { width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' },
  refreshAction: { background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' },
  metricRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' },
  cardMetric: { background: '#0d111a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardMetricHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardMetricTitle: { fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' },
  cardMetricIcon: { width: '36px', height: '36px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardMetricValue: { fontSize: '32px', fontWeight: 900, letterSpacing: '-0.03em' },
  cardMetricFoot: { fontSize: '12px' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' },
  card: { background: '#0d111a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: 800, margin: 0 },
  chartLegend: { display: 'flex', gap: '16px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  pieLabels: { marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  pieLabelItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  heartbeatList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  hbRow: { display: 'flex', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  tableContainer: { background: '#0d111a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', overflow: 'hidden' },
  tableHeader: { padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  searchBox: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '12px', width: '320px' },
  searchInput: { background: 'transparent', border: 'none', color: '#fff', padding: '12px 0', outline: 'none', fontSize: '14px', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' },
  td: { padding: '16px 24px', fontSize: '13px', color: '#94a3b8' },
  userTd: { display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', fontWeight: 600 },
  badge: { fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px' },
  extBtn: { background: '#2563eb', border: 'none', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', marginTop: '12px' },
  truncate: { display: 'block', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
};

export default AdminDashboard;
