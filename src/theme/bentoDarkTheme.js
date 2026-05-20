/**
 * BidSmith Command Center — fixed dark palette (always dark).
 * Text never uses pure #fff / #ffffff; use BD.textBright (#f1f5f9) for strongest emphasis.
 *
 * Pairings used in UI are checked in `bentoDarkTheme.test.ts`.
 */
export const BD = {
  bgApp: "#0d1219",
  bgShell:
    "linear-gradient(165deg, #0d1219 0%, #111827 45%, #0a0f14 100%)",
  bgRail: "linear-gradient(180deg, #151d2a 0%, #111827 100%)",
  bgRailHead: "#1a2434",
  bgRailTabs: "#131c28",
  bgPanel: "#1a2434",
  bgPanelHi: "#243044",
  bgCard: "#1e2a3c",
  bgInput: "#0f1724",
  bgFeatured: "rgba(30, 42, 60, 0.94)",
  bgToastNeutral: "#243044",
  bgToastSuccess: "#14221a",
  bgToastError: "#2a1515",
  border: "#334155",
  borderHi: "#475569",
  borderSoft: "#243044",
  textBright: "#f1f5f9",
  textPrimary: "#e2e8f0",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  textOnAccent: "#0b1220",
  accent: "#7cb8ff",
  accentBtn: "#3b82f6",
  link: "#93c5fd",
  success: "#4ade80",
  successSoft: "rgba(34, 197, 94, 0.18)",
  danger: "#f87171",
  warning: "#fbbf24",
  tabActiveFg: "#f1f5f9",
  chipBg: "#243047",
  trackBar: "#2d3d52",
  matrixRowBorder: "#334155",
  paywallCtaBg: "#2563eb",
  billingBg: "rgba(34, 197, 94, 0.12)",
  billingFg: "#4ade80",
};

/** Solid colors used in tests (approximate dominant tones for gradients). */
export const BD_SOLID = {
  shell: "#111827",
  rail: "#151d2a",
  card: BD.bgCard,
  panel: BD.bgPanel,
  input: BD.bgInput,
  featured: "#1e2a3c",
  tabActive: "#2563eb",
};

const HEX = /^#?([0-9a-f]{6})$/i;

export function hexToRgb(hex) {
  const m = String(hex || "").trim().match(HEX);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** WCAG relative luminance (sRGB). */
export function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const lin = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG 2 contrast ratio (1..21). */
export function contrastRatio(bgHex, fgHex) {
  const L1 = relativeLuminance(bgHex);
  const L2 = relativeLuminance(fgHex);
  if (L1 == null || L2 == null) return null;
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

const FORBIDDEN = new Set(["#fff", "#ffffff"]);

export function textTokensAvoidPureWhite() {
  const textKeys = [
    "textBright",
    "textPrimary",
    "textSecondary",
    "textMuted",
    "textDim",
    "textOnAccent",
    "tabActiveFg",
  ];
  for (const k of textKeys) {
    const v = String(BD[k] || "").toLowerCase();
    if (FORBIDDEN.has(v)) return false;
  }
  return true;
}

/**
 * Declared foreground-on-background pairs to enforce readability.
 * Use solid approximations for surfaces that are gradients in the UI.
 */
export const BENTO_DARK_TEXT_PAIRS = [
  { bg: BD_SOLID.shell, fg: BD.textPrimary, label: "shell · primary" },
  { bg: BD_SOLID.shell, fg: BD.textMuted, label: "shell · muted" },
  { bg: BD_SOLID.card, fg: BD.textPrimary, label: "card · primary" },
  { bg: BD_SOLID.card, fg: BD.textMuted, label: "card · muted" },
  { bg: BD_SOLID.panel, fg: BD.textSecondary, label: "panel · secondary" },
  { bg: BD_SOLID.input, fg: BD.textPrimary, label: "input · primary" },
  { bg: BD_SOLID.tabActive, fg: BD.tabActiveFg, label: "tab active" },
  { bg: BD.paywallCtaBg, fg: BD.textBright, label: "accent button" },
  { bg: BD_SOLID.rail, fg: BD.textMuted, label: "rail · muted" },
];
