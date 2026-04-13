# One funnel · one avatar (only ICP to serve for this lane)

Everything below is **intentionally narrow**. Say no to other personas until this lane converts.

---

## The avatar (only)

| Field | Definition |
|--------|------------|
| **Name (composite)** | **Jordan** — use as mental model, not a fake testimonial name on the site. |
| **Role** | **Founder / Head of BD** at a **15–45 person** professional services or IT firm **actively responding to federal RFPs** (SAM.gov, GWACs, or agency-specific). |
| **Federal maturity** | **Early**: 0–3 years of meaningful federal capture; **no** dedicated 5-person proposal shop; often **reads RFPs themselves** or with one capture/proposal lead. |
| **Buying trigger** | New notice dropped **this week**; team already burned once on a **bad bid**; needs a **defensible no-bid** or **fast yes with eyes open**. |
| **Job-to-be-done** | “**Is this worth our next two weeks?**” — structured read + **bid/no-bid rationale**, not a magic win promise. |
| **Anti-fit** | Large primes, pure product with no RFP motion, classified programs, “AI will win the bid for us” buyers. |

**One-line who we’re for:**  
*Small federal services shops where the owner or BD lead still opens the PDF.*

---

## The single funnel (one channel)

**Channel:** **LinkedIn only** (posts + DMs). No cold email in this lane until Jordan converts predictably here.

| Step | What Jordan sees | Asset / URL | Success signal |
|------|-------------------|-------------|----------------|
| **1 · Awareness** | Short post or comment on **their** world: bid/no-bid discipline, Section L/M, amendment fatigue, “one SAM notice this week.” | Your profile → link in featured / bio: `https://www.bidsmith.pro/dashboard` (free audit) or `/` | Saves, profile visits, inbound connection requests |
| **2 · Interest** | DM after **one** relevant signal (hiring capture, fed post, SAM mention). **No** deck; **one** question + one link. | Same primary CTA | Reply or click |
| **3 · Activation** | **Start free audit** — paste SAM URL or PDF. | `/dashboard` | Audit started (Plausible / product) |
| **4 · Aha** | Artifact they can forward internally: matrix + rationale. | In-app export / share | Return within 7 days |
| **5 · Revenue** | Hit limit or need volume → upgrade. | `/pricing` | Checkout |

**Primary CTA everywhere in this funnel:** **Start free audit** (not newsletter — Jordan is in active bid mode).

---

## One DM template (Jordan-specific)

Use only after a **real** signal (their post, job listing, comment on RFP pain).

> Hey [First name] — saw [specific signal].  
> We built BidSmith for teams like yours: paste a SAM.gov notice, get a structured first pass + bid/no-bid **rationale** in a few minutes (decision support, not a win guarantee).  
> If you’re looking at something live this week: **[link]** — happy for feedback if it misses the mark.

---

## Optional: one SMTP touch (after they used the product)

Use only if you have **their email** (e.g. Clerk user, Calendly, or they replied). The API already sends mail when **`SMTP_USER`**, **`SMTP_PASS`**, and optionally **`MAIL_FROM`** / **`MAIL_FROM_NAME`** are set in **your** environment (see `api/utils/mailer.js`). **Do not commit keys**; load from `.env` on the server only.

**Day +3 — only if they ran an audit and didn’t upgrade**

- **Subject:** Quick check — did the SAM read match how you saw the RFP?  
- **Body (short):** One question + link to `/pricing` + offer to jump on 15m Calendly if matrix export was wrong for their workflow.

---

## Daily target (win by EOD)

- **10** meaningful LinkedIn touches **only to Jordan-shaped profiles** (5 comments on signal posts + 5 tailored DMs), **or** **3** if quality drops.  
- **Zero** outreach to non-avatar ICP.

---

## Metrics to watch (this lane only)

| Metric | Why |
|--------|-----|
| DM → audit start rate | Funnel health |
| Audit → return in 7d | Aha |
| Free → paid | Revenue |

---

## Doc map

- Full GTM context: `docs/CUSTOMER_TO_REVENUE_PLAN.md`  
- MoSCoW backlog: `docs/MOSCOW_PRIORITIES.md`  
- Newsletter is a **separate** lane: `docs/NEWSLETTER_TOOL_SETUP.md` (not the primary CTA for Jordan).
