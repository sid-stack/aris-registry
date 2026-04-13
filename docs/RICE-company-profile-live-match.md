# RICE: “Match company profile → live / open bids”

**Idea:** Given a company profile (NAICS, certs, size, past performance summary, geo, set-aside eligibility), continuously or on-demand **surface and rank open SAM.gov (or federated) opportunities** that fit—so BD spends time on shaped pursuits, not raw search noise.

RICE = **(Reach × Impact × Confidence) ÷ Effort** (higher = prioritize).

Scoring scale used below: **Reach & Impact 1–10**, **Confidence 0–100%** as decimal, **Effort 1–10 person-weeks** (rough).

---

## Reach (who benefits, how often)

| Score | Rationale |
|------|-----------|
| **8** | Every **small / early GovCon** team with BD capacity does opportunity ID weekly; “what should we look at today?” is universal. |

---

## Impact (on revenue / retention if we ship it well)

| Score | Rationale |
|------|-----------|
| **9** | Directly increases **qualified pipeline** and justifies **paid tier** (search + match is a natural upgrade from “audit one RFP”). High leverage vs. one-off audits alone. |

---

## Confidence (% we can ship something buyers love)

| % | Rationale |
|---|-----------|
| **0.55** | **Data:** SAM.gov APIs + caching are already in your world; **matching** needs clean profile schema + scoring + explainability (“why this fit”). **Risk:** False positives destroy trust in GovCon—must show *reasons* and confidence, not a black box. **Regulatory / ToS:** Respect SAM.gov terms, rate limits, attribution. |

---

## Effort (engineering + product + GTM, first useful v1)

| Score | Scope (v1) |
|------|------------|
| **7** | Profile model + UI, ingestion of active opps (or partner data), scoring engine v0, explainability UI, quotas, monitoring, **human-reviewable** defaults. Not “full CRM replacement.” |

---

## RICE calculation (comparable score)

\[
\text{RICE} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}
= \frac{8 \times 9 \times 0.55}{7} \approx 5.7
\]

**Interpretation:** **Strong candidate**—high impact and reach, moderate build cost, **confidence is the gating variable** (trust + accuracy).

---

## Decision recommendation

1. **Do a 2-week spike** before full roadmap:  
   - Define **minimum profile** (10 fields).  
   - Define **match output**: ranked list + 3 bullet “why matched” + “why cautious.”  
   - Measure **precision** on 30 hand-labeled opps (founder + 1 advisor).  
2. **Ship only if** false-positive rate is acceptable for a *beta* label (“suggestions, verify in solicitation”).  
3. **Positioning:** Never “we guarantee fit”—**“prioritized shortlist + rationale”** (aligns with your **guiding light** promise).

---

## Comparison (contextual)

| Initiative | Approx. RICE | Note |
|------------|--------------|------|
| **Instant audit (current)** | Higher | Core wedge; keep investing. |
| **Profile → live match** | ~5.7 | Strategic growth; validate with spike. |
| **Agency-only vanity search** | Lower | Reach drops unless ICP is narrow. |

*Numbers are planning estimates—re-score after the spike with real effort and confidence.*
