import React from 'react';

const ExecutiveSummary = () => {
    const text = "BidSmith analysis identified critical RMF compliance dependencies and Authority to Operate (ATO) requirements that could materially affect proposal eligibility. Several integration constraints with legacy systems introduce moderate operational risk.";

    return (
        <div className="dashboard-card">
            <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px' }}>
                Executive Summary
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {text}
            </p>
        </div>
    );
};

export default ExecutiveSummary;
