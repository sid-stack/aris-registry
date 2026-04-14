import { useState, useEffect, useRef } from "react";
import { Shield, Send, RotateCcw, Loader2, ExternalLink } from "lucide-react";
import { ChatMarkdown } from "../chat/ChatMarkdown.jsx";

/** Markdown colors for AI bubbles (dark slate background). */
const AI_MARKDOWN_PALETTE = {
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  accent: "#93c5fd",
  border: "#475569",
  borderHi: "#64748b",
  surfaceHi: "#334155",
};

const cs = {
  shell: {
    background: "#fff",
    border: "1px solid #dadce0",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    flex: 1,
    boxSizing: "border-box",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderBottom: "1px solid #e8eaed",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 13, fontWeight: 500, color: "#5f6368" },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.04em",
    padding: "2px 8px",
    borderRadius: 4,
    border: "1px solid",
    textTransform: "uppercase",
  },
  resetBtn: {
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 500,
    color: "#1a73e8",
    background: "transparent",
    border: "none",
    borderRadius: 4,
    padding: "6px 8px",
    cursor: "pointer",
  },
  thread: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "12px 14px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    scrollbarWidth: "thin",
  },
  aiAvatar: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    flexShrink: 0,
    background: "#334155",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bubble: {
    fontSize: 14,
    lineHeight: 1.55,
    padding: "10px 14px",
    border: "1px solid #e8eaed",
    wordBreak: "break-word",
    borderRadius: 8,
  },
  extLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "#1967d2",
    background: "#e8f0fe",
    border: "1px solid #d2e3fc",
    borderRadius: 4,
    padding: "4px 8px",
    textDecoration: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%",
  },
  extLinkOnDark: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "#bfdbfe",
    background: "rgba(15, 23, 42, 0.45)",
    border: "1px solid #475569",
    borderRadius: 4,
    padding: "4px 8px",
    textDecoration: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "100%",
  },
  inputWrap: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    padding: "10px 12px 12px",
    borderTop: "1px solid #e8eaed",
    flexShrink: 0,
    background: "#fff",
  },
  textarea: {
    flex: 1,
    background: "#f8f9fa",
    border: "1px solid #dadce0",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#202124",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    resize: "none",
    lineHeight: 1.45,
    maxHeight: 100,
    overflowY: "auto",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    flexShrink: 0,
    background: "#1a73e8",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s",
  },
};

/**
 * Center column: conversational ARIS (messages driven by parent).
 */
export default function WorkspaceChat({
  messages,
  loading,
  onSend,
  placeholder,
  headerBadge,
  headerBadgeColor,
  headerTitle = "Conversation",
  onClearThread,
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const submit = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    onSend(text);
  };

  return (
    <div style={cs.shell}>
      <div style={cs.header}>
        <div style={cs.headerLeft}>
          <span
            style={{
              ...cs.badge,
              color: headerBadgeColor,
              borderColor: `${headerBadgeColor}44`,
              background: `${headerBadgeColor}14`,
            }}
          >
            {headerBadge}
          </span>
          <span style={cs.headerTitle}>{headerTitle}</span>
        </div>
        {onClearThread && (
          <button
            type="button"
            onClick={onClearThread}
            style={cs.resetBtn}
            title="Reset conversation"
            aria-label="Clear conversation"
          >
            <RotateCcw size={12} style={{ marginRight: 5 }} aria-hidden /> Clear chat
          </button>
        )}
      </div>

      <div
        style={cs.thread}
        className="workspace-chat-thread"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation messages"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "ai" && (
              <div style={cs.aiAvatar}>
                <Shield size={10} color="#93c5fd" />
              </div>
            )}
            <div
              style={{
                ...cs.bubble,
                background: msg.role === "user" ? "#4338ca" : "#1e293b",
                borderColor: msg.role === "user" ? "#3730a3" : "#334155",
                color: msg.role === "user" ? "#ffffff" : "#f1f5f9",
                maxWidth: msg.role === "user" ? "82%" : "92%",
                borderRadius: 8,
              }}
            >
              {msg.role === "ai" && (msg.plan?.steps?.length > 0 || msg.plan?.next_action) && (
                <div
                  style={{
                    marginBottom: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "#334155",
                    border: "1px solid #475569",
                  }}
                >
                  {msg.plan.steps?.length > 0 && (
                    <>
                      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 500, color: "#93c5fd" }}>Plan</p>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#e2e8f0", lineHeight: 1.45 }}>
                        {msg.plan.steps.map((s) => (
                          <li key={s.id} style={{ marginBottom: 2 }}>
                            <span style={{ marginRight: 4 }}>{s.status === "done" ? "✓" : "○"}</span>
                            <ChatMarkdown variant="inline" content={s.title || ""} palette={AI_MARKDOWN_PALETTE} />
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {msg.plan.next_action ? (
                    <div
                      style={{
                        margin: msg.plan.steps?.length ? "6px 0 0" : 0,
                        fontSize: 13,
                        color: "#93c5fd",
                        fontWeight: 500,
                        lineHeight: 1.5,
                      }}
                    >
                      Next:{" "}
                      <ChatMarkdown variant="inline" content={msg.plan.next_action} palette={AI_MARKDOWN_PALETTE} />
                    </div>
                  ) : null}
                </div>
              )}
              {msg.role === "ai" ? (
                <div className="workspace-chat-md" style={{ fontSize: 14, lineHeight: 1.65, color: "#f1f5f9" }}>
                  <ChatMarkdown content={msg.text || ""} palette={AI_MARKDOWN_PALETTE} />
                </div>
              ) : (
                <span style={{ whiteSpace: "pre-wrap", color: "#ffffff" }}>{msg.text}</span>
              )}
              {msg.role === "ai" && msg.externalLinks?.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                  {msg.externalLinks.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={cs.extLinkOnDark}>
                      <ExternalLink size={10} /> {link.replace(/^https?:\/\//, "")}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={cs.aiAvatar}>
              <Shield size={10} color="#93c5fd" />
            </div>
            <div style={{ ...cs.bubble, background: "#1e293b", borderColor: "#334155", color: "#f1f5f9" }}>
              <span style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#94a3b8",
                      animation: `bounce 1.2s ${i * 0.2}s infinite`,
                      display: "inline-block",
                    }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={cs.inputWrap}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label="Message input"
          rows={1}
          style={cs.textarea}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!input.trim() || loading}
          aria-label={loading ? "Sending message" : "Send message"}
          style={{ ...cs.sendBtn, opacity: !input.trim() || loading ? 0.4 : 1 }}
        >
          {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
        </button>
      </div>
      <style>{`
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0.85); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
