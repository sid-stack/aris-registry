import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, AlertTriangle, Shield, FileText, BarChart3 } from "lucide-react";

export default function SamRep({ onBack }) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" && window.innerWidth < 768
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Sample audit report data
    const sampleReport = {
        solicitation: "DHA Video Imaging Archive",
        solicitationId: "DHANOISS022426", 
        agency: "Defense Health Agency",
        analysisTime: "83 seconds",
        riskScore: "HIGH",
        
        executiveSummary: "BidSmith analysis identified critical RMF compliance dependencies and Authority to Operate (ATO) requirements that could materially affect proposal eligibility. Several integration constraints with legacy systems introduce moderate operational risk.",
        
        complianceRisks: [
            { 
                category: "RMF Compliance", 
                riskLevel: "HIGH", 
                notes: "Legacy platform must demonstrate RMF alignment before deployment." 
            },
            { 
                category: "Authority to Operate (ATO)", 
                riskLevel: "HIGH", 
                notes: "System must operate inside accredited federal environment." 
            },
            { 
                category: "Data Handling Requirements", 
                riskLevel: "MEDIUM", 
                notes: "Federal healthcare data standards referenced in attachments." 
            },
            { 
                category: "Legacy System Integration", 
                riskLevel: "MEDIUM", 
                notes: "Compatibility requirements partially defined." 
            }
        ],
        
        bidKillers: [
            "SPRS score submission required prior to proposal evaluation.",
            "Demonstrated experience with RMF-accredited environments expected.",
            "Failure to provide ATO pathway documentation may disqualify bid."
        ],
        
        evaluationCriteria: [
            "Technical compliance weighted more heavily than cost.",
            "Cybersecurity architecture will be evaluated early in scoring.",
            "Past performance with federal health systems preferred."
        ],
        
        recommendation: "CONDITIONAL BID",
        
        conditions: [
            "Provide RMF compliance mapping.",
            "Document ATO accreditation strategy.",
            "Validate compatibility with legacy imaging infrastructure."
        ]
    };

    const styles = {
        container: {
            minHeight: "100vh",
            background: "#f8fafc",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: "#1f293b",
            lineHeight: 1.6
        },
        
        navbar: {
            height: 64,
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            padding: isMobile ? "0 16px" : "0 32px",
            position: "sticky",
            top: 0,
            zIndex: 10
        },
        
        navInner: {
            maxWidth: 1120,
            margin: "0 auto",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
        },
        
        backButton: {
            background: "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        },
        
        brand: {
            display: "flex",
            alignItems: "center",
            textDecoration: "none"
        },
        
        reportContainer: {
            maxWidth: "900px",
            margin: "0 auto",
            padding: isMobile ? "20px" : "60px 40px"
        },
        
        reportHeader: {
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "32px",
            marginBottom: "24px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        },
        
        reportTitle: {
            fontSize: isMobile ? "28px" : "36px",
            fontWeight: "700",
            color: "#1e293b",
            marginBottom: "16px",
            textAlign: "center"
        },
        
        reportMeta: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px"
        },
        
        metaItem: {
            background: "#f8fafc",
            padding: "16px",
            borderRadius: 8,
            border: "1px solid #e2e8f0"
        },
        
        sectionHeading: {
            fontSize: isMobile ? "20px" : "24px",
            fontWeight: "600",
            color: "#1e293b",
            marginBottom: "16px",
            borderBottom: "2px solid #f3f4f6",
            paddingBottom: "8px"
        },
        
        sectionText: {
            fontSize: isMobile ? "14px" : "16px",
            lineHeight: 1.6,
            color: "#374151",
            marginBottom: "16px"
        },
        
        riskTable: {
            width: "100%",
            borderCollapse: "collapse",
            background: "#ffffff",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
        },
        
        tableHeader: {
            background: "#f8fafc",
            padding: "12px",
            textAlign: "left",
            fontWeight: "600",
            color: "#374151",
            borderBottom: "2px solid #e2e8f0",
            fontSize: isMobile ? "14px" : "16px"
        },
        
        tableCell: {
            padding: "12px",
            borderBottom: "1px solid #e2e8f0",
            fontSize: isMobile ? "13px" : "14px"
        },
        
        bulletList: {
            margin: 0,
            paddingLeft: isMobile ? "16px" : "24px"
        },
        
        bulletItem: {
            marginBottom: "8px",
            fontSize: isMobile ? "13px" : "14px",
            lineHeight: 1.6,
            color: "#374151"
        },
        
        recommendationBox: {
            background: "#fef3c7",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "24px",
            marginBottom: "16px"
        },
        
        recommendationStatus: {
            fontSize: isMobile ? "16px" : "18px",
            fontWeight: "700",
            padding: "12px 16px",
            borderRadius: 6,
            display: "inline-block",
            marginBottom: "16px"
        },
        
        recommendationConditions: {
            marginTop: "12px"
        },
        
        reportFooter: {
            textAlign: "center",
            padding: "24px",
            borderTop: "1px solid #e2e8f0",
            marginTop: "24px",
            background: "#f8fafc"
        },
        
        footerText: {
            fontSize: isMobile ? "13px" : "14px",
            color: "#6b7280"
        },
        
        actionButtons: {
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            marginTop: "32px"
        },
        
        primaryButton: {
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            padding: "14px 28px",
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: "600",
            cursor: "pointer",
            textDecoration: "none",
            transition: "all 0.2s ease"
        },
        
        secondaryButton: {
            background: "transparent",
            color: "#2563eb",
            border: "1px solid #2563eb",
            borderRadius: 8,
            padding: "14px 28px",
            fontSize: isMobile ? "14px" : "16px",
            fontWeight: "600",
            cursor: "pointer",
            textDecoration: "none",
            transition: "all 0.2s ease"
        },
        
        // Risk level colors
        highRisk: "#dc2626",
        mediumRisk: "#f59e0b",
        lowRisk: "#10b981"
    };

    const getRiskColor = (level) => {
        if (level === "HIGH") return styles.highRisk;
        if (level === "MEDIUM") return styles.mediumRisk;
        return styles.lowRisk;
    };

    return (
        <div style={styles.container}>
            {/* Navigation */}
            <nav style={styles.navbar}>
                <div style={styles.navInner}>
                    <button
                        onClick={() => (onBack ? onBack() : (window.location.href = "/"))}
                        style={styles.backButton}
                    >
                        <ArrowLeft size={16} />
                        {isMobile ? "Back" : "Back to Home"}
                    </button>
                    <div style={styles.brand}>
                        <span style={{ color: "#1e293b", fontSize: "18px", fontWeight: "bold" }}>BidSmith</span>
                    </div>
                </div>
            </nav>

            <div style={styles.reportContainer}>
                {/* Report Header */}
                <div style={styles.reportHeader}>
                    <h1 style={styles.reportTitle}>BidSmith Compliance Risk Audit</h1>
                    <div style={styles.reportMeta}>
                        <div style={styles.metaItem}>
                            <strong>Solicitation:</strong> {sampleReport.solicitation}
                        </div>
                        <div style={styles.metaItem}>
                            <strong>Solicitation ID:</strong> {sampleReport.solicitationId}
                        </div>
                        <div style={styles.metaItem}>
                            <strong>Agency:</strong> {sampleReport.agency}
                        </div>
                        <div style={styles.metaItem}>
                            <strong>Analysis Time:</strong> {sampleReport.analysisTime}
                        </div>
                        <div style={styles.metaItem}>
                            <strong>Risk Score:</strong>{" "}
                            <span
                                style={{
                                    color: getRiskColor(sampleReport.riskScore),
                                    fontWeight: "bold"
                                }}
                            >
                                {sampleReport.riskScore}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Executive Summary */}
                <div style={styles.reportSection}>
                    <h2 style={styles.sectionHeading}>1. Executive Summary</h2>
                    <p style={styles.sectionText}>
                        {sampleReport.executiveSummary}
                    </p>
                </div>

                {/* Compliance Risk Findings */}
                <div style={styles.reportSection}>
                    <h2 style={styles.sectionHeading}>2. Compliance Risk Findings</h2>
                    <table style={styles.riskTable}>
                        <thead>
                            <tr>
                                <th style={styles.tableHeader}>Category</th>
                                <th style={styles.tableHeader}>Risk Level</th>
                                <th style={styles.tableHeader}>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sampleReport.complianceRisks.map((risk, index) => (
                                <tr key={index}>
                                    <td style={styles.tableCell}>{risk.category}</td>
                                    <td style={styles.tableCell}>
                                        <span
                                            style={{
                                                color: getRiskColor(risk.riskLevel),
                                                fontWeight: "bold"
                                            }}
                                        >
                                            {risk.riskLevel}
                                        </span>
                                    </td>
                                    <td style={styles.tableCell}>{risk.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bid-Killer Detection */}
                <div style={styles.reportSection}>
                    <h2 style={styles.sectionHeading}>3. Bid-Killer Detection</h2>
                    <ul style={styles.bulletList}>
                        {sampleReport.bidKillers.map((killer, index) => (
                            <li key={index} style={styles.bulletItem}>
                                <AlertTriangle size={16} style={{ color: "#f59e0b", marginRight: "8px" }} />
                                {killer}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Evaluation Criteria */}
                <div style={styles.reportSection}>
                    <h2 style={styles.sectionHeading}>4. Evaluation Criteria Signals</h2>
                    <ul style={styles.bulletList}>
                        {sampleReport.evaluationCriteria.map((criterion, index) => (
                            <li key={index} style={styles.bulletItem}>
                                <BarChart3 size={16} style={{ color: "#1e293b", marginRight: "8px" }} />
                                {criterion}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Recommendation */}
                <div style={styles.reportSection}>
                    <h2 style={styles.sectionHeading}>5. Bid / No-Bid Recommendation</h2>
                    <div style={styles.recommendationBox}>
                        <div style={styles.recommendationStatus}>
                            {sampleReport.recommendation}
                        </div>
                        {sampleReport.recommendation === "CONDITIONAL BID" && (
                            <div style={styles.recommendationConditions}>
                                <strong>Conditions:</strong>
                                <ul style={styles.bulletList}>
                                    {sampleReport.conditions.map((condition, index) => (
                                        <li key={index} style={styles.bulletItem}>{condition}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={styles.reportFooter}>
                    <p style={styles.footerText}>
                        Generated by <strong>BidSmith</strong> — AI Compliance Intelligence for Federal RFPs
                    </p>
                </div>

                {/* Action Buttons */}
                <div style={styles.actionButtons}>
                    <button
                        style={styles.primaryButton}
                        onClick={() => window.open("https://bidsmith.pro", "_blank", "noopener,noreferrer")}
                    >
                        Analyze Your Solicitation
                    </button>
                    <button
                        style={styles.secondaryButton}
                        onClick={() => window.open("https://docs.bidsmith.pro", "_blank", "noopener,noreferrer")}
                    >
                        View Documentation
                    </button>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 30,
        marginBottom: 30,
      }}
    >
      <h2 style={{ marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "1px solid #e2e8f0",
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #f1f5f9",
};