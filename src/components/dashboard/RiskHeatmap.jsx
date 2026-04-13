import React, { useEffect, useState } from 'react';

const RiskBar = ({ label, percentage, color }) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        // Animate width on component mount
        const timer = setTimeout(() => setWidth(percentage), 100);
        return () => clearTimeout(timer);
    }, [percentage]);

    const barContainerStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px',
    };

    const labelStyles = {
        width: '120px',
        color: 'var(--text-secondary)',
    };

    const barBackgroundStyles = {
        flex: 1,
        height: '20px',
        backgroundColor: 'var(--background)',
        borderRadius: '4px',
        overflow: 'hidden',
    };

    const barForegroundStyles = {
        height: '100%',
        width: `${width}%`,
        backgroundColor: color,
        transition: 'width 1s ease-in-out',
    };

    return (
        <div style={barContainerStyles}>
            <div style={labelStyles}>{label}</div>
            <div style={barBackgroundStyles}>
                <div style={barForegroundStyles}></div>
            </div>
        </div>
    );
};

const RiskHeatmap = () => {
    return (
        <div className="dashboard-card">
            <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px' }}>
                Risk Heatmap
            </h2>
            <RiskBar label="Security Risk" percentage={80} color="var(--risk-high)" />
            <RiskBar label="Compliance Risk" percentage={60} color="var(--risk-medium)" />
            <RiskBar label="Technical Risk" percentage={30} color="var(--accent)" />
        </div>
    );
};

export default RiskHeatmap;
