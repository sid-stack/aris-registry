import React, { useState } from 'react';
import { devError } from '../../utils/devLog';
import { FileText, Sparkles, Loader2, Download } from 'lucide-react';

const ExecutiveSummary = () => {
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);

    const generateDraft = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/draft', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sb-token') || localStorage.getItem('aris_authenticated')}`
                },
                body: JSON.stringify({ requirements: ['RMF Compliance', 'ATO Requirements', 'Legacy System Integration'] })
            });
            const data = await res.json();
            if (data.success) {
                setDraft(data.draft);
            }
        } catch (err) {
            devError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={20} color="#3b82f6" />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                        Executive Summary Drafter
                    </h2>
                </div>
                {draft && (
                    <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <Download size={14} /> Export MD
                    </button>
                )}
            </div>
            
            {!draft ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                        Generate a professional proposal abstract based on extracted requirements.
                    </p>
                    <button 
                        onClick={generateDraft}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(37,99,235,0.1)',
                            border: '1px solid #3b82f6',
                            color: '#3b82f6',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {loading ? 'DRAFTING...' : 'GENERATE EXECUTIVE SUMMARY'}
                    </button>
                </div>
            ) : (
                <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    color: '#cbd5e1', 
                    lineHeight: 1.7, 
                    fontSize: '15px',
                    padding: '20px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {draft}
                </div>
            )}
        </div>
    );
};

export default ExecutiveSummary;
