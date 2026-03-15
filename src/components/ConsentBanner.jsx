import { useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
} from "../utils/consent";

export default function ConsentBanner() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  });

  const persistConsent = async (payload) => {
    try {
      await fetch("/api/privacy/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // non-blocking: local consent state is the source of truth for UI behavior
    }
  };

  const acceptAll = async () => {
    const payload = {
      necessary: true,
      analytics: true,
      marketing: true,
      source: "cookie_banner_accept_all",
    };
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, "true");
    await persistConsent(payload);
    setVisible(false);
    window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
  };

  const rejectOptional = async () => {
    const payload = {
      necessary: true,
      analytics: false,
      marketing: false,
      source: "cookie_banner_reject_optional",
    };
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, "false");
    await persistConsent(payload);
    setVisible(false);
  };

  const savePreferences = async () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, String(preferences.analytics));
    await persistConsent({
      ...preferences,
      source: "cookie_banner_custom_save",
    });
    setVisible(false);
    if (preferences.analytics) {
      window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
    }
  };

  if (!visible) return null;

  return (
    <>
      <div style={styles.backdrop} />
      <div style={styles.wrapper}>
        <div style={styles.content}>
          <h3 style={styles.title}>We value your privacy</h3>
          <p style={styles.copy}>
            We use cookies and similar technologies to improve browsing experience,
            measure usage, and personalize engagement. You can accept all,
            reject optional categories, or choose custom preferences.
          </p>
          <button
            type="button"
            style={styles.preferencesToggle}
            onClick={() => setShowPreferences((prev) => !prev)}
          >
            {showPreferences ? "Hide preferences" : "Set consent preferences"}
          </button>
          {showPreferences && (
            <div style={styles.preferencesPanel}>
              <label style={styles.checkboxRow}>
                <input type="checkbox" checked disabled />
                <span>Necessary cookies (always on)</span>
              </label>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, analytics: event.target.checked }))
                  }
                />
                <span>Analytics cookies</span>
              </label>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(event) =>
                    setPreferences((prev) => ({ ...prev, marketing: event.target.checked }))
                  }
                />
                <span>Marketing cookies</span>
              </label>
            </div>
          )}
        </div>
        <div style={styles.actions}>
          <button type="button" onClick={rejectOptional} style={styles.secondaryButton}>
            Reject Optional Cookies
          </button>
          {showPreferences && (
            <button type="button" onClick={savePreferences} style={styles.ghostButton}>
              Save Preferences
            </button>
          )}
          <button type="button" onClick={acceptAll} style={styles.primaryButton}>
            Accept All
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.45)",
    zIndex: 49,
  },
  wrapper: {
    position: "fixed",
    left: 8,
    right: 8,
    bottom: 0,
    zIndex: 50,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: "14px 16px",
    boxShadow: "0 -16px 32px rgba(15,23,42,0.18)",
    maxWidth: "100%",
  },
  content: { 
    flex: "1",
    minWidth: 0,
    marginRight: 8
  },
  title: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "1.1rem",
    lineHeight: 1.2,
    fontWeight: 700,
  },
  copy: { 
    margin: 0, 
    color: "#334155", 
    fontSize: "0.85rem", 
    lineHeight: 1.4,
    display: "none" /* Hide on mobile by default */
  },
  preferencesToggle: {
    marginTop: 8,
    border: "none",
    background: "transparent",
    color: "#0f172a",
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    fontWeight: 600,
    fontSize: "0.8rem",
  },
  preferencesPanel: {
    marginTop: 10,
    display: "grid",
    gap: 6,
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#f8fafc",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#1e293b",
    fontSize: "0.8rem",
  },
  actions: { 
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "stretch",
    minWidth: "140px"
  },
  secondaryButton: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #0f172a",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.8rem",
    textAlign: "center",
  },
  ghostButton: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #94a3b8",
    background: "#f8fafc",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.8rem",
    textAlign: "center",
  },
  primaryButton: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.8rem",
    textAlign: "center",
  },

  /* Tablet styles */
  "@media (min-width: 641px)": {
    wrapper: {
      left: 16,
      right: 16,
      padding: "16px 20px",
      gap: 16,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
    },
    content: {
      marginRight: 16,
    },
    title: {
      fontSize: "1.4rem",
      marginBottom: 8,
    },
    copy: {
      display: "block",
      fontSize: "0.95rem",
    },
    preferencesToggle: {
      fontSize: "0.9rem",
      marginTop: 12,
    },
    preferencesPanel: {
      marginTop: 12,
      padding: "10px 12px",
      gap: 8,
    },
    checkboxRow: {
      fontSize: "0.9rem",
      gap: 10,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: "auto",
      marginLeft: "auto",
    },
    secondaryButton: {
      padding: "12px 20px",
      borderRadius: 999,
      fontSize: "0.9rem",
    },
    ghostButton: {
      padding: "12px 18px",
      borderRadius: 999,
      fontSize: "0.9rem",
    },
    primaryButton: {
      padding: "12px 20px",
      borderRadius: 999,
      fontSize: "0.9rem",
    },
  },

  /* Desktop styles */
  "@media (min-width: 1024px)": {
    wrapper: {
      left: 20,
      right: 20,
      padding: "18px 24px",
      gap: 18,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      boxShadow: "0 -24px 50px rgba(15,23,42,0.22)",
    },
    content: {
      maxWidth: 600,
      marginRight: 24,
    },
    title: {
      fontSize: "2rem",
      marginBottom: 8,
    },
    copy: {
      fontSize: "1.15rem",
    },
    preferencesToggle: {
      fontSize: "1rem",
      marginTop: 10,
    },
    preferencesPanel: {
      marginTop: 12,
      padding: "10px 12px",
      gap: 8,
    },
    checkboxRow: {
      fontSize: "0.95rem",
      gap: 10,
    },
    actions: {
      gap: 10,
    },
    secondaryButton: {
      padding: "12px 22px",
      fontSize: "1rem",
    },
    ghostButton: {
      padding: "12px 20px",
      fontSize: "1rem",
    },
    primaryButton: {
      padding: "12px 22px",
      fontSize: "1rem",
    },
  },
};
