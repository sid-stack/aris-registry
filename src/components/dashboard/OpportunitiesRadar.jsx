import React from 'react';

const OpportunitiesRadar = () => {
    const opportunities = [
        { agency: 'VA', opportunity: 'Cloud Modernization', value: '$50M', deadline: '2026-04-15' },
        { agency: 'GSA', opportunity: 'Data Analytics Platform', value: '$25M', deadline: '2026-05-01' },
        { agency: 'NASA', opportunity: 'Imaging Pipeline', value: '$30M', deadline: '2026-05-10' },
        { agency: 'DHS', opportunity: 'Cybersecurity Assessment', value: '$15M', deadline: '2026-05-20' },
        { agency: 'Air Force', opportunity: 'AI Logistics', value: '$75M', deadline: '2026-06-01' },
    ];

    const tableStyles = {
        width: '100%',
        borderCollapse: 'collapse',
        color: 'var(--text-secondary)',
    };

    const thStyles = {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '1px solid var(--border)',
        color: 'var(--text-primary)',
    };

    const tdStyles = {
        padding: '12px',
        borderBottom: '1px solid var(--border)',
    };

    return (
        <div className="dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px' }}>
                <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Federal Opportunities Radar</h2>
                <span style={{ backgroundColor: 'var(--accent)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    Live SAM.gov Feed
                </span>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: '4px' }}>
                <table style={tableStyles}>
                    <thead>
                        <tr>
                            <th style={thStyles}>Agency</th>
                            <th style={thStyles}>Opportunity</th>
                            <th style={thStyles}>Estimated Value</th>
                            <th style={thStyles}>Deadline</th>
                        </tr>
                    </thead>
                    <tbody>
                        {opportunities.map((item, index) => (
                            <tr key={index}>
                                <td style={tdStyles}>{item.agency}</td>
                                <td style={tdStyles}>{item.opportunity}</td>
                                <td style={tdStyles}>{item.value}</td>
                                <td style={tdStyles}>{item.deadline}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OpportunitiesRadar;
