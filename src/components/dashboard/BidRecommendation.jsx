import React from 'react';

const BidRecommendation = () => {
    const recommendation = "CONDITIONAL BID";
    const conditions = [
        "Demonstrate RMF alignment",
        "Provide ATO pathway",
        "Confirm legacy compatibility"
    ];

    const recommendationStyles = {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: 'var(--risk-medium)',
        marginBottom: '15px',
        textAlign: 'center',
    };

    return (
        <div className="dashboard-card">
            <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px' }}>
                Bid Recommendation
            </h2>
            <div style={recommendationStyles}>
                {recommendation}
            </div>
            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', margin: 0 }}>
                {conditions.map((item, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>{item}</li>
                ))}
            </ul>
        </div>
    );
};

export default BidRecommendation;
