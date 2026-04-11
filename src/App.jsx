import { lazy, Suspense, useEffect, useState } from "react";
import { useAuth, useUser, SignIn } from "@clerk/clerk-react";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import ConsentBanner from "./components/ConsentBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import { trackEvent, trackPageView } from "./utils/analytics";
import { BOFU_RESOURCES } from "./content/growthPlanData";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const Templates        = lazy(() => import("./pages/Templates"));
const Legal            = lazy(() => import("./pages/Legal"));
const SamRep           = lazy(() => import("./pages/SamRep"));
const Security         = lazy(() => import("./pages/Security"));
const About            = lazy(() => import("./pages/About"));
const CompliancePage   = lazy(() => import("./pages/CompliancePage"));
const GovConDashboardV2 = lazy(() => import("./pages/GovConDashboardV2"));
const GovConGuide      = lazy(() => import("./pages/GovConGuide"));
const Demo             = lazy(() => import("./pages/Demo"));
const PricingGrid      = lazy(() => import("./pages/PricingGrid"));
const GrowthPlaybook   = lazy(() => import("./pages/GrowthPlaybook"));
const TrafficBrief     = lazy(() => import("./pages/TrafficBrief"));
const RfpMatrixGenerator = lazy(() => import("./pages/seo/RfpMatrixGenerator"));
const GrowthResourcePage = lazy(() => import("./pages/seo/GrowthResourcePage"));
const AdminDashboard   = lazy(() => import("./pages/AdminDashboard"));
const BentoDashboard   = lazy(() => import("./pages/BentoDashboard"));
const Contact          = lazy(() => import("./pages/Contact"));

const BASE_URL = "https://www.bidsmith.pro";

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
      color: "#94a3b8",
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
  landing:      { title: "BidSmith | Federal RFP Compliance Audit Software for Government Contractors", description: "BidSmith audits SAM.gov solicitations in 90 seconds. Instant compliance matrix, FAR/DFARS risk flags, and bid/no-bid recommendation. Built for federal prime contractors and capture teams.", path: "/" },
  templates:    { title: "Free Federal Proposal Templates | Compliance Matrix & RFP Worksheets — BidSmith", description: "Download free compliance matrix templates, proposal outlines, and RFP shred worksheets built for government contractors. Ready to use with any FAR/DFARS solicitation.", path: "/templates" },
  about:        { title: "About BidSmith | AI-Powered Federal RFP Audit Software by ARIS Labs", description: "BidSmith is built by ARIS Labs to give government contractors instant compliance intelligence. Zero-knowledge architecture, direct SAM.gov integration, and AI-driven audit output.", path: "/about" },
  soc:          { title: "BidSmith Security | Zero-Knowledge RFP Data Architecture", description: "BidSmith processes solicitation data in transient memory only. No data stored, indexed, or shared. Learn how our zero-knowledge architecture keeps your proposal strategy private.", path: "/soc" },
  "sam-rep":    { title: "Sample Federal RFP Audit Report | BidSmith Compliance Matrix Demo", description: "See a real BidSmith audit output for a Defense Health Agency solicitation — compliance matrix, FAR/DFARS flags, risk score, and bid/no-bid verdict included.", path: "/sam-rep" },
  demo:         { title: "BidSmith Live Demo | Watch a Federal RFP Audit in 90 Seconds", description: "Watch BidSmith audit a real $24.5M Army solicitation live — compliance matrix, FAR/DFARS disqualifier flags, risk score, and bid/no-bid verdict. No signup required.", path: "/demo" },
  "govcon-guide": { title: "Federal Contracting Process Guide | How to Win Government Contracts — BidSmith", description: "The complete government contracting workflow for new and experienced contractors — SAM.gov registration, opportunity discovery, compliance review, and proposal development.", path: "/govcon-guide" },
  privacy:      { title: "Privacy Policy | BidSmith", description: "How BidSmith collects, uses, and protects your data.", path: "/privacy" },
  terms:        { title: "Terms of Service | BidSmith", description: "Terms and conditions governing your use of the BidSmith federal RFP audit platform.", path: "/terms" },
  cookies:      { title: "Cookie Policy | BidSmith", description: "How BidSmith uses cookies and local storage.", path: "/cookies" },
  app:          { title: "BidSmith Command Center | Federal RFP Compliance Analysis", description: "Your BidSmith Command Center. Paste a SAM.gov URL or upload a PDF to begin.", path: "/dashboard" },
  dashboard:    { title: "BidSmith Command Center | Federal RFP Compliance Analysis", description: "Your BidSmith Command Center. Paste a SAM.gov URL or upload a PDF — bid/no-bid verdict in 90 seconds.", path: "/dashboard" },
  pricing:      { title: "BidSmith Pricing | Federal RFP Audit Plans — Free to $999/mo", description: "Start free with 3 audits per month. Upgrade for unlimited audits, full FAR/DFARS analysis, and deep-shred strategy. No hidden fees.", path: "/pricing" },
  resources:    { title: "GovCon Growth Playbook | BidSmith", description: "Execution playbook for GovCon traffic growth: intent clusters, BOFU resources, founder distribution, partner outreach, and KPI tracking.", path: "/resources" },
  "traffic-brief": { title: "Morning Traffic Brief | BidSmith", description: "Daily traffic pulse with yesterday metrics, qualified sessions, and seven-day trend.", path: "/traffic-brief" },
  "rfp-generator": { title: "Free RFP Compliance Matrix Generator | 90-Second FAR/DFARS Analysis — BidSmith", description: "Turn any government RFP into a structured compliance matrix in 90 seconds. Identify missing requirements and disqualification risks before you commit proposal resources.", path: "/rfp-compliance-matrix-generator" },
  admin:        { title: "Admin Portal | BidSmith", description: "Internal analytics portal.", path: "/admin" },
  bento:        { title: "Intelligence Dashboard | BidSmith", description: "RFP upload, live AI analysis with confidence scores, and inference regression eval status.", path: "/bento" },
  contact:      { title: "Contact BidSmith | Talk to a Federal Capture Specialist", description: "Get in touch with the BidSmith team. Request a demo, ask about pricing, or connect with a federal capture specialist for your next solicitation.", path: "/contact" },
};

