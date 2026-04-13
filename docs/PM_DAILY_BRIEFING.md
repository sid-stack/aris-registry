# PM daily briefing — BidSmith

**Canonical path:** `docs/PM_DAILY_BRIEFING.md`  

**How to use:** Update **§5 Daily targets & results** at least once per day (EOD or next morning). Keep **§2 Product** in sync when ships change. SEO notes in **§3** when you publish, redirect, or change meta.

**Last updated:** 2026-04-14  

---

## 1. Executive snapshot

| | |
|--|--|
| **Company** | BidSmith (ARIS Labs) — GovCon / federal solicitation workflow |
| **Primary CTA** | **Start free audit** → prove value → **pay** (`/dashboard`, fair-use limits) |
| **Honest value prop** | **Decision support**, not win guarantees: faster structured read on SAM.gov / PDF solicitations, risk / disqualifier-style flags, **bid/no-bid recommendation with rationale**. Small and early GovCon teams are the design center. |
| **North-star product question** | Do teams **repeat** the audit when **new** notices drop? |

---

## 2. Product — features & value (PM view)

**Core user journey:** Paste **SAM.gov URL** or upload **PDF** → audit pipeline → workspace artifact (matrix-style requirements, risk read, bid/no-bid framing).

| Capability | User value |
|------------|------------|
| SAM.gov ingestion | Pull notice + attachments without manual download choreography. |
| Compliance-oriented structured pass | Section L/M-style requirements surfaced as **rows you can align on**, not only prose summary. |
| FAR / DFARS-linked risk framing | **Early** visibility on patterns that often drive no-bid or rework. |
| Bid / no-bid + rationale | **Defensible** go/no-go for capture / founder; human still decides. |
| Free tier + limits | **Guest:** tight IP-based cap; **signed-in free:** monthly audit credits (see product copy + API). Paid removes friction for volume. |
| Security story | Zero-knowledge / transient processing narrative on `/soc` — trust lever for GovCon. |
| Newsletter lane | **Hosted ESP** only — `/newsletter`, env-driven embed; see `docs/NEWSLETTER_TOOL_SETUP.md`. Separate from primary “free audit” CTA for in-bid prospects. |

**Not claimed:** Guaranteed award, replacement for capture manager judgment, or enterprise compliance certification unless you have evidence live on site.

**Deep dives:** `docs/CUSTOMER_TO_REVENUE_PLAN.md` · `docs/MOSCOW_PRIORITIES.md` · `docs/RICE-company-profile-live-match.md`  

---

## 3. SEO

### 3.1 SEO ↔ funnel (organic)

Organic is **one** path in the full GTM mix; it feeds **Awareness → Trust → Activation**:

| Funnel stage | SEO role | Primary surfaces |
|--------------|----------|------------------|
| **Awareness** | Intent queries (SAM.gov audit, bid no bid tool, small business GovCon, compliance matrix) land on **BOFU** pages, blog, guide. | `/`, `/blog/*`, `/govcon-guide`, `/rfp-compliance-matrix-generator`, resources |
| **Trust** | Accurate meta + schema + no fake ratings; security + about + demo. | `index.html` JSON-LD, `/soc`, `/about`, `/demo` |
| **Activation** | Same primary story as paid search / social: **free audit**. | Hero, blog CTAs, `/dashboard` |
| **Revenue** | Pricing page matches limits and tiers; no bait-and-switch. | `/pricing` |

**ICP echo in copy:** Small / growing GovCon, **decision support** language (already reflected in default meta and landing — see `docs/SEO_WEEK_1_2_IMPLEMENTATION.md`).

### 3.2 SEO shipped (recent)

- Default **title / description / keywords / OG / Twitter** aligned to decision-support + small GovCon (`index.html`).
- **JSON-LD:** honest SoftwareApplication + FAQ; removed unverified `aggregateRating`; SAM FAQ matches **shipped** behavior (no fake “discovery feed” claim).
- **SPA meta:** `PAGE_META` for key routes in `src/App.jsx`.
- **`/newsletter`** for nurture list (hosted tool; not a duplicate list in our API).

### 3.3 SEO next (backlog)

| Item | Owner | Notes |
|------|-------|------|
| 1 BOFU article / week + internal links to `/dashboard` | Marketing | Tie to free audit CTA. |
| Company profile → live match | Product | Spike per RICE doc; **not** SEO until shipped and truthful. |
| Lighthouse / manual meta spot-check after route changes | Eng | See SEO week 1–2 log. |

---

## 4. GTM — single-avatar funnel (reference)

**One ICP avatar, one channel** for disciplined outbound: see **`docs/SINGLE_FUNNEL_SINGLE_AVATAR.md`** (Jordan · LinkedIn → free audit).

Newsletter = **parallel** nurture, not the same CTA as active-bid Jordan.

---

## 5. Daily targets & results *(update every EOD)*

**Rule:** One **small** target you can **win or lose** in a day. Record honestly what blocked completion.

| Date (local) | Micro-target | Result | If not complete — what stopped you? |
|----------------|--------------|--------|----------------------------------------|
| 2026-04-14 | *Example: 10 Jordan-shaped LinkedIn touches OR 1 BOFU blog outline shipped* | ☐ Complete · ☐ Not complete | *e.g. time, unclear ICP, no signals, deprioritized* |
| | | | |
| | | | |

**Tomorrow’s target (one line):**  

---

## 6. Release / risk notes (optional)

| Item | Status |
|------|--------|
| Redis / Upstash for quota enforcement in prod | Confirm env on Railway if audits must be strictly capped. |
| SMTP (`SMTP_USER`, `SMTP_PASS`, …) | Required for waitlist confirmation / transactional; never commit. |

---

## 7. Related paths (index)

| Doc | Purpose |
|-----|---------|
| `docs/PM_DAILY_BRIEFING.md` | **This file** — daily PM briefing |
| `docs/SEO_WEEK_1_2_IMPLEMENTATION.md` | SEO ship log |
| `docs/CUSTOMER_TO_REVENUE_PLAN.md` | Full C→R narrative |
| `docs/MOSCOW_PRIORITIES.md` | Prioritized backlog |
| `docs/SINGLE_FUNNEL_SINGLE_AVATAR.md` | One avatar, one funnel |
| `docs/NEWSLETTER_TOOL_SETUP.md` | Hosted newsletter + env vars |
