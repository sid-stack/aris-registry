import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { ensureAdsbygoogleScript, isBidSmithProductionSurfaceHost } from "./utils/adsbygoogleLoader.js";
import { useAuth, useUser, SignIn } from "@clerk/clerk-react";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import ConsentBanner from "./components/ConsentBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import { track, trackEvent, trackPageView, setFunnelUser, identify } from "./utils/analytics";
import { BOFU_RESOURCES } from "./content/growthPlanData";
import { getBlogPost } from "./content/blogManifest";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { pathForView, WORKSPACE_PATH } from "./lib/routes";
import { isAppOwner } from "./lib/appOwner.js";
import { getComplianceRouteMeta } from "./seo/complianceRouteMeta";
import DesktopOnlyGate from "./components/DesktopOnlyGate.jsx";

const Templates        = lazy(() => import("./pages/Templates"));
const Legal            = lazy(() => import("./pages/Legal"));
const SamRep           = lazy(() => import("./pages/SamRep"));
const Security         = lazy(() => import("./pages/Security"));
const About            = lazy(() => import("./pages/About"));
const CompliancePage   = lazy(() => import("./pages/CompliancePage"));
const GovConGuide      = lazy(() => import("./pages/GovConGuide"));
const Demo             = lazy(() => import("./pages/Demo"));
const PricingGrid      = lazy(() => import("./pages/PricingGrid"));
const GrowthPlaybook   = lazy(() => import("./pages/GrowthPlaybook"));
const TrafficBrief     = lazy(() => import("./pages/TrafficBrief"));
const RfpMatrixGenerator = lazy(() => import("./pages/seo/RfpMatrixGenerator"));
const GrowthResourcePage = lazy(() => import("./pages/seo/GrowthResourcePage"));
const BlogArticle = lazy(() => import("./pages/seo/BlogArticle"));
const BlogHub = lazy(() => import("./pages/seo/BlogHub"));
const NewsletterPage = lazy(() => import("./pages/NewsletterPage"));
const AdminDashboard   = lazy(() => import("./pages/AdminDashboard"));
const BentoDashboard   = lazy(() => import("./pages/BentoDashboard"));
const E2eBentoAuditCtaHarness = lazy(() => import("./e2e/E2eBentoAuditCtaHarness.jsx"));
const Contact          = lazy(() => import("./pages/Contact"));

const BASE_URL = "https://www.bidsmith.pro";
const OG_IMAGE_URL = `${BASE_URL}/og-image.png`;

