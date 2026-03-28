import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, MousePointer2, Target, TrendingUp, ShieldCheck,
  ArrowUpRight, ArrowDownRight, Activity, Calendar, Filter, RefreshCw
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
        <div style={s.logo}>BidSmith Admin</div>
        <div style={s.navGroup}>
          <div style={{ ...s.navItem, background: '#F1F5F9', color: '#0B3D91' }}>
            <Activity size={18} /> Overview
          </div>
          <div style={s.navItem}><Users size={18} /> Users</div>
          <div style={s.navItem}><Target size={18} /> Conversions</div>
          <div style={s.navItem}><ShieldCheck size={18} /> Security</div>
        </div>
        <button onClick={onBack} style={s.backBtn}>Exit Admin</button>
      </div>

      <div style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>CEO Command Center</h1>
            <p style={s.subtitle}>
              Live analytics · {lastFetched ? `Updated ${lastFetched}` : 'Loading...'}
            </p>
          </div>
          <div style={s.controls}>
            <div style={s.filter}>
              <Calendar size={16} /> Last 7 Days
            </div>
            <button style={{ ...s.filter, cursor: 'pointer', border: 'none' }} onClick={fetchStats} disabled={loading}>
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: '#c53030', fontSize: 13 }}>
            Database error: {error} — showing cached/empty data
          </div>
        )}

        <div style={s.cardRow}>
          <StatCard title="Beta Signups" value={stats?.beta_signups?.total ?? '—'} trend={null} icon={<Users color="#0B3D91" />} loading={loading} />
          <StatCard title="Total Events" value={totalEvents || '—'} trend={null} icon={<MousePointer2 color="#0B3D91" />} loading={loading} />
          <StatCard title="Audits Run" value={auditCount || '—'} trend={null} icon={<Activity color="#0B3D91" />} loading={loading} />
          <StatCard title="Est. Revenue" value={revenue ? `$${revenue.toLocaleString()}` : '—'} trend={null} icon={<TrendingUp color="#0B3D91" />} loading={loading} />
        </div>

        <div style={s.chartGrid}>
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>Traffic & Conversions (7d)</h3>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="visitors" stroke="#0B3D91" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>Conversion Funnel (30d)</h3>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0B3D91" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={s.chartGrid}>
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>Feature Distribution (30d)</h3>
            </div>
            <div style={{ height: 300, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={featureData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {featureData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>Recent Signups</h3>
            </div>
            <div style={s.auditList}>
              {loading ? (
                <p style={{ color: '#94A3B8', fontSize: 13 }}>Loading...</p>
              ) : stats?.beta_signups?.recent?.length > 0 ? (
                stats.beta_signups.recent.slice(0, 5).map((signup, i) => (
                  <SignupItem key={i} email={signup.email} time={new Date(signup.created_at).toLocaleString()} />
                ))
              ) : (
                <p style={{ color: '#94A3B8', fontSize: 13 }}>No signups yet</p>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ ...s.chartHeader, marginBottom: 12 }}>
                <h3 style={{ ...s.chartTitle, fontSize: 15 }}>Top Events</h3>
              </div>
              {loading ? null : (stats?.events?.by_type || []).slice(0, 5).map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>{e.event_type}</span>
                  <span style={{ color: '#0B3D91', fontWeight: 800 }}>{parseInt(e.count).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
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
    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Live data</div>
  </div>
);

const SignupItem = ({ email, time }) => (
  <div style={s.auditItem}>
    <div style={s.auditInfo}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0B3D91' }}>{email}</div>
      <div style={{ fontSize: 12, color: '#64748B' }}>{time}</div>
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', background: '#D1FAE5', padding: '4px 8px', borderRadius: 4 }}>
      Signed Up
    </div>
  </div>
);

const s = {
  container: { display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  sidebar: { width: '260px', background: '#FFFFFF', borderRight: '1px solid #E2E8F0', padding: '32px 24px', display: 'flex', flexDirection: 'column' },
  logo: { fontSize: '20px', fontWeight: 800, color: '#0B3D91', marginBottom: '48px', letterSpacing: '-0.02em' },
  navGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#64748B', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  backBtn: { padding: '12px', background: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#64748B', fontWeight: 700, cursor: 'pointer', marginTop: 'auto' },
  content: { flex: 1, padding: '48px 64px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' },
  title: { fontSize: '28px', fontWeight: 800, color: '#0B3D91', margin: 0, marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#64748B', margin: 0 },
  controls: { display: 'flex', gap: '12px' },
  filter: { padding: '8px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'default' },
  cardRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' },
  card: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cardTitle: { fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
  cardIcon: { width: '32px', height: '32px', background: '#E0E7FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardValue: { fontSize: '32px', fontWeight: 800, color: '#0B3D91', marginBottom: '8px' },
  chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' },
  chartCard: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' },
  chartHeader: { marginBottom: '24px' },
  chartTitle: { fontSize: '18px', fontWeight: 800, color: '#0B3D91', margin: 0 },
  auditList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  auditItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' },
  auditInfo: {},
};

export default AdminDashboard;
