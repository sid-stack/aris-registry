/**
 * Retention-oriented single CTA from audit signals (GovCon dashboard v2).
 */

import { AlertTriangle, FileUp, Sparkles, ChevronRight, MessageSquare } from "lucide-react";
import { useEffect, useMemo } from "react";
import { trackEvent } from "../../utils/analytics";

const C = {
  border: "#e5e7eb",
  text: "#0d0d0d",
  textMuted: "#374151",
  textDim: "#9ca3af",
  accent: "#10a37f",
  surface: "#f0fdf4",
  borderAccent: "rgba(16,163,127,0.35)",
  amberBg: "#fffbeb",
  amberBorder: "rgba(245,158,11,0.45)",
  redBg: "#fef2f2",
  redBorder: "rgba(239,68,68,0.35)",
};

function pickNba(audit) {
  const reqs = Array.isArray(audit?.requirements) ? audit.requirements : [];
  const disqualifierCount = reqs.filter(
    (r) => r.is_disqualifier || r.risk === "DISQUALIFIER"
  ).length;
  const requirementCount = reqs.length;
  const winProbability = Number(audit?.verdict?.win_probability);

  if (disqualifierCount > 0) {
    return {
      key: "resolve_disqualifiers",
      title: "Resolve disqualifiers before you invest capture time",
      body: `${disqualifierCount} requirement${disqualifierCount === 1 ? "" : "s"} flagged as bid-killers or disqualifiers. Address these first — or walk away early.`,
      cta: "Resolve disqualifiers",
      icon: AlertTriangle,
      tone: "danger",
    };
  }
  if (requirementCount === 0) {
    return {
      key: "upload_sections",
      title: "Upload missing solicitation sections",
      body: "We could not build a compliance matrix from this run. Add the full PDF or paste Section L/M/C so requirements can be extracted.",
      cta: "Upload PDF / full text",
      icon: FileUp,
      tone: "warn",
    };
  }
  if (Number.isFinite(winProbability) && winProbability > 70) {
    return {
      key: "exec_summary",
      title: "Strong fit — lock the executive summary",
      body: `Win probability is ${winProbability}%. Capture the narrative now while the audit is fresh.`,
      cta: "Generate executive summary",
      icon: Sparkles,
      tone: "go",
    };
  }
  return {
    key: "default_chat",
    title: "Keep momentum — ask ARIS your next question",
    body: "Review risks and compliance rows, then dig into Section L/M gaps or draft language in chat.",
    cta: "Open a follow-up in chat",
    icon: MessageSquare,
    tone: "neutral",
  };
}

export default function NextBestAction({ audit, onAction, fileRef }) {
  const nba = useMemo(() => (audit ? pickNba(audit) : null), [audit]);

  useEffect(() => {
    if (!nba || !audit) return;
    trackEvent("nba_impression", {
      nba_key: nba.key,
      solicitation: audit.solicitation_number || audit.id || null,
      category: "retention",
    });
  }, [nba, audit]);

  if (!audit || !nba) return null;

  const Icon = nba.icon;
  const bg =
    nba.tone === "danger"
      ? C.redBg
      : nba.tone === "warn"
        ? C.amberBg
        : nba.tone === "go"
          ? C.surface
          : "#f9fafb";
  const borderCol =
    nba.tone === "danger"
      ? C.redBorder
      : nba.tone === "warn"
        ? C.amberBorder
        : nba.tone === "go"
          ? C.borderAccent
          : C.border;

  const handleClick = () => {
    trackEvent("nba_cta_click", {
      nba_key: nba.key,
      solicitation: audit.solicitation_number || audit.id || null,
      category: "retention",
    });

    if (nba.key === "resolve_disqualifiers") {
      onAction?.(
        "chat",
        "List each disqualifier from this audit with the exact requirement text and what I must do to mitigate or confirm no-bid."
      );
      return;
    }
    if (nba.key === "upload_sections") {
      fileRef?.current?.click();
      return;
    }
    if (nba.key === "exec_summary") {
      onAction?.(
        "chat",
        "Draft a 150-word executive summary for my proposal response based on this audit — align to Section M evaluation factors and our win themes."
      );
      return;
    }
    onAction?.("focus_chat", null);
  };

  return (
    <div
      style={{
        margin: "0 28px 12px",
        padding: "12px 16px",
        borderRadius: 10,
        border: `1px solid ${borderCol}`,
        background: bg,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "rgba(255,255,255,0.7)",
          border: `1px solid ${borderCol}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={nba.tone === "danger" ? "#dc2626" : nba.tone === "go" ? C.accent : C.textMuted} />
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
          Next best action
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: C.text }}>{nba.title}</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>{nba.body}</p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 8,
          border: `1px solid ${nba.tone === "go" ? C.accent : C.border}`,
          background: nba.tone === "go" ? C.accent : "#fff",
          color: nba.tone === "go" ? "#fff" : C.text,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {nba.cta}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
