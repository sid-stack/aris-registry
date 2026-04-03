import { lazy, Suspense, useEffect, useState } from "react";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import ConsentBanner from "./components/ConsentBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import { trackPageView } from "./utils/analytics";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { supabase } from "./lib/supabase";

const Upload = lazy(() => import("./pages/Upload"));
const Proposal = lazy(() => import("./pages/Proposal"));
const Login = lazy(() => import("./pages/Login"));
const Audit = lazy(() => import("./pages/Audit"));
const Templates = lazy(() => import("./pages/Templates"));
const Legal = lazy(() => import("./pages/Legal"));
const SamRep = lazy(() => import("./pages/SamRep"));
const Discovery = lazy(() => import("./pages/Discovery"));
const Security = lazy(() => import("./pages/Security"));
const About = lazy(() => import("./pages/About"));
const SamScraper = lazy(() => import("./pages/SamScraper"));
const Labs = lazy(() => import("./pages/Labs"));
const BidSmithBeta = lazy(() => import("./pages/BidSmithBeta"));
const BidSmithSearch = lazy(() => import("./pages/BidSmithSearch"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const SurveyAnalytics = lazy(() => import("./components/SurveyAnalytics"));
const DemoAnalytics = lazy(() => import("./components/DemoAnalytics"));
// GovConDashboard V1 retired — /dashboard now resolves to V2 (the real product)
const GovConDashboardV2 = lazy(() => import("./pages/GovConDashboardV2"));
const GovConGuide = lazy(() => import("./pages/GovConGuide"));
const Demo = lazy(() => import("./pages/Demo"));
const PricingGrid = lazy(() => import("./pages/PricingGrid"));
const RfpMatrixGenerator = lazy(() => import("./pages/seo/RfpMatrixGenerator"));
const Outreach = lazy(() => import("./pages/Outreach"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const ArisConsulting = lazy(() => import("./pages/ArisConsulting"));
const Earn = lazy(() => import("./pages/Earn"));
const Newsletter = lazy(() => import("./pages/Newsletter"));

const BASE_URL = "https://www.bidsmith.pro";

const PAGE_META = {
  landing: { title: "BidSmith | Federal RFP Compliance Audit Software for Government Contractors", description: "BidSmith audits SAM.gov solicitations in 90 seconds. Instant compliance matrix, FAR/DFARS risk flags, and bid/no-bid recommendation. Built for federal prime contractors and capture teams.", path: "/" },
  templates: { title: "Free Federal Proposal Templates | Compliance Matrix & RFP Worksheets — BidSmith", description: "Download free compliance matrix templates, proposal outlines, and RFP shred worksheets built for government contractors. Ready to use with any FAR/DFARS solicitation.", path: "/templates" },
  about: { title: "About BidSmith | AI-Powered Federal RFP Audit Software by ARIS Labs", description: "BidSmith is built by ARIS Labs to give government contractors instant compliance intelligence. Zero-knowledge architecture, direct SAM.gov integration, and AI-driven audit output.", path: "/about" },
  soc: { title: "BidSmith Security | Zero-Knowledge RFP Data Architecture", description: "BidSmith processes solicitation data in transient memory only. No data stored, indexed, or shared. Learn how our zero-knowledge architecture keeps your proposal strategy private.", path: "/soc" },
  "sam-rep": { title: "Sample Federal RFP Audit Report | BidSmith Compliance Matrix Demo", description: "See a real BidSmith audit output for a Defense Health Agency solicitation — compliance matrix, FAR/DFARS flags, risk score, and bid/no-bid verdict included.", path: "/sam-rep" },
  discovery: { title: "Federal Opportunity Discovery | Search SAM.gov Solicitations — BidSmith", description: "Find federal contracting opportunities matched to your NAICS codes, agency targets, and capability profile. Real-time search across SAM.gov and award history.", path: "/discovery" },
  "sam-scraper": { title: "SAM.gov Bulk Opportunity Export & Scraper | BidSmith", description: "Export and filter SAM.gov opportunities in bulk. Filter by NAICS code, agency, set-aside type, and dollar threshold. Build your bid pipeline in minutes.", path: "/sam-scraper" },
  "bid-search": { title: "Federal Bid Search | Live SAM.gov Solicitation Search — BidSmith", description: "Search live federal solicitations, contract awards, and agency spend patterns using natural language. Find the right bids faster with BidSmith's intelligent search.", path: "/bid-search" },
  beta: { title: "BidSmith Gov Admin Registry | Early Access for Federal Contractors", description: "Apply for early access to BidSmith's Gov Admin Registry — institutional RFP intelligence and compliance tooling for federal practice teams.", path: "/beta" },
  demo: { title: "BidSmith Live Demo | Watch a Federal RFP Audit in 90 Seconds", description: "Watch BidSmith audit a real $24.5M Army solicitation live — compliance matrix, FAR/DFARS disqualifier flags, risk score, and bid/no-bid verdict. No signup required.", path: "/demo" },
  "govcon-guide": { title: "Federal Contracting Process Guide | How to Win Government Contracts — BidSmith", description: "The complete government contracting workflow for new and experienced contractors — SAM.gov registration, opportunity discovery, compliance review, and proposal development.", path: "/govcon-guide" },
  labs: { title: "BidSmith Labs | Experimental Federal Intelligence Tools", description: "Experimental capture management and GovCon intelligence tools from BidSmith. Early-access features for federal contractors.", path: "/labs" },
  privacy: { title: "Privacy Policy | BidSmith", description: "How BidSmith collects, uses, and protects your data. Read our full privacy policy for bidsmith.pro.", path: "/privacy" },
  terms: { title: "Terms of Service | BidSmith", description: "Terms and conditions governing your use of the BidSmith federal RFP audit platform.", path: "/terms" },
  cookies: { title: "Cookie Policy | BidSmith", description: "How BidSmith uses cookies and local storage. We minimize data collection and never sell your information.", path: "/cookies" },
  app: { title: "BidSmith Audit Workspace | Federal RFP Compliance Analysis", description: "Your BidSmith federal solicitation audit workspace. Paste a SAM.gov URL or upload a PDF to begin.", path: "/app" },
  "govcon-dashboard": { title: "BidSmith GovCon Dashboard | Capture Intelligence Workspace", description: "Manage your active federal bid pipeline. Track solicitations, compliance status, and win probability in one workspace.", path: "/dashboard" },
  pricing: { title: "BidSmith Pricing | Federal RFP Audit Plans — Free to $999/mo", description: "Start free with 3 audits per month. Upgrade for unlimited audits, full FAR/DFARS analysis, and deep-shred strategy. No hidden fees.", path: "/pricing" },
  "rfp-generator": { title: "Free RFP Compliance Matrix Generator | 90-Second FAR/DFARS Analysis — BidSmith", description: "Turn any government RFP into a structured compliance matrix in 90 seconds. Identify missing requirements and disqualification risks before you commit proposal resources.", path: "/rfp-compliance-matrix-generator" },
  outreach: { title: "Outreach Dashboard | BidSmith Internal", description: "Internal outreach tracking dashboard.", path: "/outreach" },
  admin: { title: "Admin Portal | BidSmith", description: "Internal analytics portal.", path: "/admin" },
  contact: { title: "Contact BidSmith | Talk to a Federal Capture Specialist", description: "Get in touch with the BidSmith team. Request a demo, ask about pricing, or connect with a federal capture specialist for your next solicitation.", path: "/contact" },
  aris: { title: "ARIS Strategic Consulting | 7-Day Institutional AI Audit — BidSmith", description: "Secure your next federal prime contract with elite AI-driven compliance. Our 7-Day AI Audit protocol transforms your capture strategy using sovereign intelligence.", path: "/aris" },
  earn: { title: "Earn with BidSmith | 20% Recurring Partner Program for GovCon Professionals", description: "Refer federal contractors to BidSmith and earn 20% recurring commission on every paid conversion. No cap, 90-day attribution, monthly payouts. Built for GovCon consultants and proposal professionals.", path: "/earn" },
  newsletter: { title: "The Bid Brief | Weekly Federal Contracting Intelligence Newsletter", description: "Weekly federal contracting intelligence for government contractors and BD teams. One opportunity segment, one compliance insight, one process tip — every Wednesday.", path: "/newsletter" },
};

function usePageMeta(view) {
  useEffect(() => {
    const isCompliance = view === "compliance";
    const meta = PAGE_META[view] || PAGE_META.landing;

    document.title = meta.title;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.description);
    const ot = document.querySelector('meta[property="og:title"]');
    if (ot) ot.setAttribute("content", meta.title);
    const od = document.querySelector('meta[property="og:description"]');
    if (od) od.setAttribute("content", meta.description);

    const canonicalPath = isCompliance
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

    const NOINDEX_VIEWS = new Set(["app", "sam-scraper", "phase2", "audit", "survey-analytics", "demo-analytics", "govcon-dashboard"]);
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
  "/workflow": "workflow",
  "/markets": "markets",
  "/contact": "contact",
};

export default function App() {
  const path = window.location.pathname;
  const aliasSection = LANDING_SECTION_ALIASES[path] || null;
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("aris_authenticated") === "true");
  const [user, setUser] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [view, setView] = useState(() => {
    const p = window.location.pathname;
    const isApp = p.startsWith("/app") || window.location.search.includes("app=true");
    if (isApp) return "app";
    if (p === "/dashboard-v2") return "app";
    if (p === "/templates") return "templates";
    if (p === "/pricing") return "pricing";
    if (p === "/rfp-compliance-matrix-generator") return "rfp-generator";
    if (p === "/outreach") return "outreach";
    if (p === "/admin") return "admin";
    if (p === "/contact") return "contact";
    if (p === "/earn") return "earn";
    if (p === "/newsletter") return "newsletter";
    if (p === "/privacy" || p === "/terms" || p === "/cookies") return p.slice(1);
    if (p === "/sam-rep") return "sam-rep";
    if (p === "/discovery") return "discovery";
    if (p === "/soc") return "soc";
    if (p === "/sam-scraper") return "sam-scraper";
    if (p === "/bid-search" || p === "/fed-search" || p === "/search") return "bid-search";
    if (p === "/survey-analytics") return "survey-analytics";
    if (p === "/demo-analytics") return "demo-analytics";
    if (p === "/about") return "about";
    if (p === "/beta" || p === "/sovereign-beta") return "beta";
    if (p === "/demo") return "demo";
    if (p === "/govcon-guide" || p === "/how-it-works") return "govcon-guide";
    // /dashboard redirects to /app (V2 is the live product)
    if (p === "/dashboard" || p === "/app/dashboard") return "app";
    if (p.startsWith("/labs")) return "labs";
    if (p.startsWith("/compliance/")) return "compliance";
    if (aliasSection) return "landing";
    if (p === "/aris") return "aris";
    if (p === "/" || p === "") return "landing";
    return "404";
  });

  usePageMeta(view);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setAuthenticated(true);
        setUser(session.user);
        localStorage.setItem("aris_authenticated", "true");
      }
    }).catch(err => {
      console.warn("[ARIS_AUTH] Session fetch suppressed in Sovereign mode:", err.message);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthenticated(true);
        setUser(session.user);
        localStorage.setItem("aris_authenticated", "true");
      } else {
        // Signed out — clear everything
        setUser(null);
        setAuthenticated(false);
        localStorage.removeItem("aris_authenticated");
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!aliasSection || view !== "landing") return;

    window.history.replaceState({ view: "landing" }, "", `/#${aliasSection}`);
    const timer = setTimeout(() => {
      document.getElementById(aliasSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => clearTimeout(timer);
  }, [aliasSection, view]);

  useEffect(() => {
    let logicalPath = "/";
    if (view === "app") {
      logicalPath = "/app";
    } else if (view === "templates") {
      logicalPath = "/templates";
    } else if (view === "privacy" || view === "terms" || view === "cookies") {
      logicalPath = `/${view}`;
    } else if (view === "404") {
      logicalPath = "/404";
    } else if (view === "sam-rep") {
      logicalPath = "/sam-rep";
    } else if (view === "discovery") {
      logicalPath = "/discovery";
    } else if (view === "soc") {
      logicalPath = "/soc";
    } else if (view === "sam-scraper") {
      logicalPath = "/sam-scraper";
    } else if (view === "bid-search") {
      logicalPath = "/bid-search";
    } else if (view === "about") {
      logicalPath = "/about";
    } else if (view === "demo") {
      logicalPath = "/demo";
    } else if (view === "govcon-guide") {
      logicalPath = "/govcon-guide";
    } else if (view === "govcon-dashboard") {
      logicalPath = window.location.pathname;
    } else if (view === "compliance") {
      logicalPath = window.location.pathname;
    } else if (view === "aris") {
      logicalPath = "/aris";
    } else if (view === "earn") {
      logicalPath = "/earn";
    } else if (view === "newsletter") {
      logicalPath = "/newsletter";
    } else if (view === "landing") {
      logicalPath = aliasSection ? `/#${aliasSection}` : "/";
    }

    trackPageView(logicalPath);
  }, [view, authenticated, proposal, aliasSection]);

  useEffect(() => {
    if (window.history.state === null || window.history.state?.view === undefined) {
      window.history.pushState({ view: "landing" }, "", window.location.href);
    }
  }, []);

  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState({ view }, "", currentUrl);

    const handlePopState = (e) => {
      e.preventDefault?.();
      setView("landing");
      window.history.pushState({ view: "landing" }, "", "/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [view]);

  const [initialUrl, setInitialUrl] = useState("");
  const [initialFile, setInitialFile] = useState(null);

  const handleBidSmithSearch = () => {
    setView("bid-search");
    window.history.pushState({ view: "bid-search" }, "", "/search");
  };

  const handleAnalyze = (url) => {
    setInitialFile(null);
    setInitialUrl(url);
    setView("app");
  };

  const handleAnalyzeFile = (file) => {
    setInitialUrl("");
    setInitialFile(file);
    setView("app");
  };

  let content = null;
  if (view === "templates") {
    content = <Templates />;
  } else if (view === "privacy" || view === "terms" || view === "cookies") {
    content = <Legal type={view} />;
  } else if (view === "404") {
    content = <NotFound />;
  } else if (view === "sam-rep") {
    content = <SamRep onBack={() => setView("landing")} />;
  } else if (view === "discovery") {
    content = <Discovery onBack={() => setView("landing")} />;
  } else if (view === "soc") {
    content = <Security onBack={() => setView("landing")} />;
  } else if (view === "sam-scraper") {
    content = <SamScraper onBack={() => setView("landing")} />;
  } else if (view === "bid-search") {
    content = <BidSmithSearch onBack={() => setView("landing")} />;
  } else if (view === "survey-analytics") {
    content = authenticated
      ? <SurveyAnalytics />
      : <Login onLogin={(u) => { setAuthenticated(true); setUser(u); localStorage.setItem("aris_authenticated", "true"); }} />;
  } else if (view === "demo-analytics") {
    content = authenticated
      ? <DemoAnalytics />
      : <Login onLogin={(u) => { setAuthenticated(true); setUser(u); localStorage.setItem("aris_authenticated", "true"); }} />;
  } else if (view === "about") {
    content = <About onBack={() => setView("landing")} />;
  } else if (view === "labs") {
    content = <Labs onBack={() => setView("landing")} />;
  } else if (view === "govcon-dashboard") {
    // Alias kept for safety — routes to V2 (same as /app)
    content = <GovConDashboardV2 onBack={() => setView("landing")} user={user} />;
  } else if (view === "compliance") {
    const slug = window.location.pathname.replace("/compliance/", "");
    content = <CompliancePage slug={slug} onBack={() => setView("app")} />;
  } else if (view === "beta") {
    content = <BidSmithBeta onBack={() => setView("landing")} />;
  } else if (view === "demo") {
    content = <Demo onBack={() => setView("landing")} onEnterApp={() => setView("app")} />;
  } else if (view === "govcon-guide") {
    content = <GovConGuide onBack={() => setView("landing")} onEnterApp={() => setView("app")} />;
  } else if (view === "pricing") {
    content = (
      <PricingGrid 
        onTryFree={() => setView("app")} 
        onGetPro={() => window.open("https://buy.stripe.com/3cIaEX66197ad9H9na2Fa00", "_blank")} 
      />
    );
  } else if (view === "rfp-generator") {
    content = <RfpMatrixGenerator onUpload={() => setView("app")} />;
  } else if (view === "outreach") {
    content = authenticated
      ? <Outreach onBack={() => setView("landing")} />
      : <Login onLogin={(u) => { setAuthenticated(true); setUser(u); localStorage.setItem("aris_authenticated", "true"); }} />;
  } else if (view === "admin") {
    content = authenticated
      ? <AdminDashboard onBack={() => setView("landing")} />
      : <Login onLogin={(u) => { setAuthenticated(true); setUser(u); localStorage.setItem("aris_authenticated", "true"); }} />;
  } else if (view === "contact") {
    content = <Contact onBack={() => setView("landing")} />;
  } else if (view === "earn") {
    content = <Earn onBack={() => setView("landing")} />;
  } else if (view === "newsletter") {
    content = <Newsletter onBack={() => setView("landing")} />;
  } else if (view === "aris") {
    content = <ArisConsulting onGetStarted={() => setView("app")} />;
  } else if (view === "landing") {
    content = (
      <Landing
        onEnterApp={() => setView("app")}
        onEnterDashboard={() => setView("app")}
        onViewSample={() => setView("demo")}
        onBidSmithBeta={() => setView("beta")}
        onBidSmithSearch={handleBidSmithSearch}
        onAnalyze={handleAnalyze}
        onAnalyzeFile={handleAnalyzeFile}
        onGoHome={() => setView("landing")}
      />
    );
  } else if (view === "app") {
    content = authenticated && user
      ? <GovConDashboardV2 onBack={() => setView("landing")} user={user} />
      : <Login onLogin={(u) => { setAuthenticated(true); setUser(u); localStorage.setItem("aris_authenticated", "true"); }} />;
  } else if (view === "404") {
    content = <NotFound onBack={() => setView("landing")} />;
  } else if (!authenticated) {
    content = <Login onLogin={(u) => { setAuthenticated(true); setUser(u); localStorage.setItem("aris_authenticated", "true"); }} />;
  } else {
    content = <NotFound onBack={() => setView("landing")} />;
  }

  return (
    <ErrorBoundary reloadOnRetry={true} fallbackMode="wanderer">
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d0f14" }} />}>
        {content}
      </Suspense>
      {/* Legacy Demo Section handled above */}
      <ConsentBanner />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
}
