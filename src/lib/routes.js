/**
 * Single source of truth for in-app paths.
 * Workspace (Command Center) is always `/dashboard`. Legacy `/app` still resolves in App.jsx.
 */
export const WORKSPACE_PATH = "/dashboard";

/** Map logical view name → pathname. `null` = URL owned by nested navigation (resource slug, compliance slug). */
export function pathForView(view) {
  const map = {
    landing: "/",
    dashboard: WORKSPACE_PATH,
    app: WORKSPACE_PATH,
    bento: WORKSPACE_PATH,
    templates: "/templates",
    pricing: "/pricing",
    resources: "/resources",
    "traffic-brief": "/traffic-brief",
    admin: "/admin",
    contact: "/contact",
    "sam-rep": "/sam-rep",
    soc: "/soc",
    about: "/about",
    demo: "/demo",
    "govcon-guide": "/govcon-guide",
    "rfp-generator": "/rfp-compliance-matrix-generator",
    "404": "/404",
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
    "e2e-bento-audit-cta": "/__e2e/bento-audit-cta",
  };
  return Object.prototype.hasOwnProperty.call(map, view) ? map[view] : null;
}
