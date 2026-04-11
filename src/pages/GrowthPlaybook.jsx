import { useMemo, useState } from "react";
import { ArrowLeft, Copy } from "lucide-react";
import { BOFU_RESOURCES, INTENT_CLUSTERS, TEMPLATE_ASSETS } from "../content/growthPlanData";
import { trackEvent } from "../utils/analytics";

const FOUNDER_CALENDAR = [
  {
    week: "Week 1",
    posts: [
      "Teardown: 3 compliance misses that kill otherwise winnable bids.",
      "Framework: a 4-block bid/no-bid scorecard capture teams can use in 15 minutes.",
      "Proof: before/after workflow showing manual vs automated compliance review.",
      "Offer: free RFP audit CTA linked to a BOFU resource page.",
    ],
  },
  {
    week: "Week 2",
    posts: [
      "Teardown: Section L failure examples and quick remediation process.",
      "Framework: how to prioritize federal opportunities by pWin and strategic value.",
      "Proof: sample matrix output and how proposal managers use it.",
      "Offer: compliance checklist template with audit CTA.",
    ],
  },
  {
    week: "Week 3",
    posts: [
      "Teardown: why teams chase unwinnable recompetes and how to filter faster.",
      "Framework: red-team timeline for 30/60/90 proposal execution.",
      "Proof: capture-to-proposal handoff structure that reduces rework.",
      "Offer: proposal timeline template with free audit CTA.",
    ],
  },
  {
    week: "Week 4",
    posts: [
      "Teardown: FAR/DFARS clauses teams discover too late.",
      "Framework: partner-led distribution model for GovCon trust channels.",
      "Proof: webinar recap with key insights and checklist.",
      "Offer: partner scorecard + free RFP audit CTA.",
    ],
  },
];

const PARTNER_TARGETS = [
  "GovCon proposal consultants",
  "Capture management trainers",
  "8(a) and certification advisors",
  "GovCon-focused legal/compliance advisors",
  "GovCon CRM and pipeline tools",
  "PTAC/APEX support organizations",
  "Federal subcontracting communities",
  "Industry newsletters focused on federal bids",
  "GovCon podcast hosts",
  "Regional federal contracting associations",
];

const KPI_DEFINITIONS = [
  { metric: "Qualified sessions/week", definition: "Sessions landing on high-intent resource URLs (e.g. /resources/*)." },
  { metric: "Demo/book rate", definition: "Unique users reaching demo or meeting CTA divided by qualified sessions." },
  { metric: "Channel share", definition: "Qualified sessions split by organic, referral/partner, social, and direct." },
  { metric: "Top landing conversion", definition: "CTA conversion rate for each BOFU page to prioritize improvements." },
];

function copyToClipboard(label, body) {
  navigator.clipboard.writeText(body);
  trackEvent("growth_template_copied", { template: label });
}

