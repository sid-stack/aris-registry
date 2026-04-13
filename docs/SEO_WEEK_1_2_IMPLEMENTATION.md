# SEO weeks 1–2 — what shipped (implementation log)

This document records **on-site SEO and messaging alignment** for the first two weeks of the growth plan: ICP clarity (small / early GovCon), honest value prop (decision support, not win guarantees), and primary CTA (**Start free audit** with fair-use limits).

## Shipped in the codebase

| Area | Change |
|------|--------|
| **`index.html`** | Default `<title>`, meta `description`, `keywords`, Open Graph and Twitter copy aligned to SAM.gov audit + bid/no-bid **decision support** for small GovCon. OG/Twitter image **alt** text updated to match. |
| **JSON-LD** | `SoftwareApplication` description softened to decision-support language; **removed `aggregateRating`** until there are verifiable public reviews (avoids misleading rich results and supports trust). FAQ answers updated: no over-claim on “Discovery feed” matching; SAM.gov + per-solicitation audit emphasized. Duplicate `bidsmith-software-snippet` description aligned. |
| **`src/App.jsx` `PAGE_META`** | `landing`, `dashboard`, and `pricing` titles/descriptions match the same positioning and mention fair-use / guest-by-IP limits where relevant. |
| **`src/pages/Landing.jsx`** | Hero badge, H1, subhead, deep-dive **Bid/No-Bid** tab body, and trust bar bullets aligned to **guiding-light** positioning and **IP / account** fair-use messaging. |

## Not in scope for this slice (track separately)

- New blog posts or backlinks (week 2+ content calendar — see `docs/CUSTOMER_TO_REVENUE_PLAN.md`).
- Technical **company profile → live bids** matching (RICE and spike plan: `docs/RICE-company-profile-live-match.md`).
- SOC 2 / formal compliance program (prioritized in `docs/MOSCOW_PRIORITIES.md`).

## Weekly rhythm (reminder)

1. Ship one BOFU asset or blog post per week tied to “free audit” CTA.  
2. Keep on-page language consistent with **no award guarantees** — recommend + rationale only.  
3. Re-run Lighthouse / manual spot-check of `title` + `description` on `/`, `/pricing`, `/dashboard` after route changes.
