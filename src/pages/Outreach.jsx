import React, { useState, useEffect } from 'react';
import { Users, Send, CheckCircle, MessageSquare, Plus, Copy, Trash2, TrendingUp } from 'lucide-react';

const DEFAULT_MESSAGE = "Hey — built a tool that turns RFPs into compliance matrices in ~90 seconds. Can I run one for you free?";

export default function Outreach({ onBack }) {
  const [targets, setTargets] = useState(() => {
    const saved = localStorage.getItem('aris_outreach_targets');
    return saved ? JSON.parse(saved) : [];
  });
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState('LinkedIn');
  const [template, setTemplate] = useState(DEFAULT_MESSAGE);

  useEffect(() => {
    localStorage.setItem('aris_outreach_targets', JSON.stringify(targets));
  }, [targets]);

  const addTarget = () => {
    if (!newName.trim()) return;
    const newTarget = {
      id: Date.now(),
      name: newName,
      platform: newPlatform,
      status: 'Not Sent',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    };
    setTargets([newTarget, ...targets]);
    setNewName('');
  };

  const updateStatus = (id, status) => {
    setTargets(targets.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTarget = (id) => {
    setTargets(targets.filter(t => t.id !== id));
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(template);
    alert("Message copied to clipboard!");
  };

  const sentToday = targets.filter(t => t.date === new Date().toISOString().split('T')[0] && t.status !== 'Not Sent').length;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingUp size={24} color="#0B3D91" />
          <h1 style={styles.title}>Outreach Dashboard</h1>
        </div>
        <button onClick={onBack} style={styles.backBtn}>Back to App</button>
      </header>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>DAILY GOAL</div>
          <div style={styles.statValue}>{sentToday} / 20</div>
          <div style={styles.progressBar}><div style={{...styles.progressFill, width: `${(sentToday / 20) * 100}%`}}></div></div>
        </div>
      </div>

      <div style={styles.layout}>
        {/* SECTION 1 & 2: INPUT & TEMPLATE */}
        <div style={styles.sidebar}>
          <div style={styles.section}>
            <h3><Plus size={18} /> Add Target</h3>
            <input 
              style={styles.input} 
              placeholder="Name or LinkedIn URL" 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTarget()}
            />
            <select style={styles.select} value={newPlatform} onChange={e => setNewPlatform(e.target.value)}>
              <option>LinkedIn</option>
              <option>Reddit</option>
              <option>Email</option>
            </select>
            <button style={styles.addBtn} onClick={addTarget}>Add to List</button>
          </div>

          <div style={styles.section}>
            <h3><MessageSquare size={18} /> Message Template</h3>
            <textarea 
              style={styles.textarea} 
              value={template} 
              onChange={e => setTemplate(e.target.value)}
            />
            <button style={styles.copyBtn} onClick={copyMessage}><Copy size={16} /> Copy Message</button>
          </div>
        </div>

        {/* SECTION 3: TRACKING TABLE */}
        <div style={styles.main}>
          <div style={styles.section}>
            <h3><Users size={18} /> Pipeline</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {targets.map(target => (
                  <tr key={target.id}>
                    <td style={styles.nameCell}>{target.name}</td>
                    <td><span style={styles.platformBadge}>{target.platform}</span></td>
                    <td>
                      <select 
                        style={styles.statusSelect} 
                        value={target.status} 
                        onChange={e => updateStatus(target.id, e.target.value)}
                      >
                        <option>Not Sent</option>
                        <option>Sent</option>
                        <option>Replied</option>
                        <option>Interested</option>
                      </select>
                    </td>
                    <td>
                      <button style={styles.deleteBtn} onClick={() => deleteTarget(target.id)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {targets.length === 0 && <div style={styles.empty}>No targets added yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  title: { fontSize: '24px', fontWeight: 900, color: '#0f172a' },
  backBtn: { padding: '8px 16px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
  statsRow: { marginBottom: '32px' },
  statCard: { padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '300px' },
  statLabel: { fontSize: '12px', fontWeight: 800, color: '#64748b', marginBottom: '8px' },
  statValue: { fontSize: '32px', fontWeight: 900, color: '#0B3D91', marginBottom: '12px' },
  progressBar: { height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: '#0B3D91', transition: 'width 0.3s ease' },
  layout: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '24px' },
  section: { background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', fontSize: '14px' },
  select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' },
  addBtn: { width: '100%', padding: '12px', background: '#0B3D91', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' },
  textarea: { width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', fontSize: '14px', resize: 'none' },
  copyBtn: { width: '100%', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  main: { display: 'flex', flexDirection: 'column' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  nameCell: { maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 },
  platformBadge: { padding: '4px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', fontWeight: 700, color: '#475569' },
  statusSelect: { padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '13px' },
  deleteBtn: { padding: '8px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '40px', color: '#94a3b8' }
};