export default function GrowthPlaybook({ onBack, onOpenResource }) {
  const [copiedTemplate, setCopiedTemplate] = useState("");
  const topicCount = useMemo(
    () => INTENT_CLUSTERS.reduce((total, cluster) => total + cluster.topics.length, 0),
    [],
  );

  return (
    <main style={s.page}>
      <header style={s.header}>
        <button style={s.backButton} onClick={onBack}>
          <ArrowLeft size={14} />
          Back
        </button>
        <h1 style={s.title}>GovCon Growth Operating Playbook</h1>
        <p style={s.subtitle}>
          90-day execution assets: intent clusters, BOFU resources, founder distribution, partner loop, and KPI operating system.
        </p>
      </header>

      <section style={s.card}>
        <h2 style={s.sectionTitle}>1) Intent Clusters ({INTENT_CLUSTERS.length}) and Topic Map ({topicCount})</h2>
        <div style={s.grid}>
          {INTENT_CLUSTERS.map((cluster) => (
            <article key={cluster.id} style={s.clusterCard}>
              <h3 style={s.clusterTitle}>{cluster.label}</h3>
              <p style={s.clusterAudience}>{cluster.audience}</p>
              <ul style={s.list}>
                {cluster.topics.map((topic) => <li key={topic}>{topic}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section style={s.card}>
        <h2 style={s.sectionTitle}>2) BOFU Content Sprint (8 Pages)</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {BOFU_RESOURCES.map((resource) => (
            <div key={resource.slug} style={s.row}>
              <div>
                <div style={s.rowTitle}>{resource.title}</div>
                <div style={s.rowDescription}>{resource.description}</div>
              </div>
              <button
                style={s.linkButton}
                onClick={() => {
                  trackEvent("growth_resource_opened", { slug: resource.slug });
                  onOpenResource(resource.slug);
                }}
              >
                Open page
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={s.card}>
        <h2 style={s.sectionTitle}>3) Founder Distribution Cadence (4 Weeks)</h2>
        <div style={s.grid}>
          {FOUNDER_CALENDAR.map((week) => (
            <article key={week.week} style={s.clusterCard}>
              <h3 style={s.clusterTitle}>{week.week}</h3>
              <ul style={s.list}>
                {week.posts.map((post) => <li key={post}>{post}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section style={s.card}>
        <h2 style={s.sectionTitle}>4) Partner Pipeline (10 Targets)</h2>
        <ul style={s.list}>
          {PARTNER_TARGETS.map((target) => <li key={target}>{target}</li>)}
        </ul>
        <p style={s.helpText}>
          Weekly rule: 5 partner touches, 2 webinar asks per month, one co-branded asset every sprint.
        </p>
      </section>

      <section style={s.card}>
        <h2 style={s.sectionTitle}>5) Template Assets (2)</h2>
        {TEMPLATE_ASSETS.map((template) => (
          <div key={template.id} style={{ ...s.clusterCard, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <h3 style={s.clusterTitle}>{template.label}</h3>
              <button
                style={s.copyButton}
                onClick={() => {
                  copyToClipboard(template.label, template.body);
                  setCopiedTemplate(template.id);
                  setTimeout(() => setCopiedTemplate(""), 1400);
                }}
              >
                <Copy size={13} />
                {copiedTemplate === template.id ? "Copied" : "Copy"}
              </button>
            </div>
            <pre style={s.templateBody}>{template.body}</pre>
          </div>
        ))}
      </section>

      <section style={s.card}>
        <h2 style={s.sectionTitle}>6) KPI Dashboard Definitions</h2>
        <ul style={s.list}>
          {KPI_DEFINITIONS.map((item) => (
            <li key={item.metric}>
              <strong>{item.metric}:</strong> {item.definition}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: "28px 18px 40px",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: { maxWidth: 1100, margin: "0 auto 18px" },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
    color: "#0f172a",
  },
  title: { fontSize: "2rem", margin: "14px 0 8px" },
  subtitle: { margin: 0, color: "#475569", lineHeight: 1.6 },
  card: {
    maxWidth: 1100,
    margin: "0 auto 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#ffffff",
    padding: 16,
  },
  sectionTitle: { margin: "0 0 12px", fontSize: "1.15rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 },
  clusterCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 12,
    background: "#f8fafc",
  },
  clusterTitle: { margin: "0 0 6px", fontSize: "1rem" },
  clusterAudience: { margin: "0 0 8px", color: "#475569", fontSize: 13 },
  list: { margin: 0, paddingLeft: 18, display: "grid", gap: 6, lineHeight: 1.5 },
  row: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rowTitle: { fontWeight: 700, marginBottom: 4 },
  rowDescription: { color: "#475569", fontSize: 13, lineHeight: 1.5 },
  linkButton: {
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#ffffff",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  helpText: { color: "#475569", marginTop: 10 },
  copyButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #0f172a",
    borderRadius: 8,
    background: "#0f172a",
    color: "#fff",
    padding: "7px 10px",
    fontWeight: 600,
    cursor: "pointer",
  },
  templateBody: {
    margin: "10px 0 0",
    whiteSpace: "pre-wrap",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    lineHeight: 1.5,
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
};