function usePageMeta(view) {
  useEffect(() => {
    const isCompliance = view === "compliance";
    const isResource = view === "resource";
    const resourceSlug = isResource
      ? window.location.pathname.replace("/resources/", "")
      : "";
    const resource = isResource
      ? BOFU_RESOURCES.find((item) => item.slug === resourceSlug)
      : null;
    const meta = resource
      ? {
        title: `${resource.title} | BidSmith`,
        description: resource.description,
        path: `/resources/${resource.slug}`,
      }
      : PAGE_META[view] || PAGE_META.landing;

    document.title = meta.title;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.description);
    const ot = document.querySelector('meta[property="og:title"]');
    if (ot) ot.setAttribute("content", meta.title);
    const od = document.querySelector('meta[property="og:description"]');
    if (od) od.setAttribute("content", meta.description);

    const canonicalPath = (isCompliance || isResource) ? window.location.pathname : meta.path || "/";
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

    const NOINDEX_VIEWS = new Set(["app", "dashboard", "admin", "bento"]);
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

  const [view, setView] = useState(() => resolveView(path));
  const [initialUrl, setInitialUrl] = useState("");
  const [initialFile, setInitialFile] = useState(null);

  usePageMeta(view);

  useEffect(() => {
    if (!aliasSection || view !== "landing") return;
    window.history.replaceState({ view: "landing" }, "", `/#${aliasSection}`);
    const timer = setTimeout(() => {
      document.getElementById(aliasSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, [aliasSection, view]);

  useEffect(() => {
    const pathMap = {
      app: "/dashboard", dashboard: "/dashboard",
      templates: "/templates", pricing: "/pricing",
      resources: "/resources", "traffic-brief": "/traffic-brief",
      admin: "/admin", bento: "/dashboard", contact: "/contact", "sam-rep": "/sam-rep",
      soc: "/soc", about: "/about", demo: "/demo",
      "govcon-guide": "/govcon-guide", "rfp-generator": "/rfp-compliance-matrix-generator",
      "404": "/404",
    };
    const logicalPath =
      view === "privacy" || view === "terms" || view === "cookies" ? `/${view}` :
      view === "compliance" ? window.location.pathname :
      view === "resource" ? window.location.pathname :
      view === "landing" ? (aliasSection ? `/#${aliasSection}` : "/") :
      pathMap[view] || "/";
    trackPageView(logicalPath);
  }, [view, authenticated, aliasSection]);

  useEffect(() => {
    if (window.history.state === null || window.history.state?.view === undefined) {
      window.history.pushState({ view: "landing" }, "", window.location.href);
    }
  }, []);

  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState({ view }, "", currentUrl);

    const handlePopState = () => {
      setView("landing");
      window.history.pushState({ view: "landing" }, "", "/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [view]);

  const handleAnalyze = (url) => {
    trackEvent("landing_quick_audit_started", { entry: "url_bar" });
    setInitialFile(null);
    setInitialUrl(url);
    setView("dashboard");
  };

  const handleAnalyzeFile = (file) => {
    trackEvent("landing_quick_audit_started", { entry: "pdf_upload" });
    setInitialUrl("");
    setInitialFile(file);
    setView("dashboard");
  };

  const handleEnterApp = (entry = "generic") => {
    trackEvent("landing_cta_clicked", { entry, authenticated: Boolean(authenticated && user) });
    setView("dashboard");
  };

  const authWall = (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1623 0%, #111827 50%, #0c1220 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <SignIn
        routing="hash"
        appearance={{
          variables: {
            colorBackground:       "#ffffff",
            colorText:             "#111827",
            colorTextSecondary:    "#6b7280",
            colorPrimary:          "#1d4ed8",
            colorDanger:           "#dc2626",
            colorInputBackground:  "#f9fafb",
            colorInputText:        "#111827",
            borderRadius:          "10px",
            fontFamily:            '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize:              "14px",
          },
          elements: {
            card:                  "shadow-xl",
            socialButtonsBlockButton:
              "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-medium",
            socialButtonsBlockButtonText: "text-gray-800 font-medium",
            formButtonPrimary:
              "bg-blue-700 hover:bg-blue-800 text-white font-semibold",
            footerActionLink:      "text-blue-600 hover:text-blue-700",
          },
        }}
      />
    </div>
  );

  const loadingScreen = <LoadingSpinner />;

  if (authLoading) {
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
      content = <SamRep onBack={() => setView("landing")} />;
      break;
    case "soc":
      content = <Security onBack={() => setView("landing")} />;
      break;
    case "about":
      content = <About onBack={() => setView("landing")} />;
      break;
    case "compliance": {
      const slug = window.location.pathname.replace("/compliance/", "");
      content = <CompliancePage slug={slug} onBack={() => setView("dashboard")} />;
      break;
    }
    case "demo":
      content = <Demo onBack={() => setView("landing")} onEnterApp={() => setView("dashboard")} />;
      break;
    case "govcon-guide":
      content = <GovConGuide onBack={() => setView("landing")} onEnterApp={() => setView("dashboard")} />;
      break;
    case "pricing":
      content = (
        <PricingGrid
          onTryFree={() => setView("dashboard")}
          userId={user?.id}
          user={user}
        />
      );
      break;
    case "traffic-brief":
      content = <TrafficBrief onBack={() => setView("landing")} />;
      break;
    case "resources":
      content = (
        <GrowthPlaybook
          onBack={() => setView("landing")}
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
          onEnterApp={() => setView("dashboard")}
        />
      );
      break;
    }
    case "rfp-generator":
      content = <RfpMatrixGenerator onUpload={() => setView("dashboard")} />;
      break;
    case "admin":
      content = authLoading ? loadingScreen : authenticated ? <AdminDashboard onBack={() => setView("landing")} /> : authWall;
      break;
    case "contact":
      content = <Contact onBack={() => setView("landing")} />;
      break;
    // /app, /bento, /chat all resolve here — single Command Center
    case "bento":
    case "app":
    case "dashboard":
      content = authLoading ? loadingScreen : authenticated && user
        ? <BentoDashboard onBack={() => setView("landing")} user={user} />
        : authWall;
      break;
    case "landing":
      content = (
        <Landing
          onEnterApp={handleEnterApp}
          onEnterDashboard={() => setView("dashboard")}
          onViewSample={() => setView("demo")}
          onAnalyze={handleAnalyze}
          onAnalyzeFile={handleAnalyzeFile}
          onGoHome={() => setView("landing")}
          isAuthenticated={Boolean(authenticated && user)}
          userEmail={user?.email || ""}
        />
      );
      break;
    default:
      content = <NotFound onBack={() => setView("landing")} />;
  }

  return (
    <ErrorBoundary reloadOnRetry={true} fallbackMode="wanderer">
      <Suspense fallback={loadingScreen}>
        {content}
      </Suspense>
      <ConsentBanner />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
}
