import { useState } from "react";
import { trackEvent } from "../utils/analytics";
import { GTM_PRICING_PLANS } from "../lib/pricing";
import CodeAuditTester from "../components/CodeAuditTester";
import DiscoverAgent from "../components/DiscoverAgent";

const quickWinTemplate = `Quick win for [Client Name] - Bidsmith Lite Pilot

Hi [Client Name],

I am [Your Name] from Bidsmith. We built a lightweight, AI-driven RFP assistant that cuts manual bid-prep time by about 70% and improves SAM.gov compliance.

What we can deliver in 30 days:
- Two pre-registered capability agents (for example, media.transcode.ffmpeg and lang.translate.hindi)
- Live dashboard showing latency, success rate, and cost per transaction
- Full report with ROI (target >=30% win-rate lift)

Pricing options:
- Starter - $29/mo + $0.25/call (after 200 free calls)
- Growth - $199/mo (1,000 calls) + $0.20/call overage
- Pilot - $2,500 / 30 days (onboarding + 5,000 calls)
- Enterprise - Custom (no fixed price)

If you are interested, just reply "Yes" and I will send over the short agreement and a Calendly link for a 15-minute kickoff call.

Looking forward to helping [Client Name] win more SAM.gov opportunities.

- [Your Name] | Bidsmith Ltd. | support@bidsmith.pro`;

const pilotAgreementTemplate = `# Bidsmith Lite - Pilot Agreement

Effective Date: ___________________
Client: ___________________
Bidsmith Ltd. (hereinafter "Provider")

## 1. Scope of Services
| Item | Description |
|------|-------------|
| Software | Bidsmith Lite (SDK, Registry, and two pre-registered agents). |
| Duration | 30 calendar days from the Effective Date. |
| Deliverables | Integration guide; Live dashboard access; Weekly status email; Final ROI report |

## 2. Fees and Payment
| Milestone | Amount (USD) | Due |
|-----------|--------------|-----|
| Starter | $29/mo + $0.25/call | Self-serve |
| Growth | $199/mo includes 1,000 calls | $0.20/call overage |
| Pilot | $2,500 / 30 days | Includes onboarding + 5,000 calls |
| Enterprise | Custom | Contracted terms |

Payments are to be made via Stripe or wire transfer to the account listed on the invoice.

## 3. Confidentiality
Both parties agree to keep all non-public information confidential and to use it solely for the purpose of this pilot.

## 4. Termination
Either party may terminate with 7 days written notice. Provider will refund any unused prepaid transaction credits on a pro-rated basis.

## 5. Liability
Provider's total liability shall not exceed the fees paid by the Client under this Agreement.

## 6. Acceptance
By signing below, both parties acknowledge and accept the terms above.

Client
Signature: _______________________
Name (print): ___________________
Date: ____________________________

Provider - Bidsmith Ltd.
Signature: _______________________
Name (print): ___________________
Date: ____________________________`;

function TemplateBlock({ title, content }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      trackEvent("template_copy_click", { template_name: title });
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section style={styles.block}>
      <div style={styles.blockHeader}>
        <h2 style={styles.blockTitle}>{title}</h2>
        <button type="button" onClick={handleCopy} style={styles.copyButton}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea readOnly value={content} style={styles.textarea} />
    </section>
  );
}

export default function Templates() {
  const pricingLadder = GTM_PRICING_PLANS.map((plan) => `- ${plan.callout}`).join("\n");

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Bidsmith Templates</h1>
        <p style={styles.subtitle}>
          Internal reference snippets for outbound pilot outreach and agreement
          docs.
        </p>
      </header>

      <TemplateBlock title="Quick Win Outreach Email" content={quickWinTemplate} />
      <TemplateBlock title="Pilot Agreement Template" content={pilotAgreementTemplate} />
      <TemplateBlock title="Pricing Ladder Reference" content={pricingLadder} />
      <CodeAuditTester />
      <DiscoverAgent />
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "32px 18px 48px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: { maxWidth: 1080, margin: "0 auto 20px" },
  title: { margin: 0, fontSize: "2rem" },
  subtitle: { margin: "8px 0 0", color: "#64748b" },
  block: {
    maxWidth: 1080,
    margin: "0 auto 16px",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
  },
  blockHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  blockTitle: { margin: 0, fontSize: "1.1rem" },
  copyButton: {
    background: "#0f172a",
    color: "#ffffff",
    border: "1px solid #0f172a",
    borderRadius: 8,
    padding: "7px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    minHeight: 300,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 13,
    lineHeight: 1.55,
    padding: 12,
    resize: "vertical",
    color: "#1e293b",
    background: "#f8fafc",
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
};
