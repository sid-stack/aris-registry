/**
 * Dev-only Playwright harness: mirrors post-audit Command Center strip (compliance card + HumanWalkthroughCTA).
 */
import { Download, Loader2 } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import HumanWalkthroughCTA from "../components/HumanWalkthroughCTA.jsx";
import WorkspaceChat from "../components/bento/WorkspaceChat.jsx";
import { downloadComplianceMatrixXlsx } from "../utils/complianceMatrixXlsx";
import { BENTO_WORKSPACE_WELCOME_MARKDOWN } from "../content/bentoWorkspaceWelcome.js";

const MOCK_AUDIT = {
  id: "e2e-bento-harness",
  title: "E2E Harness Solicitation",
  solicitation_number: "E2E-HARNESS-001",
  verdict: { recommendation: "BID" },
  requirements: [
    {
      section: "L.5",
      requirement: "Past performance references for three similar contracts.",
      risk: "HIGH",
      is_disqualifier: false,
      action_required: "Confirm POCs.",
    },
    {
      section: "FAR 52.204-21",
      requirement: "Basic safeguarding of covered contractor information.",
      risk: "MEDIUM",
      is_disqualifier: false,
      action_required: "",
    },
    {
      section: "M",
      requirement: "Low risk evaluation narrative.",
      risk: "LOW",
      is_disqualifier: false,
      action_required: "Map to outline.",
    },
  ],
};

export default function E2eBentoAuditCtaHarness() {
  const [busy, setBusy] = useState(false);
  const [harnessReady, setHarnessReady] = useState(false);

  const chatPreviewMessages = useMemo(
    () => [
      { id: "e2e-welcome", role: "ai", text: BENTO_WORKSPACE_WELCOME_MARKDOWN },
      { id: "e2e-user", role: "user", text: "Walk me through past performance for this solicitation." },
    ],
    [],
  );

  useEffect(() => {
    setHarnessReady(true);
  }, []);

  const onExport = useCallback(async () => {
    setBusy(true);
    try {
      await downloadComplianceMatrixXlsx(MOCK_AUDIT);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div
      data-testid={harnessReady ? "e2e-harness-ready" : undefined}
      role="region"
      aria-label="E2E audit CTA harness"
      style={{ minHeight: "100vh", background: "#f8f9fa", padding: 24, fontFamily: "system-ui, sans-serif" }}
    >
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#5f6368" }}>
        E2E harness (dev): unlocked compliance strip + walkthrough CTA
      </p>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid #dadce0", borderRadius: 8, padding: "16px 18px" }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 500, color: "#5f6368" }}>Compliance matrix</p>
          {(MOCK_AUDIT.requirements || []).map((req, i) => (
            <div
              key={i}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid #e8eaed",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: req.risk === "HIGH" ? "#b91c1c" : req.risk === "LOW" ? "#047857" : "#b45309",
                  width: 40,
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                {req.risk}
              </span>
              <p style={{ margin: 0, fontSize: 13, color: "#202124", lineHeight: 1.45 }}>{req.requirement}</p>
            </div>
          ))}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e8eaed" }}>
            <button
              type="button"
              onClick={onExport}
              disabled={busy}
              aria-label="Export Compliance Matrix (.xlsx)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: 0,
                border: "none",
                background: "transparent",
                color: "#1a73e8",
                fontSize: 13,
                fontWeight: 600,
                cursor: busy ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {busy ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={14} />}
              Export Compliance Matrix (.xlsx)
            </button>
          </div>
        </div>
        <HumanWalkthroughCTA visible solicitationId={MOCK_AUDIT.solicitation_number} />
        <div style={{ marginTop: 28, maxWidth: 560, minHeight: 380 }}>
          <WorkspaceChat
            messages={chatPreviewMessages}
            loading={false}
            onSend={() => {}}
            placeholder="Ask about this contract…"
            headerBadge="Preview"
            headerBadgeColor="#334155"
            headerTitle="Workspace chat (harness)"
          />
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
