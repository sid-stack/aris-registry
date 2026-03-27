import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Users, MousePointer2, Target, TrendingUp, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar, Filter
} from 'lucide-react';

const COLORS = ['#0B3D91', '#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD'];

// Mock Data for CEO Visualization
const TRAFFIC_DATA = [
  { day: 'Mon', visitors: 120, conversions: 12 },
  { day: 'Tue', visitors: 150, conversions: 18 },
  { day: 'Wed', visitors: 180, conversions: 25 },
  { day: 'Thu', visitors: 140, conversions: 15 },
  { day: 'Fri', visitors: 210, conversions: 32 },
  { day: 'Sat', visitors: 90, conversions: 8 },
  { day: 'Sun', visitors: 110, conversions: 10 },
];

const CTR_DATA = [
  { stage: 'Landing', value: 1000 },
  { stage: 'Pricing', value: 450 },
  { stage: 'App/Demo', value: 120 },
  { stage: 'Pro Subscription', value: 15 },
];

const FEATURE_USAGE = [
  { name: 'RFP Audit', value: 45 },
  { name: 'SAM Scraper', value: 25 },
  { name: 'Matrix Gen', value: 20 },
  { name: 'Outreach', value: 10 },
];

const AdminDashboard = ({ onBack }) => {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div style={s.container}>
      {/* Sidebar / Navigation */}
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

      {/* Main Content */}
      <div style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>CEO Command Center</h1>
            <p style={s.subtitle}>Institutional performance & growth metrics</p>
          </div>
          <div style={s.controls}>
            <div style={s.filter}>
              <Calendar size={16} /> Last 7 Days
            </div>
            <div style={s.filter}>
              <Filter size={16} /> Filter
            </div>
          </div>
        </div>

        {/* Top Cards */}
        <div style={s.cardRow}>
          <StatCard title="Total Visitors" value="1,240" trend="+12.5%" icon={<Users color="#0B3D91" />} />
          <StatCard title="Overall CTR" value="4.8%" trend="+0.4%" icon={<MousePointer2 color="#0B3D91" />} />
          <StatCard title="Feature Engagement" value="82%" trend="+2.3%" icon={<Activity color="#0B3D91" />} />
          <StatCard title="Revenue (MTD)" value="$435" trend="+15%" icon={<TrendingUp color="#0B3D91" />} />
        </div>

        {/* Charts Row 1 */}
        <div style={s.chartGrid}>
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>Traffic & Conversions</h3>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TRAFFIC_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  />
                  <Line type="monotone" dataKey="visitors" stroke="#0B3D91" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>Conversion Funnel</h3>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CTR_DATA} layout="vertical">
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

        {/* Charts Row 2 */}
        <div style={s.chartGrid}>
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>Feature Distribution</h3>
            </div>
            <div style={{ height: 300, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={FEATURE_USAGE}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {FEATURE_USAGE.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>Recent Intelligent Audits</h3>
            </div>
            <div style={s.auditList}>
              <AuditItem agency="DHA" doc="RFP #HT0011-24" status="Success" time="2m ago" />
              <AuditItem agency="US Army" doc="Solicitation #W91" status="Success" time="14m ago" />
              <AuditItem agency="NASA" doc="RFP SEWP VI" status="Success" time="1h ago" />
              <AuditItem agency="GSA" doc="Schedule 70" status="Success" time="3h ago" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, icon }) => (
  <div style={s.card}>
    <div style={s.cardHeader}>
      <span style={s.cardTitle}>{title}</span>
      <div style={s.cardIcon}>{icon}</div>
    </div>
    <div style={s.cardValue}>{value}</div>
    <div style={{ ...s.cardTrend, color: trend.startsWith('+') ? '#10B981' : '#EF4444' }}>
      {trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {trend} vs last week
    </div>
  </div>
);

const AuditItem = ({ agency, doc, status, time }) => (
  <div style={s.auditItem}>
    <div style={s.auditInfo}>
      <div style={s.auditAgency}>{agency}</div>
      <div style={s.auditDoc}>{doc}</div>
    </div>
    <div style={s.auditMeta}>
      <div style={s.auditStatus}>{status}</div>
      <div style={s.auditTime}>{time}</div>
    </div>
  </div>
);

const s = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#F8FAFC',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: '260px',
    background: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0B3D91',
    marginBottom: '48px',
    letterSpacing: '-0.02em',
  },
  navGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#64748B',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  backBtn: {
    padding: '12px',
    background: '#F1F5F9',
    border: 'none',
    borderRadius: '8px',
    color: '#64748B',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 'auto',
  },
  content: {
    flex: 1,
    padding: '48px 64px',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#0B3D91',
    margin: 0,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748B',
    margin: 0,
  },
  controls: {
    display: 'flex',
    gap: '12px',
  },
  filter: {
    padding: '8px 16px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
    marginBottom: '32px',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardIcon: {
    width: '32px',
    height: '32px',
    background: '#E0E7FF',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#0B3D91',
    marginBottom: '8px',
  },
  cardTrend: {
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '32px',
  },
  chartCard: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
  },
  chartHeader: {
    marginBottom: '24px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0B3D91',
    margin: 0,
  },
  auditList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  auditItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    background: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  auditAgency: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#0B3D91',
  },
  auditDoc: {
    fontSize: '13px',
    color: '#64748B',
  },
  auditStatus: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#10B981',
    background: '#D1FAE5',
    padding: '4px 8px',
    borderRadius: '4px',
    marginBottom: '4px',
    textAlign: 'center',
  },
  auditTime: {
    fontSize: '12px',
    color: '#94A3B8',
    textAlign: 'right',
  }
};

export default AdminDashboard;
