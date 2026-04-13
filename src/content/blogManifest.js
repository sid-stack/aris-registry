/** Indexed blog posts — served at /blog/:slug (markdown from /public/content/). */
export const BLOG_POSTS = [
  {
    slug: "bid-no-bid-decision-framework",
    file: "blog-bid-no-bid.md",
    title: "The Bid/No-Bid Decision Framework Every Government Contractor Needs",
    description:
      "Stop staffing unwinnable pursuits. A practical framework for federal go/no-go decisions before proposal hours disappear.",
  },
  {
    slug: "rfp-process-win-rate-signs",
    file: "blog-proposal-signs.md",
    title: "5 Signs Your RFP Process Is Killing Your Win Rate",
    description:
      "Process gaps that separate average GovCon win rates from top performers — and what to change first.",
  },
  {
    slug: "how-to-find-government-rfps-early",
    file: "blog-find-rfps.md",
    title: "How to Find Government RFPs Before Your Competitors Do",
    description:
      "Move upstream of SAM.gov: budget signals, FPDS, forecasts, and pipeline habits that surface work earlier.",
  },
  {
    slug: "compliance-matrix-government-rfps",
    file: "blog-compliance-matrix.md",
    title: "The Complete Guide to Building a Compliance Matrix for Government RFPs",
    description:
      "Turn Sections C, L, M, H, and I into a matrix that drives a compliant, scorable federal proposal.",
  },
];

export function getBlogPost(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug) || null;
}
