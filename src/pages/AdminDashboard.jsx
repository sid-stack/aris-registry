import React, { useState, useEffect, useCallback } from 'react';
import { devWarn } from '../utils/devLog';
import { ADMIN_API_KEY_STORAGE, adminAuthHeaders, getStoredAdminPassword } from '../utils/adminAuthHeader';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
  Users, MousePointer2, TrendingUp, ShieldCheck,
  ArrowUpRight, Activity, Filter, RefreshCw, DollarSign,
  Globe, Zap, Database, Server, LogOut, Search, ChevronRight, Wallet,
  FileText, Cpu, Layers, Terminal, Star, Mail, Send, CheckCircle, Radio
} from 'lucide-react';
import { OutboundAbPanel } from '../components/OutboundAbPanel.jsx';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AdminDashboard = ({ onBack }) => {
  const [adminKey, setAdminKey] = useState(() => getStoredAdminPassword());
  const [draftKey, setDraftKey] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Waitlist state
  const [waitlist, setWaitlist] = useState([]);
  const [waitlistStats, setWaitlistStats] = useState(null);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  // Pending Reports state
  const [pendingReports, setPendingReports] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState(null);
  const [reportNotes, setReportNotes] = useState({});
  const [sendingReport, setSendingReport] = useState(null);
  const [sendResult, setSendResult] = useState({});

  const fetchStats = useCallback(async () => {
    if (!adminKey) {
      setLoading(false);
      setStats(null);
      setError('Enter the admin password to load analytics.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats', { headers: adminAuthHeaders() });
      const data = await res.json();
      if (res.status === 401) throw new Error('Unauthorized — check ADMIN_PASSWORD.');
      if (data.error) {
        setStats({ error: data.error, traffic_summary: null, beta_signups: { total: 0, rows: [] } });
        setError(null);
      } else {
        setStats(data);
      }
      setLastFetched(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const fetchWaitlist = async () => {
    if (!adminKey) return;
    setWaitlistLoading(true);
    try {
      const res = await fetch('/api/waitlist/list', { headers: adminAuthHeaders() });
      const data = await res.json();
      setWaitlist(data.entries || []);
      setWaitlistStats(data.stats || {});
    } catch (e) { devWarn('waitlist fetch failed', e); }
    finally { setWaitlistLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'waitlist' && adminKey) fetchWaitlist();
  }, [activeTab, adminKey]);

  const fetchPendingReports = async () => {
    if (!adminKey) return;
    setPendingLoading(true);
    try {
      const res = await fetch('/api/admin/pending-reports', { headers: adminAuthHeaders() });
      const data = await res.json();
      setPendingReports(data.reports || []);
      const notes = {};
      (data.reports || []).forEach(r => { notes[r.id] = r.admin_notes || ''; });
      setReportNotes(notes);
    } catch (e) { devWarn('pending reports fetch failed', e); }
    finally { setPendingLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'pending_reports' && adminKey) fetchPendingReports();
  }, [activeTab, adminKey]);

  const saveNotes = async (id) => {
    await fetch(`/api/admin/pending-reports/${id}/notes`, {
      method: 'PATCH',
      headers: adminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ notes: reportNotes[id] || '' }),
    });
  };

  const sendReport = async (id) => {
    setSendingReport(id);
    setSendResult(prev => ({ ...prev, [id]: null }));
    try {
      await saveNotes(id);
      const res = await fetch(`/api/admin/pending-reports/${id}/send`, {
        method: 'POST',
        headers: adminAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult(prev => ({ ...prev, [id]: `Sent to ${data.sent_to}` }));
        setPendingReports(prev => prev.map(r => r.id === id ? { ...r, status: 'sent' } : r));
      } else {
        setSendResult(prev => ({ ...prev, [id]: `Error: ${data.error}` }));
      }
    } catch (e) {
      setSendResult(prev => ({ ...prev, [id]: 'Failed to send' }));
    } finally {
      setSendingReport(null);
    }
  };

  const sendInvites = async () => {
    if (!adminKey || !selectedIds.length) return;
    setInviting(true); setInviteResult(null);
    try {
      const res = await fetch('/api/waitlist/invite', {
        method: 'POST',
        headers: adminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ids: selectedIds, custom_message: inviteMsg || undefined })
      });
      const data = await res.json();
      setInviteResult(`✓ Sent ${data.sent} invite${data.sent !== 1 ? 's' : ''}`);
      setSelectedIds([]);
      fetchWaitlist();
    } catch (e) { setInviteResult('Failed to send invites'); }
    finally { setInviting(false); }
  };

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
  const traffic = stats?.traffic_summary || {};
  const totalAudits = stats?.audit_funnel?.total_events ?? 0;
  
  // Real Stripe Data
  const realRevenue30d = stats?.stripe?.total_30d || 0;
  const availableBalance = stats?.stripe?.available_balance || 0;

  if (!adminKey) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0d0f14', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Inter", system-ui, sans-serif', padding: 24,
      }}>
        <div style={{
          maxWidth: 440, width: '100%', background: '#111827', padding: 28, borderRadius: 12,
          border: '1px solid #1f2937', boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
        }}>
          <h1 style={{ color: '#f9fafb', fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Admin API access</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.55, margin: '0 0 18px' }}>
            Enter the same secret as <code style={{ color: '#e2e8f0' }}>ADMIN_PASSWORD</code> in your server environment.
            It is stored only in this browser as a Bearer token for admin endpoints.
          </p>
          <input
            type="password"
            autoComplete="off"
            placeholder="Admin password"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const t = draftKey.trim();
                if (!t) return;
                window.localStorage.setItem(ADMIN_API_KEY_STORAGE, t);
                setAdminKey(t);
                setDraftKey('');
              }
            }}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #374151', background: '#0b1220', color: '#f9fafb', fontSize: 14, marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const t = draftKey.trim();
                if (!t) return;
                window.localStorage.setItem(ADMIN_API_KEY_STORAGE, t);
                setAdminKey(t);
                setDraftKey('');
              }}
              style={{
                padding: '10px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              Unlock dashboard
            </button>
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: '10px 18px', borderRadius: 8, border: '1px solid #374151', background: 'transparent',
                color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <NavBtn icon={<Users size={18}/>} label="Beta signups" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
          <NavBtn icon={<MousePointer2 size={18}/>} label="Anonymous Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
          <NavBtn icon={<Cpu size={18}/>} label="Logic Library" active={activeTab === 'logic'} onClick={() => setActiveTab('logic')} />
          <NavBtn icon={<Wallet size={18}/>} label="Stripe Transactions" active={activeTab === 'stripe_logs'} onClick={() => setActiveTab('stripe_logs')} />
          <NavBtn icon={<Layers size={18}/>} label="Redis Mesh Cache" active={activeTab === 'mesh'} onClick={() => setActiveTab('mesh')} />
          <NavBtn icon={<Star size={18}/>} label="Early Access List" active={activeTab === 'waitlist'} onClick={() => setActiveTab('waitlist')} />
          <NavBtn icon={<FileText size={18}/>} label="Pending Reports" active={activeTab === 'pending_reports'} onClick={() => setActiveTab('pending_reports')} />
          <NavBtn icon={<Radio size={18}/>} label="Outbound A/B" active={activeTab === 'outbound'} onClick={() => setActiveTab('outbound')} />

          <div style={sh.navSeparator} />
          <NavBtn icon={<TrendingUp size={18}/>} label="Monetization HQ" onClick={() => window.open('https://dashboard.stripe.com', '_blank')} />
          <NavBtn icon={<Terminal size={18}/>} label="PostHog Stream" onClick={() => window.open('https://app.posthog.com', '_blank')} />
        </nav>

        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem(ADMIN_API_KEY_STORAGE);
            setAdminKey('');
            setStats(null);
            setError(null);
          }}
          style={{ ...sh.sidebarFooter, marginBottom: 8, border: '1px solid #334155', background: 'transparent' }}
        >
          <ShieldCheck size={16} /> <span>CLEAR ADMIN KEY</span>
        </button>
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

        {stats?.error && (
          <div style={{
            margin: '0 0 12px', padding: '12px 14px', borderRadius: 8, background: '#451a1a',
            border: '1px solid #7f1d1d', color: '#fecaca', fontSize: 13, lineHeight: 1.5,
          }}>
            <strong>Postgres analytics:</strong> {stats.error}. This board only reads first-party events from{' '}
            <code style={{ color: '#fda4af' }}>DATABASE_URL</code> on the API (Railway). Plausible, Vercel Analytics, and GA4 still collect separately.
          </div>
        )}
        {!stats?.error && stats?.traffic_summary && (
          <div style={{
            margin: '0 0 12px', padding: '10px 14px', borderRadius: 8, background: '#0f172a',
            border: '1px solid #334155', color: '#cbd5e1', fontSize: 13, lineHeight: 1.55,
          }}>
            <strong>Site visitors (distinct cookie UIDs, 7d):</strong> {traffic.unique_visitors_7d}
            {' · '}<strong>All events (24h):</strong> {traffic.events_24h}
            {' · '}<strong>Page views (7d):</strong> {traffic.page_views_7d}
            {' · '}<strong>Audit engagement (30d):</strong> {traffic.audit_engagement_30d}
          </div>
        )}

        {/* Real Revenue Row */}
        <div style={sh.metricRow}>
          <MetricCard title="Stripe 30d Revenue" value={`$${realRevenue30d.toLocaleString()}`} trend="+ Verified" icon={<DollarSign size={20} color="#10B981" />} />
          <MetricCard title="Available Balance" value={`$${availableBalance.toLocaleString()}`} trend="Payout Ready" icon={<Wallet size={20} color="#3B82F6" />} />
          <MetricCard title="Beta emails (waitlist)" value={stats?.beta_signups?.total || '0'} trend="Not unique visitors" icon={<Users size={20} color="#F59E0B" />} />
          <MetricCard title="Audit funnel (first-party)" value={totalAudits} trend="submitted + success + legacy" icon={<Activity size={20} color="#8B5CF6" />} />
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
        {activeTab !== 'overview' && activeTab !== 'waitlist' && activeTab !== 'pending_reports' && activeTab !== 'outbound' && (
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

        {/* ── EARLY ACCESS WAITLIST TAB ─────────────────────────────────── */}
        {activeTab === 'waitlist' && (
          <div style={{ padding: '0 32px 32px' }}>
            {/* Stats row */}
            {waitlistStats && (
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total', value: waitlistStats.total, color: '#0f172a' },
                  { label: 'Today', value: waitlistStats.today, color: '#7c3aed' },
                  { label: 'This Week', value: waitlistStats.this_week, color: '#2563eb' },
                  { label: 'Pending', value: waitlistStats.pending, color: '#d97706' },
                  { label: 'Invited', value: waitlistStats.invited, color: '#16a34a' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '12px', padding: '16px 24px', textAlign: 'center',
                    minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: s.color }}>{s.value || 0}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Invite controls */}
            {selectedIds.length > 0 && (
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
                display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8', margin: '0 0 8px' }}>
                    {selectedIds.length} user{selectedIds.length !== 1 ? 's' : ''} selected
                  </p>
                  <textarea
                    value={inviteMsg}
                    onChange={e => setInviteMsg(e.target.value)}
                    placeholder="Custom invite message (optional — leave blank for default)"
                    rows={2}
                    style={{
                      width: '100%', padding: '8px 12px', fontSize: '12px',
                      border: '1px solid #bfdbfe', borderRadius: '8px',
                      resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={sendInvites} disabled={inviting} style={{
                    padding: '10px 20px', background: '#002244', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 700,
                    fontSize: '13px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
                  }}>
                    <Send size={13} /> {inviting ? 'Sending…' : 'Send Invites'}
                  </button>
                  <button onClick={() => setSelectedIds([])} style={{
                    padding: '8px 20px', background: 'transparent', color: '#64748b',
                    border: '1px solid #e2e8f0', borderRadius: '8px',
                    fontWeight: 600, fontSize: '12px', cursor: 'pointer'
                  }}>Clear</button>
                </div>
                {inviteResult && (
                  <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700, alignSelf: 'center' }}>
                    {inviteResult}
                  </div>
                )}
              </div>
            )}

            {/* Waitlist table */}
            <div style={{
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '12px', overflow: 'hidden'
            }}>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  Early Access Requests
                </span>
                <button onClick={fetchWaitlist} disabled={waitlistLoading} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#64748b', fontSize: '12px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {waitlistLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Loading…
                </div>
              ) : waitlist.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No requests yet. Share the link and check back.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', width: '32px' }}>
                          <input type="checkbox"
                            checked={selectedIds.length === waitlist.filter(w => w.status === 'pending').length && waitlist.filter(w => w.status === 'pending').length > 0}
                            onChange={e => setSelectedIds(e.target.checked ? waitlist.filter(w => w.status === 'pending').map(w => w.id) : [])}
                          />
                        </th>
                        {['Name', 'Email', 'Company', 'Role', 'Use Case', 'Status', 'Date'].map(h => (
                          <th key={h} style={{
                            padding: '10px 12px', textAlign: 'left',
                            fontSize: '10px', fontWeight: 800, color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            borderBottom: '1px solid #f1f5f9'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {waitlist.map((w, i) => (
                        <tr key={w.id} style={{ borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '10px 12px' }}>
                            {w.status === 'pending' && (
                              <input type="checkbox"
                                checked={selectedIds.includes(w.id)}
                                onChange={e => setSelectedIds(e.target.checked
                                  ? [...selectedIds, w.id]
                                  : selectedIds.filter(id => id !== w.id)
                                )}
                              />
                            )}
                            {w.status === 'invited' && <CheckCircle size={14} color="#16a34a" />}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{w.name}</td>
                          <td style={{ padding: '10px 12px', color: '#2563eb', fontFamily: 'monospace' }}>{w.email}</td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>{w.company || '—'}</td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>{w.role || '—'}</td>
                          <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: '200px' }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {w.use_case || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 800, padding: '3px 8px',
                              borderRadius: '20px',
                              color: w.status === 'invited' ? '#16a34a' : w.status === 'joined' ? '#2563eb' : '#d97706',
                              background: w.status === 'invited' ? '#f0fdf4' : w.status === 'joined' ? '#eff6ff' : '#fef9f0',
                            }}>
                              {w.status?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ── PENDING REPORTS TAB ───────────────────────────────────────── */}
        {activeTab === 'pending_reports' && (
          <div style={{ padding: '0 32px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>User Audit Reports</h2>
              <button onClick={fetchPendingReports} style={{
                padding: '6px 14px', background: '#002244', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '12px',
                fontWeight: 700, cursor: 'pointer'
              }}>Refresh</button>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {pendingReports.filter(r => r.status === 'pending').length} pending · {pendingReports.length} total
              </span>
            </div>

            {pendingLoading && <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading...</p>}

            {!pendingLoading && pendingReports.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No reports yet. Reports appear here when users run audits.</p>
            )}

            {!pendingLoading && pendingReports.map(report => (
              <div key={report.id} style={{
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: '12px', marginBottom: '12px', overflow: 'hidden'
              }}>
                {/* Row */}
                <div
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '14px 20px', cursor: 'pointer',
                    background: expandedReport === report.id ? '#f8fafc' : '#fff'
                  }}
                >
                  <span style={{
                    fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '20px',
                    color: report.status === 'sent' ? '#16a34a' : '#d97706',
                    background: report.status === 'sent' ? '#f0fdf4' : '#fef9f0',
                    whiteSpace: 'nowrap'
                  }}>{report.status?.toUpperCase()}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {report.title || 'Untitled Solicitation'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {report.agency || '—'} · {report.user_email}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {report.verdict && (
                      <span style={{
                        fontSize: '12px', fontWeight: 700,
                        color: report.verdict?.toLowerCase().includes('bid') ? '#16a34a' : report.verdict?.toLowerCase().includes('no') ? '#dc2626' : '#d97706'
                      }}>{report.verdict}</span>
                    )}
                    {report.win_probability != null && (
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>{report.win_probability}% win</span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedReport === report.id && (
                  <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
                    {/* Info row */}
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
                      <div><span style={{ color: '#64748b' }}>User: </span><strong>{report.user_email}</strong></div>
                      {report.solicitation_number && <div><span style={{ color: '#64748b' }}>Sol #: </span><strong>{report.solicitation_number}</strong></div>}
                      {report.sam_url && <div><a href={report.sam_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>View on SAM.gov →</a></div>}
                      {report.sent_at && <div><span style={{ color: '#64748b' }}>Sent: </span><strong>{new Date(report.sent_at).toLocaleString()}</strong></div>}
                    </div>

                    {/* Audit summary */}
                    {report.audit_result?.executiveSummary && (
                      <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#334155', lineHeight: 1.7 }}>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>Executive Summary</strong>
                        {report.audit_result.executiveSummary}
                      </div>
                    )}

                    {/* Admin notes */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                        Admin Notes (included in email)
                      </label>
                      <textarea
                        value={reportNotes[report.id] || ''}
                        onChange={e => setReportNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                        rows={3}
                        placeholder="Add analyst notes, recommendations, or follow-up items..."
                        style={{
                          width: '100%', padding: '10px 12px', fontSize: '13px',
                          border: '1px solid #e2e8f0', borderRadius: '8px',
                          resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                          background: '#fff', color: '#0f172a'
                        }}
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button
                        onClick={() => sendReport(report.id)}
                        disabled={sendingReport === report.id || report.status === 'sent'}
                        style={{
                          padding: '10px 20px', background: report.status === 'sent' ? '#e2e8f0' : '#002244',
                          color: report.status === 'sent' ? '#64748b' : '#fff',
                          border: 'none', borderRadius: '8px', fontWeight: 700,
                          fontSize: '13px', cursor: report.status === 'sent' ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Send size={14} />
                        {sendingReport === report.id ? 'Sending...' : report.status === 'sent' ? 'Already Sent' : `Send to ${report.user_email}`}
                      </button>
                      <button
                        onClick={() => saveNotes(report.id)}
                        style={{
                          padding: '10px 16px', background: '#f1f5f9', color: '#334155',
                          border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700,
                          fontSize: '13px', cursor: 'pointer'
                        }}
                      >
                        Save Notes
                      </button>
                      {sendResult[report.id] && (
                        <span style={{
                          fontSize: '12px', fontWeight: 700,
                          color: sendResult[report.id].startsWith('Sent') ? '#16a34a' : '#dc2626'
                        }}>{sendResult[report.id]}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'outbound' && adminKey && (
          <div style={{ padding: '0 32px 32px' }}>
            <OutboundAbPanel />
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
