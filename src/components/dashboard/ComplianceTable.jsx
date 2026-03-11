import React from 'react';

const ComplianceTable = () => {
    const risks = [
        { category: 'RMF Compliance', risk: 'HIGH', notes: 'Legacy software requires ATO pathway' },
        { category: 'Authority to Operate', risk: 'HIGH', notes: 'Evaluation dependent' },
        { category: 'Health Data Security', risk: 'MEDIUM', notes: 'Federal healthcare standards referenced' },
    ];

    const getRiskColor = (risk) => {
        if (risk === 'HIGH') return 'var(--risk-high)';
        if (risk === 'MEDIUM') return 'var(--risk-medium)';
        return 'var(--text-secondary)';
    };

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
            <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px' }}>
                Compliance Risk Table
            </h2>
            <table style={tableStyles}>
                <thead>
                    <tr>
                        <th style={thStyles}>Category</th>
                        <th style={thStyles}>Risk</th>
                        <th style={thStyles}>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {risks.map((item, index) => (
                        <tr key={index}>
                            <td style={tdStyles}>{item.category}</td>
                            <td style={{ ...tdStyles, color: getRiskColor(item.risk), fontWeight: 'bold' }}>{item.risk}</td>
                            <td style={tdStyles}>{item.notes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ComplianceTable;
