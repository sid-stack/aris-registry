# BidSmith UI design system (source of truth)

**Read this file before changing any customer-facing UI** (marketing pages, dashboard chrome, modals, emails rendered in-app).

## Brand surfaces

| Surface | Use | Default text |
|--------|-----|----------------|
| **Light** | Mint/cream page body (`#f0f7ee`), white cards | Navy / slate (`#0f172a`, `#002244`, `#0B3D91`) for headings; `#475569`–`#334155` for body; never body copy lighter than `#6b7280` on white. |
| **Dark navy** | Hero bars, footers (`#001529`, `#002244`, gradients) | **Always `#ffffff` or `#f8fafc`** for primary labels, buttons, and key links. Muted lines may use `#cbd5e1` / `#e2e8f0`, not brown/gray (`#776871`) on navy. |
| **Accent fill** | “Book / Calendly” gradient (`.btn-meeting`) | **Always white label** (`#fff`). Do not pair navy text with navy/dark fill. |

## Buttons (non‑negotiable)

1. **Dark or high‑contrast fill** (navy, `#002244`, gradient `.btn-meeting`, danger red, success green chips): label and icons **`#ffffff`** (or `#f8fafc` for secondary emphasis). **Never** `#002244`, `#0f172a`, or `C.navy` on those fills.
2. **Light fill** (white, `#f8fafc`, `#afdedc` “frosted”): label may be navy (`#002244` / `#0B3D91`).
3. **Ghost / outline on dark**: border + text use **`#e2e8f0`** or **`#cbd5e1`** minimum — not `rgba(255,255,255,0.35)` for primary actions.

## Landing‑specific

- `.btn-meeting` applies a **dark gradient with `!important`**. Inline styles **must not** set `color` to navy or `background` to white in a way that fights the class. Prefer `S.ctaPrimary` (navy + white text) as the base object, then let `.btn-meeting` override **background only**; label color stays white via CSS + `S.ctaPrimary`.
- **Footer** on `#001529`: links and legal at **`#e2e8f0` / `#cbd5e1`**, not `C.dimGrey` (`#776871`).

## Typography

- Headings on light: `#002244` / `#0f172a`.
- Headings on dark: `#ffffff`.
- Avoid `font-weight: 300` on marketing copy under 18px.

## Tokens

Canonical CSS variables for light surfaces live in `src/styles/contrast-tokens.css` and `index.html` `[data-theme="light"]`. Prefer them for new global CSS.

## When unsure

If a control sits on **luminance &lt; ~0.15** (dark blue/black), default to **white text**. If it sits on **luminance &gt; ~0.9**, default to **navy/slate text**.
