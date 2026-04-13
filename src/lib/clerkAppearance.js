/**
 * Clerk SignIn / SignUp appearance — high contrast, 16px base, clear hierarchy.
 * Single source of truth for ClerkProvider (and inherited by embedded auth).
 */
export const clerkAppearance = {
  layout: {
    socialButtonsVariant: "blockButton",
    socialButtonsPlacement: "top",
  },
  variables: {
    fontFamily:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: "16px",
    colorBackground: "#ffffff",
    colorText: "#0f172a",
    colorTextSecondary: "#475569",
    colorTextOnPrimaryBackground: "#ffffff",
    colorPrimary: "#1d4ed8",
    colorDanger: "#b91c1c",
    colorSuccess: "#15803d",
    colorInputBackground: "#ffffff",
    colorInputText: "#0f172a",
    colorNeutral: "#cbd5e1",
    borderRadius: "12px",
  },
  elements: {
    rootBox: {
      width: "100%",
    },
    card: {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.22)",
    },
    headerTitle: {
      fontSize: "1.375rem",
      fontWeight: 700,
      color: "#0f172a",
      letterSpacing: "-0.02em",
      lineHeight: 1.3,
    },
    headerSubtitle: {
      fontSize: "0.9375rem",
      color: "#475569",
      lineHeight: 1.55,
      marginTop: "0.25rem",
    },
    socialButtonsBlockButton: {
      border: "1px solid #cbd5e1",
      color: "#0f172a",
      fontSize: "0.9375rem",
      fontWeight: 600,
      minHeight: "46px",
    },
    socialButtonsBlockButtonText: {
      fontWeight: 600,
    },
    dividerLine: {
      background: "#e2e8f0",
    },
    dividerText: {
      color: "#64748b",
      fontSize: "0.8125rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
    },
    formFieldLabel: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: "#0f172a",
      marginBottom: "0.35rem",
    },
    formFieldInput: {
      fontSize: "1rem",
      lineHeight: 1.45,
    },
    formFieldInputShowPasswordButton: {
      color: "#475569",
    },
    formButtonPrimary: {
      fontSize: "1rem",
      fontWeight: 600,
      minHeight: "48px",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
    },
    formButtonReset: {
      fontSize: "0.9375rem",
      color: "#475569",
    },
    footer: {
      marginTop: "0.5rem",
    },
    footerAction: {
      fontSize: "0.9375rem",
      color: "#475569",
      lineHeight: 1.5,
    },
    footerActionLink: {
      fontWeight: 600,
      color: "#1d4ed8",
      textDecoration: "none",
    },
    formFieldErrorText: {
      fontSize: "0.875rem",
      fontWeight: 500,
    },
    formFieldSuccessText: {
      fontSize: "0.875rem",
    },
    identityPreviewText: {
      fontSize: "0.9375rem",
      color: "#0f172a",
      fontWeight: 500,
    },
    alternativeMethodsBlockButton: {
      fontSize: "0.9375rem",
      fontWeight: 500,
      border: "1px solid #e2e8f0",
      color: "#0f172a",
    },
    formResendCodeLink: {
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: "#1d4ed8",
    },
    otpCodeFieldInput: {
      fontSize: "1.125rem",
      fontWeight: 600,
    },
  },
};
