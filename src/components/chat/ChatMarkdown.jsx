/**
 * Shared markdown for assistant chat bubbles (GovCon + Bento).
 * Mirrors GovConDashboardV2 GovChatMarkdown / govMarkdownComponents + remarkGfm tables.
 */
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeEngineMarkdown } from "../../utils/normalizeEngineMarkdown.js";

export { normalizeEngineMarkdown };

/** Default palette aligned with GovConDashboardV2 `C` chat colors. */
export const GOV_DEFAULT_CHAT_PALETTE = {
  text: "#0d0d0d",
  textMuted: "#374151",
  accent: "#10a37f",
  border: "#e5e7eb",
  borderHi: "#d1d5db",
  surfaceHi: "#f3f4f6",
};

/** Bento WorkspaceChat bubble (light Material-like grays + blue accent). */
export const BENTO_WORKSPACE_CHAT_PALETTE = {
  text: "#202124",
  textMuted: "#5f6368",
  accent: "#1a73e8",
  border: "#e8eaed",
  borderHi: "#dadce0",
  surfaceHi: "#f1f3f4",
};

function buildChatMarkdownComponents(palette, variant) {
  const isInline = variant === "inline";
  const P = palette;
  const text = () => (isInline ? { color: P.text, fontSize: "inherit", lineHeight: 1.5 } : { color: P.text });
  return {
    p: ({ children }) => (isInline
      ? <span style={{ ...text(), display: "block", marginBottom: 4 }}>{children}</span>
      : <p style={{ margin: "0 0 10px", color: P.text }}>{children}</p>),
    ul: ({ children }) => (isInline
      ? <span style={text()}>{children}</span>
      : <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>{children}</ul>),
    ol: ({ children }) => (isInline
      ? <span style={text()}>{children}</span>
      : <ol style={{ margin: "0 0 10px", paddingLeft: 20 }}>{children}</ol>),
    li: ({ children }) => (isInline
      ? <span style={{ ...text(), display: "block", marginBottom: 4 }}>{children}</span>
      : <li style={{ marginBottom: 5, color: P.text }}>{children}</li>),
    strong: ({ children }) => <strong style={{ fontWeight: 700, color: P.text }}>{children}</strong>,
    em: ({ children }) => <em style={{ fontStyle: "italic", color: P.textMuted }}>{children}</em>,
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: P.accent, fontWeight: 600 }}>
        {children}
      </a>
    ),
    h1: ({ children }) => <h1 style={{ fontSize: isInline ? "1.05em" : 18, fontWeight: 800, margin: isInline ? "0 0 4px" : "12px 0 8px", color: P.text }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: isInline ? "1em" : 16, fontWeight: 800, margin: isInline ? "0 0 4px" : "12px 0 8px", color: P.text }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: isInline ? "1em" : 15, fontWeight: 700, margin: isInline ? "0 0 4px" : "10px 0 6px", color: P.text }}>{children}</h3>,
    h4: ({ children }) => <h4 style={{ fontSize: isInline ? "0.95em" : 14, fontWeight: 700, margin: isInline ? "0 0 4px" : "8px 0 6px", color: P.text }}>{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote style={{
        margin: isInline ? "4px 0" : "0 0 10px",
        paddingLeft: 12,
        borderLeft: `3px solid ${P.borderHi}`,
        color: P.textMuted,
      }}
      >{children}</blockquote>
    ),
    code: ({ inline, className, children, ...props }) => {
      if (inline) {
        return (
          <code
            style={{
              background: P.surfaceHi,
              border: `1px solid ${P.border}`,
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: "0.92em",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: "#0369a1",
            }}
            {...props}
          >{children}</code>
        );
      }
      return (
        <code
          className={className}
          style={{
            display: "block",
            fontSize: 13,
            padding: 10,
            borderRadius: 8,
            background: P.surfaceHi,
            border: `1px solid ${P.border}`,
            overflowX: "auto",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
          {...props}
        >{children}</code>
      );
    },
    pre: ({ children }) => <pre style={{ margin: "0 0 10px", overflow: "auto" }}>{children}</pre>,
    hr: () => <hr style={{ border: "none", borderTop: `1px solid ${P.border}`, margin: "12px 0" }} />,
    table: ({ children }) => (
      <div style={{ overflowX: "auto", margin: "0 0 10px" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%" }}>{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th style={{ border: `1px solid ${P.border}`, padding: "6px 8px", textAlign: "left", background: P.surfaceHi }}>{children}</th>
    ),
    td: ({ children }) => (
      <td style={{ border: `1px solid ${P.border}`, padding: "6px 8px" }}>{children}</td>
    ),
  };
}

export function ChatMarkdown({ content, variant = "chat", palette = GOV_DEFAULT_CHAT_PALETTE }) {
  const text = normalizeEngineMarkdown(content);
  const components = useMemo(() => buildChatMarkdownComponents(palette, variant), [palette, variant]);
  if (!text) return null;
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  );
}