/** Logged-out /dashboard (and traffic-brief) — context before Clerk so cold-email clicks convert. */
function DashboardSignInShell({ onBackHome }) {
  const signupStartOnce = useRef(false);
  const onSignInInteract = () => {
    if (signupStartOnce.current) return;
    signupStartOnce.current = true;
    track("signup_start", { method: "unknown" });
  };

  useEffect(() => {
    track("signin_view", {});
  }, []);

  const backBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 22,
    padding: "8px 0",
    fontSize: 14,
    fontWeight: 600,
    color: "#cbd5e1",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #0c1220 0%, #111827 42%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: "28px 18px 48px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <button type="button" style={backBtn} onClick={onBackHome}>
          ← Back to BidSmith
        </button>
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#e2e8f0",
          }}
        >
          BidSmith · Command Center
        </p>
        <h1
          style={{
            margin: "0 0 14px",
            fontSize: "clamp(1.35rem, 4vw, 1.6rem)",
            fontWeight: 800,
            lineHeight: 1.3,
            color: "#f8fafc",
          }}
        >
          Turn any SAM.gov solicitation into a compliance matrix, FAR/DFARS risk read, and bid/no-bid call — in about 90 seconds.
        </h1>
        <p style={{ margin: "0 0 18px", fontSize: 15, lineHeight: 1.65, color: "#cbd5e1" }}>
          Sign in (or create a free account) to open the workspace. Then paste a notice URL or upload a PDF — no manual shred.
        </p>
        <ul
          style={{
            margin: "0 0 22px",
            paddingLeft: 20,
            color: "#e2e8f0",
            fontSize: 14,
            lineHeight: 1.65,
          }}
        >
          <li>Structured compliance matrix from Section L/M-style requirements</li>
          <li>Disqualifier and set-aside fit signals you can share with capture</li>
          <li>Bid / no-bid recommendation with plain-English rationale</li>
        </ul>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#cbd5e1", lineHeight: 1.55 }}>
          Free plan: <strong style={{ color: "#e2e8f0" }}>3 full audits per calendar month</strong> · No credit card required. Upgrade anytime for unlimited runs.
        </p>
        <div
          style={{
            borderRadius: 12,
            border: "1px solid rgba(148, 163, 184, 0.25)",
            background: "rgba(15, 23, 42, 0.55)",
            padding: "18px 16px 20px",
          }}
          onPointerDownCapture={onSignInInteract}
        >
          <SignIn routing="hash" />
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0f14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "12px",
      color: "#cbd5e1",
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: "14px",
      letterSpacing: "0.01em",
    }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          border: "3px solid rgba(148, 163, 184, 0.22)",
          borderTopColor: "#60a5fa",
          animation: "bidsmith-spin 0.9s linear infinite",
        }}
      />
      <span>Loading your workspace...</span>
      <style>{`
        @keyframes bidsmith-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const PAGE_META = {
  landing:      { title: "BidSmith | SAM.gov RFP audit & bid/no-bid decision support for small GovCon", description: "AI-assisted first pass on federal solicitations: structured requirements, risk flags, and a bid/no-bid recommendation with rationale—built for small and growing GovCon teams. Free audit with fair limits; upgrade for volume.", path: "/" },
  templates:    { title: "BidSmith | Free federal proposal templates & RFP worksheets", description: "Download free compliance matrix templates, proposal outlines, and RFP shred worksheets built for government contractors. Ready to use with any FAR/DFARS solicitation.", path: "/templates" },
  about:        { title: "BidSmith | About ARIS Labs & federal RFP audit software", description: "BidSmith is built by ARIS Labs to give government contractors instant compliance intelligence. Zero-knowledge architecture, direct SAM.gov integration, and AI-driven audit output.", path: "/about" },
  soc:          { title: "BidSmith Security | Zero-knowledge RFP data architecture", description: "BidSmith processes solicitation data in transient memory only. No data stored, indexed, or shared. Learn how our zero-knowledge architecture keeps your proposal strategy private.", path: "/soc" },
  "sam-rep":    { title: "BidSmith | Sample federal RFP audit report & matrix demo", description: "See a real BidSmith audit output for a Defense Health Agency solicitation — compliance matrix, FAR/DFARS flags, risk score, and bid/no-bid verdict included.", path: "/sam-rep" },
  demo:         { title: "BidSmith Demo | Federal RFP audit in about 90 seconds", description: "Watch BidSmith audit a real $24.5M Army solicitation live — compliance matrix, FAR/DFARS disqualifier flags, risk score, and bid/no-bid verdict. No signup required.", path: "/demo" },
  "govcon-guide": { title: "BidSmith | Federal contracting guide—win government bids", description: "The complete government contracting workflow for new and experienced contractors — SAM.gov registration, opportunity discovery, compliance review, and proposal development.", path: "/govcon-guide" },
  privacy:      { title: "Privacy Policy | BidSmith", description: "How BidSmith collects, uses, and protects your data when you run RFP audits and manage government contract workflows. Plain-language policy for GovCon teams.", path: "/privacy" },
  terms:        { title: "Terms of Service | BidSmith", description: "Terms and conditions governing your use of the BidSmith federal RFP audit platform, government contract bid tools, and related services.", path: "/terms" },
  cookies:      { title: "Cookie Policy | BidSmith", description: "How BidSmith uses cookies and local storage for RFP audit sessions, preferences, and analytics. Manage consent anytime.", path: "/cookies" },
  app:          { title: "BidSmith Command Center | RFP & government bid workspace", description: "Your BidSmith Command Center. Paste a SAM.gov URL or upload a PDF to begin.", path: "/dashboard" },
  dashboard:    { title: "BidSmith Command Center | RFP & government bid workspace", description: "Your BidSmith Command Center. Paste a SAM.gov URL or upload a PDF — structured read, risk flags, and bid/no-bid guidance with rationale in minutes.", path: "/dashboard" },
  pricing:      { title: "BidSmith Pricing | GovCon RFP audit plans—free to enterprise", description: "Start with a free audit (fair-use limits: guest by IP, 3/mo when signed in). Upgrade for more volume, full FAR/DFARS-oriented analysis, and exports. No hidden fees.", path: "/pricing" },
  resources:    { title: "GovCon Growth Playbook | BidSmith", description: "Execution playbook for GovCon traffic growth: intent clusters, BOFU resources, founder distribution, partner outreach, and KPI tracking.", path: "/resources" },
  "traffic-brief": { title: "Morning Traffic Brief | BidSmith", description: "Daily traffic pulse with yesterday metrics, qualified sessions, and seven-day trend.", path: "/traffic-brief" },
  "rfp-generator": { title: "BidSmith | Free RFP compliance matrix generator (90s)", description: "Turn any government RFP into a structured compliance matrix in 90 seconds. Identify missing requirements and disqualification risks before you commit proposal resources.", path: "/rfp-compliance-matrix-generator" },
  admin:        { title: "Admin Portal | BidSmith", description: "Internal analytics portal.", path: "/admin" },
  bento:        { title: "Intelligence Dashboard | BidSmith", description: "RFP upload, live AI analysis with confidence scores, and inference regression eval status.", path: "/bento" },
  contact:      { title: "Contact BidSmith | Federal capture & RFP audit questions", description: "Get in touch with the BidSmith team. Request a demo, ask about pricing, or connect with a federal capture specialist for your next solicitation.", path: "/contact" },
  "blog-hub":   { title: "BidSmith Blog | GovCon RFP & compliance insights", description: "Guides on bid/no-bid discipline, federal RFP compliance matrices, and finding government contracts early. Written for capture, BD, and proposal teams.", path: "/blog" },
  newsletter:   { title: "The Bid Brief | GovCon newsletter by BidSmith", description: "Twice-weekly federal RFP intel: pipeline lens, compliance notes, and workflow tips for small GovCon teams. Subscribe via our hosted provider — no spam.", path: "/newsletter" },
};

function usePageMeta(view) {
  useEffect(() => {
    const isCompliance = view === "compliance";
    const isResource = view === "resource";
    const isBlog = view === "blog";
    const resourceSlug = isResource
      ? window.location.pathname.replace("/resources/", "")
      : "";
    const resource = isResource
      ? BOFU_RESOURCES.find((item) => item.slug === resourceSlug)
      : null;
    const blogSlug = isBlog ? window.location.pathname.replace("/blog/", "").replace(/\/$/, "") : "";
    const blogPost = isBlog ? getBlogPost(blogSlug) : null;
    const complianceSlug = isCompliance
      ? window.location.pathname.replace("/compliance/", "").replace(/\/$/, "")
      : "";
    const complianceMeta = isCompliance ? getComplianceRouteMeta(complianceSlug) : null;
    const meta = resource
      ? {
        title: `${resource.title} | BidSmith`,
        description: resource.description,
        path: `/resources/${resource.slug}`,
      }
      : blogPost
        ? {
          title: `${blogPost.title} | BidSmith`,
          description: blogPost.description,
          path: `/blog/${blogPost.slug}`,
        }
        : complianceMeta
          ? { title: complianceMeta.title, description: complianceMeta.description, path: complianceMeta.path }
          : PAGE_META[view] || PAGE_META.landing;

    document.title = meta.title;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.description);
    const ot = document.querySelector('meta[property="og:title"]');
    if (ot) ot.setAttribute("content", meta.title);
    const od = document.querySelector('meta[property="og:description"]');
    if (od) od.setAttribute("content", meta.description);
    const oi = document.querySelector('meta[property="og:image"]');
    if (oi) oi.setAttribute("content", OG_IMAGE_URL);

    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", meta.title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", meta.description);
    const twImg = document.querySelector('meta[name="twitter:image"]');
    if (twImg) twImg.setAttribute("content", OG_IMAGE_URL);

    const canonicalPath = (isCompliance || isResource || (isBlog && blogPost))
      ? window.location.pathname
      : meta.path || "/";
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

    const NOINDEX_VIEWS = new Set(["app", "dashboard", "admin", "bento", "traffic-brief", "404", "e2e-bento-audit-cta"]);
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", NOINDEX_VIEWS.has(view) ? "noindex,nofollow" : "index,follow");
  }, [view]);
}

const LANDING_SECTION_ALIASES = {
  "/solutions": "solutions",
  "/workflow":  "workflow",
  "/markets":   "markets",
};

function resolveView(path) {
  // All workspace entry points converge on /dashboard
  if (path === "/dashboard" || path === "/app/dashboard" || path === "/dashboard-v2") return "dashboard";
  if (path.startsWith("/app") || window.location.search.includes("app=true")) return "dashboard";
  if (path === "/bento" || path === "/bento-dashboard") return "dashboard";
  if (path === "/chat" || path === "/aris") return "dashboard";
  if (path === "/templates") return "templates";
  if (path === "/pricing") return "pricing";
  if (path === "/resources") return "resources";
  if (path.startsWith("/resources/")) return "resource";
  if (path === "/blog" || path === "/blog/") return "blog-hub";
  if (path.startsWith("/blog/")) return "blog";
  if (path === "/newsletter" || path === "/newsletter/") return "newsletter";
  if (path === "/audit" || path === "/audit/") return "dashboard";
  if (import.meta.env.DEV && path === "/__e2e/bento-audit-cta") return "e2e-bento-audit-cta";
  if (path === "/traffic-brief") return "traffic-brief";
  if (path === "/rfp-compliance-matrix-generator") return "rfp-generator";
  if (path === "/admin") return "admin";
  if (path === "/contact") return "contact";
  if (path === "/privacy" || path === "/terms" || path === "/cookies") return path.slice(1);
  if (path === "/sam-rep") return "sam-rep";
  if (path === "/soc") return "soc";
  if (path === "/about") return "about";
  if (path === "/demo") return "demo";
  if (path === "/govcon-guide" || path === "/how-it-works") return "govcon-guide";
  if (path.startsWith("/compliance/")) return "compliance";
  if (LANDING_SECTION_ALIASES[path]) return "landing";
  if (path === "/" || path === "") return "landing";
  return "404";
}

export default function App() {
  const path = window.location.pathname;
  const aliasSection = LANDING_SECTION_ALIASES[path] || null;

  useEffect(() => {
    const client = import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-1777022448474054";
    ensureAdsbygoogleScript(client);
  }, []);

  const { isSignedIn, isLoaded: isAuthLoaded, userId } = useAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();

  // Guard: if Clerk 400s (production key on localhost) isAuthLoaded stays
  // false forever. Time out after 6 s so the app renders instead of hanging.
  const [authTimedOut, setAuthTimedOut] = useState(false);
  useEffect(() => {
    if (isAuthLoaded) return;
    const t = setTimeout(() => setAuthTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [isAuthLoaded]);

  // Still loading only if Clerk hasn't responded yet AND we haven't timed out.
  // Once timed out (Clerk 400s / localhost mismatch), treat as unauthenticated.
  const authLoading = (!isAuthLoaded && !authTimedOut)
    || (isAuthLoaded && isSignedIn && !isUserLoaded);
  const authenticated = isSignedIn && !authLoading;
  const user = authenticated && clerkUser ? {
    id: userId,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    isSubscribed: clerkUser.publicMetadata?.isSubscribed === true,
    plan: clerkUser.publicMetadata?.plan || null,
    subscriptionUpdatedAt: clerkUser.publicMetadata?.subscriptionUpdatedAt || null,
  } : null;

  useEffect(() => {
    const plan = user?.isSubscribed ? (user.plan || "pro") : "free";
    setFunnelUser({ userId: user?.id || null, plan });
    if (user?.id && clerkUser) {
      identify(user.id, { email: user.email || "", plan: user.plan || plan });
    }
  }, [user, clerkUser]);

  useEffect(() => {
    if (!authenticated || !user?.id || !clerkUser) return;
    const created = clerkUser.createdAt ? new Date(clerkUser.createdAt).getTime() : 0;
    const fresh = created && Date.now() - created < 5 * 60 * 1000;
    const key = `bs_signup_complete_${user.id}`;
    if (fresh && !sessionStorage.getItem(key)) {
      const method = clerkUser.externalAccounts?.length ? "oauth" : "email";
      track("signup_complete", { method });
      sessionStorage.setItem(key, "1");
    }
  }, [authenticated, user?.id, clerkUser]);

  const [view, setView] = useState(() => resolveView(path));

  usePageMeta(view);

  useEffect(() => {
    if (!aliasSection || view !== "landing") return;
    const timer = setTimeout(() => {
      document.getElementById(aliasSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, [aliasSection, view]);

  useEffect(() => {
    if (view === "dashboard") {
      track("app_open", {
        auth_state: authenticated && user ? "signed_in" : "signed_out",
      });
    }
  }, [view, authenticated, user]);

  useEffect(() => {
    const pathMap = {
      app: "/dashboard", dashboard: "/dashboard",
      templates: "/templates", pricing: "/pricing",
      resources: "/resources", "traffic-brief": "/traffic-brief",
      admin: "/admin", bento: "/dashboard", contact: "/contact", "sam-rep": "/sam-rep",
      soc: "/soc", about: "/about", demo: "/demo",
      "govcon-guide": "/govcon-guide", "rfp-generator": "/rfp-compliance-matrix-generator",
      "blog-hub": "/blog",
      newsletter: "/newsletter",
      "404": "/404",
    };
    const logicalPath =
      view === "privacy" || view === "terms" || view === "cookies" ? `/${view}` :
      view === "compliance" ? window.location.pathname :
      view === "resource" ? window.location.pathname :
      view === "blog" ? window.location.pathname :
      view === "blog-hub" ? "/blog" :
      view === "newsletter" ? "/newsletter" :
      view === "landing" ? (aliasSection ? `/#${aliasSection}` : "/") :
      pathMap[view] || "/";
    trackPageView(logicalPath);
  }, [view, authenticated, aliasSection]);

  useEffect(() => {
    if (window.history.state === null || window.history.state?.view === undefined) {
      const initialView = resolveView(window.location.pathname);
      window.history.replaceState({ view: initialView }, "", window.location.href);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setView(resolveView(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const base = pathForView(view);
    if (base === null) return;

    const search = window.location.search || "";
    const hash =
      view === "landing" && aliasSection ? `#${aliasSection}` :
      view === "landing" ? "" :
      window.location.hash || "";

    const next = `${base}${search}${hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (current !== next) {
      window.history.replaceState({ view }, "", next);
    }
  }, [view, aliasSection]);

  const goWorkspace = () => {
    window.history.pushState({ view: "dashboard" }, "", `${WORKSPACE_PATH}${window.location.search || ""}`);
    setView("dashboard");
  };

  const goLanding = () => {
    window.history.pushState({ view: "landing" }, "", `/${window.location.search || ""}`);
    setView("landing");
  };

  const handleAnalyze = (url) => {
    trackEvent("landing_quick_audit_started", { entry: "url_bar", url: url?.slice?.(0, 120) });
    goWorkspace();
  };

  const handleAnalyzeFile = (_file) => {
    trackEvent("landing_quick_audit_started", { entry: "pdf_upload" });
    goWorkspace();
  };

  const handleEnterApp = (entry = "generic") => {
    trackEvent("landing_cta_clicked", { entry, authenticated: Boolean(authenticated && user) });
    const pos = String(entry).startsWith("nav") ? "nav" : String(entry).includes("footer") ? "footer" : "hero";
    track("hero_cta_click", { cta_label: String(entry), position: pos });
    goWorkspace();
  };

  const loadingScreen = <LoadingSpinner />;

  // Admin ops console: ADMIN_PASSWORD only (see AdminDashboard). No Clerk gate or wait.
  if (authLoading && view !== "admin" && view !== "e2e-bento-audit-cta") {
    return loadingScreen;
  }

  let content;
  switch (view) {
    case "templates":
      content = <Templates />;
      break;
    case "privacy":
    case "terms":
    case "cookies":
      content = <Legal type={view} />;
      break;
    case "sam-rep":
      content = <SamRep onBack={goLanding} />;
      break;
    case "soc":
      content = <Security onBack={goLanding} />;
      break;
    case "about":
      content = <About onBack={goLanding} />;
      break;
    case "compliance": {
      const slug = window.location.pathname.replace("/compliance/", "");
      content = <CompliancePage slug={slug} onBack={goWorkspace} />;
      break;
    }
    case "demo":
      content = <Demo onBack={goLanding} onEnterApp={goWorkspace} />;
      break;
    case "govcon-guide":
      content = <GovConGuide onBack={goLanding} onEnterApp={goWorkspace} />;
      break;
    case "pricing":
      content = (
        <PricingGrid
          onTryFree={goWorkspace}
          userId={user?.id}
          user={user}
        />
      );
      break;
    case "traffic-brief":
      content = authLoading ? loadingScreen : (
        user && isAppOwner(user) ? (
          <DesktopOnlyGate onBackHome={goLanding}>
            <TrafficBrief onBack={goLanding} />
          </DesktopOnlyGate>
        ) : (
          <NotFound onBack={goLanding} />
        )
      );
      break;
    case "resources":
      content = (
        <GrowthPlaybook
          onBack={goLanding}
          onOpenResource={(slug) => {
            window.history.pushState({ view: "resource" }, "", `/resources/${slug}`);
            setView("resource");
          }}
        />
      );
      break;
    case "resource": {
      const slug = window.location.pathname.replace("/resources/", "");
      content = (
        <GrowthResourcePage
          slug={slug}
          onBack={() => {
            window.history.pushState({ view: "resources" }, "", "/resources");
            setView("resources");
          }}
          onEnterApp={goWorkspace}
        />
      );
      break;
    }
    case "rfp-generator":
      content = <RfpMatrixGenerator onUpload={goWorkspace} />;
      break;
    case "blog-hub":
      content = <BlogHub onBack={goLanding} onEnterApp={handleEnterApp} />;
      break;
    case "newsletter":
      content = <NewsletterPage onBack={goLanding} />;
      break;
    case "blog": {
      const slug = window.location.pathname.replace("/blog/", "").replace(/\/$/, "");
      content = (
        <BlogArticle slug={slug} onBack={goLanding} onEnterApp={handleEnterApp} />
      );
      break;
    }
    case "admin":
      content = <AdminDashboard onBack={goLanding} />;
      break;
    case "contact":
      content = <Contact onBack={goLanding} />;
      break;
    case "e2e-bento-audit-cta":
      content = import.meta.env.DEV
        ? <E2eBentoAuditCtaHarness />
        : <NotFound onBack={goLanding} />;
      break;
    // /app, /bento, /chat all resolve here — single Command Center
    case "bento":
    case "app":
    case "dashboard":
      content = authLoading ? loadingScreen : (
        <DesktopOnlyGate onBackHome={goLanding}>
          {authenticated && user
            ? <BentoDashboard onBack={goLanding} user={user} />
            : <DashboardSignInShell onBackHome={goLanding} />}
        </DesktopOnlyGate>
      );
      break;
    case "landing":
      content = (
        <Landing
          onEnterApp={handleEnterApp}
          onEnterDashboard={goWorkspace}
          onViewSample={() => setView("demo")}
          onAnalyze={handleAnalyze}
          onAnalyzeFile={handleAnalyzeFile}
          onGoHome={goLanding}
          isAuthenticated={Boolean(authenticated && user)}
          userEmail={user?.email || ""}
          isAppOwner={Boolean(user && isAppOwner(user))}
        />
      );
      break;
    default:
      content = <NotFound onBack={goLanding} />;
  }

  return (
    <ErrorBoundary reloadOnRetry={true} fallbackMode="wanderer">
      <Suspense fallback={loadingScreen}>
        {content}
      </Suspense>
      <ConsentBanner />
      {isBidSmithProductionSurfaceHost() ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
    </ErrorBoundary>
  );
}
