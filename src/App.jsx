import { lazy, Suspense, useEffect, useState } from "react";
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
const GovConDashboard = lazy(() => import("./pages/GovConDashboard"));
const GovConGuide = lazy(() => import("./pages/GovConGuide"));
const Demo = lazy(() => import("./pages/Demo"));
const PricingGrid = lazy(() => import("./pages/PricingGrid"));
const RfpMatrixGenerator = lazy(() => import("./pages/seo/RfpMatrixGenerator"));
const Outreach = lazy(() => import("./pages/Outreach"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

const BASE_URL = "https://www.bidsmith.pro";

const PAGE_META = {
  landing: { title: "BidSmith | Federal Intelligence & Gov Admin Registry", description: "The institutional registry for federal procurement logic. Analyze SAM.gov solicitations in 90 seconds. Compliance matrix, FAR/DFARS risk flags, and bid/no-bid brief — automatically.", path: "/" },
  templates: { title: "BidSmith Templates | Federal Proposal & Compliance Matrix Templates", description: "Download pre-built compliance matrix templates, proposal outlines, and RFP shred worksheets for government contractors.", path: "/templates" },
  about: { title: "About BidSmith | Federal GovCon Intelligence Platform", description: "BidSmith builds agentic intelligence for federal capture teams. Zero-knowledge architecture, SAM.gov native.", path: "/about" },
  soc: { title: "BidSmith Security | Zero-Knowledge Data Architecture", description: "BidSmith processes solicitation data in transient memory. No persistence, no storage, no leaks.", path: "/soc" },
  "sam-rep": { title: "BidSmith Sample Audit | DHA Federal Solicitation Report", description: "Inspect a real BidSmith audit output for a Defense Health Agency solicitation.", path: "/sam-rep" },
  discovery: { title: "BidSmith Discovery | Federal Opportunity Discovery Engine", description: "Surface federal contracting opportunities matched to your NAICS codes and capability profile.", path: "/discovery" },
  "sam-scraper": { title: "BidSmith SAM Scraper | SAM.gov Bulk Opportunity Export", description: "Extract and filter SAM.gov opportunities in bulk by NAICS, agency, set-aside, and dollar threshold.", path: "/sam-scraper" },
  "bid-search": { title: "BidSmith Search | Government Search (Live Bids)", description: "Search live federal solicitations, award history, and agency patterns with natural language queries.", path: "/bid-search" },
  beta: { title: "BidSmith Registry | Gov Admin Selection", description: "Apply for selection into the BidSmith Gov Admin Registry — institutional intelligence for federal practice.", path: "/beta" },
  demo: { title: "BidSmith Live Demo | See a Federal RFP Audit in 90 Seconds", description: "Watch BidSmith audit a real $24.5M Army solicitation — compliance matrix, disqualifier flags, and bid/no-bid verdict.", path: "/demo" },
  "govcon-guide": { title: "Federal Contracting Process Guide | BidSmith", description: "The complete government contracting workflow — SAM.gov registration, opportunity discovery, compliance review, and proposal development.", path: "/govcon-guide" },
  labs: { title: "BidSmith / Labs | Experimental Federal Intelligence Tools", description: "Experimental tools from BidSmith for federal capture management and GovCon intelligence.", path: "/labs" },
  privacy: { title: "Privacy Policy | BidSmith", description: "BidSmith privacy policy. How we handle data and your rights.", path: "/privacy" },
  terms: { title: "Terms of Service | BidSmith", description: "Terms of service governing use of the BidSmith platform.", path: "/terms" },
  cookies: { title: "Cookie Policy | BidSmith", description: "How BidSmith uses cookies and local storage on bidsmith.pro.", path: "/cookies" },
  app: { title: "BidSmith Audit Workspace", description: "Your BidSmith federal solicitation audit workspace.", path: "/app" },
  "govcon-dashboard": { title: "BidSmith GovCon Dashboard", description: "Institutional capture intelligence workspace for federal solicitations.", path: "/dashboard" },
  pricing: { title: "BidSmith Support Plans | Institutional RFP Access", description: "Analyze RFPs in seconds. Support tiers for federal practitioners. $49/mo for Pro access.", path: "/pricing" },
  "rfp-generator": { title: "Free RFP Compliance Matrix Generator (90s)", description: "Turn any RFP into a structured compliance matrix instantly. Save hours and avoid missing requirements.", path: "/rfp-compliance-matrix-generator" },
  outreach: { title: "Outreach Dashboard | Internal", description: "Internal outreach tracking tool.", path: "/outreach" },
  admin: { title: "Admin Portal | BidSmith Intelligence", description: "Internal CEO analytics for BidSmith.", path: "/admin" },
  contact: { title: "Contact Sales | BidSmith Federal Intelligence", description: "Request a consultation with a BidSmith federal capture specialist.", path: "/contact" },
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
  const [route] = useState(() =>
    window.location.search.includes("phase2=true") ? "phase2" : "audit",
  );
  const [view, setView] = useState(() =>
    path === "/templates"
      ? "templates"
      : path === "/pricing"
        ? "pricing"
        : path === "/rfp-compliance-matrix-generator"
          ? "rfp-generator"
          : path === "/outreach"
            ? "outreach"
            : path === "/admin"
              ? "admin"
              : path === "/contact"
                ? "contact"
                : path === "/privacy" || path === "/terms" || path === "/cookies"
                  ? path.slice(1)
                  : path === "/sam-rep"
                    ? "sam-rep"
                    : path === "/discovery"
                      ? "discovery"
                      : path === "/soc"
                        ? "soc"
                        : path === "/sam-scraper"
                          ? "sam-scraper"
                          : path === "/bid-search" || path === "/fed-search" || path === "/search"
                            ? "bid-search"
                            : path === "/survey-analytics"
                              ? "survey-analytics"
                              : path === "/demo-analytics"
                                ? "demo-analytics"
                                : path.startsWith("/app") || window.location.search.includes("app=true")
                                  ? "app"
                                  : path === "/about"
                                    ? "about"
                                    : path === "/beta" || path === "/sovereign-beta"
                                      ? "beta"
                                      : path === "/demo"
                                        ? "demo"
                                        : path === "/govcon-guide" || path === "/how-it-works"
                                          ? "govcon-guide"
                                          : path === "/dashboard" || path === "/app/dashboard"
                                            ? "govcon-dashboard"
                                            : path.startsWith("/labs")
                                              ? "labs"
                                              : path.startsWith("/compliance/")
                                                ? "compliance"
                                                : aliasSection
                                                  ? "landing"
                                                  : path !== "/"
                                                    ? "404"
                                                    : "landing",
  );

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
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthenticated(true);
        setUser(session.user);
        localStorage.setItem("aris_authenticated", "true");
      } else {
        setUser(null);
        setAuthenticated(localStorage.getItem("aris_authenticated") === "true");
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

    if (view === "templates") {
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
      logicalPath = "/search";
    } else if (view === "survey-analytics") {
      logicalPath = "/survey-analytics";
    } else if (view === "demo-analytics") {
      logicalPath = "/demo-analytics";
    } else if (view === "about") {
      logicalPath = "/about";
    } else if (view === "beta") {
      logicalPath = "/beta";
    } else if (view === "demo") {
      logicalPath = "/demo";
    } else if (view === "govcon-guide") {
      logicalPath = "/govcon-guide";
    } else if (view === "govcon-dashboard") {
      logicalPath = window.location.pathname;
    } else if (view === "compliance") {
      logicalPath = window.location.pathname;
    } else if (view === "landing") {
      logicalPath = aliasSection ? `/#${aliasSection}` : "/";
    } else if (view === "app") {
      logicalPath = "/app/audit";
    } else if (!authenticated) {
      logicalPath = "/app/login";
    } else if (route === "audit") {
      logicalPath = "/app/audit";
    } else {
      logicalPath = proposal ? "/app/proposal" : "/app/upload";
    }

    trackPageView(logicalPath);
  }, [view, authenticated, route, proposal, aliasSection]);

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
    content = <SurveyAnalytics />;
  } else if (view === "demo-analytics") {
    content = <DemoAnalytics />;
  } else if (view === "about") {
    content = <About onBack={() => setView("landing")} />;
  } else if (view === "labs") {
    content = <Labs onBack={() => setView("landing")} />;
  } else if (view === "govcon-dashboard") {
    content = authenticated
      ? <GovConDashboard onBack={() => setView("landing")} user={user} />
      : <Login onLogin={() => { setAuthenticated(true); localStorage.setItem("aris_authenticated", "true"); }} />;
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
    content = <Outreach onBack={() => setView("landing")} />;
  } else if (view === "admin") {
    content = <AdminDashboard onBack={() => setView("landing")} />;
  } else if (view === "contact") {
    content = <Contact onBack={() => setView("landing")} />;
  } else if (view === "landing") {
    content = (
      <Landing
        onEnterApp={() => setView("app")}
        onEnterDashboard={() => setView("govcon-dashboard")}
        onViewSample={() => setView("demo")}
        onBidSmithBeta={() => setView("beta")}
        onBidSmithSearch={handleBidSmithSearch}
        onAnalyze={handleAnalyze}
        onAnalyzeFile={handleAnalyzeFile}
        onGoHome={() => setView("landing")}
      />
    );
  } else if (view === "app") {
    content = <Audit onBack={() => setView("landing")} initialUrl={initialUrl} initialFile={initialFile} />;
  } else if (view === "404") {
    content = <NotFound onBack={() => setView("landing")} />;
  } else if (!authenticated) {
    content = <Login onLogin={() => { setAuthenticated(true); localStorage.setItem("aris_authenticated", "true"); }} />;
  } else {
    content = <NotFound onBack={() => setView("landing")} />;
  }

  return (
    <ErrorBoundary reloadOnRetry={false} fallbackMode="wanderer">
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
