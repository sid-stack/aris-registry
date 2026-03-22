import { lazy, Suspense, useEffect, useState } from "react";
// Landing is the entry point — eager load for instant first paint
import Landing from "./pages/Landing";
import ConsentBanner from "./components/ConsentBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import { trackPageView } from "./utils/analytics";

// All other pages lazy-loaded — only downloaded when the user navigates to them
const Upload         = lazy(() => import("./pages/Upload"));
const Proposal       = lazy(() => import("./pages/Proposal"));
const Login          = lazy(() => import("./pages/Login"));
const Audit          = lazy(() => import("./pages/Audit"));
const Templates      = lazy(() => import("./pages/Templates"));
const Legal          = lazy(() => import("./pages/Legal"));
const SamRep         = lazy(() => import("./pages/SamRep"));
const Discovery      = lazy(() => import("./pages/Discovery"));
const Security       = lazy(() => import("./pages/Security"));
const About          = lazy(() => import("./pages/About"));
const SamScraper     = lazy(() => import("./pages/SamScraper"));
const Labs           = lazy(() => import("./pages/Labs"));
const SovereignBeta  = lazy(() => import("./pages/SovereignBeta"));
const SovereignSearch= lazy(() => import("./pages/SovereignSearch"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const SurveyAnalytics= lazy(() => import("./components/SurveyAnalytics"));
const DemoAnalytics  = lazy(() => import("./components/DemoAnalytics"));
const Demo           = lazy(() => import("./pages/Demo"));
const GovConGuide    = lazy(() => import("./pages/GovConGuide"));
const NotFound       = lazy(() => import("./pages/NotFound"));

const BASE_URL = "https://www.bidsmith.pro";

const PAGE_META = {
  landing:          { title: "ARIS | Federal RFP Compliance & Audit Software for Government Contractors", description: "Analyze SAM.gov solicitations in 90 seconds. Compliance matrix, FAR/DFARS risk flags, and bid/no-bid brief — automatically.", path: "/" },
  templates:        { title: "ARIS Templates | Federal Proposal & Compliance Matrix Templates", description: "Download pre-built compliance matrix templates, proposal outlines, and RFP shred worksheets for government contractors.", path: "/templates" },
  about:            { title: "About ARIS Labs | Federal GovCon Intelligence Platform", description: "ARIS Labs builds agentic intelligence for federal capture teams. Zero-knowledge architecture, SAM.gov native.", path: "/about" },
  soc:              { title: "ARIS Security | Zero-Knowledge Data Architecture", description: "ARIS processes solicitation data in transient memory. No persistence, no storage, no leaks.", path: "/soc" },
  "sam-rep":        { title: "ARIS Sample Audit | DHA Federal Solicitation Report", description: "Inspect a real ARIS audit output for a Defense Health Agency solicitation.", path: "/sam-rep" },
  discovery:        { title: "ARIS Discovery | Federal Opportunity Discovery Engine", description: "Surface federal contracting opportunities matched to your NAICS codes and capability profile.", path: "/discovery" },
  "sam-scraper":    { title: "ARIS SAM Scraper | SAM.gov Bulk Opportunity Export", description: "Extract and filter SAM.gov opportunities in bulk by NAICS, agency, set-aside, and dollar threshold.", path: "/sam-scraper" },
  "fed-search":     { title: "ARIS Sovereign Search | Federal Intelligence Search", description: "Search federal solicitations, award history, and agency patterns with natural language queries.", path: "/fed-search" },
  "sovereign-beta": { title: "ARIS Sovereign v2.1 Private Beta | Early Access", description: "Apply for early access to Sovereign v2.1 — the next generation of ARIS federal intelligence.", path: "/sovereign-beta" },
  "demo":           { title: "ARIS Live Demo | See a Federal RFP Audit in 90 Seconds", description: "Watch ARIS audit a real $24.5M Army solicitation — compliance matrix, disqualifier flags, and bid/no-bid verdict. Free interactive demo.", path: "/demo" },
  "govcon-guide":   { title: "Federal Contracting Process Guide | ARIS", description: "The complete government contracting workflow — SAM.gov registration, opportunity discovery, compliance review, and proposal development. End-to-end guide.", path: "/govcon-guide" },
  labs:             { title: "ARIS Labs | Experimental Federal Intelligence Tools", description: "Experimental tools from ARIS Labs for federal capture management and GovCon intelligence.", path: "/labs" },
  privacy:          { title: "Privacy Policy | ARIS / BidSmith", description: "ARIS Labs privacy policy. How we handle data and your rights.", path: "/privacy" },
  terms:            { title: "Terms of Service | ARIS / BidSmith", description: "Terms of service governing use of the BidSmith platform.", path: "/terms" },
  cookies:          { title: "Cookie Policy | ARIS / BidSmith", description: "How ARIS uses cookies and local storage on bidsmith.pro.", path: "/cookies" },
  app:              { title: "ARIS Audit Workspace", description: "Your ARIS federal solicitation audit workspace.", path: "/app" },
};

function usePageMeta(view) {
  useEffect(() => {
    // For compliance/* pages the real path is already in window.location.pathname
    const isCompliance = view === "compliance";
    const meta = PAGE_META[view] || PAGE_META.landing;

    document.title = meta.title;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.description);
    const ot = document.querySelector('meta[property="og:title"]');
    if (ot) ot.setAttribute("content", meta.title);
    const od = document.querySelector('meta[property="og:description"]');
    if (od) od.setAttribute("content", meta.description);

    // Update canonical to match the actual page — prevents every page looking
    // like a duplicate of the homepage to Google
    const canonicalPath = isCompliance
      ? window.location.pathname          // e.g. /compliance/far-52-212-1
      : (meta.path || "/");
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    // Keep OG url in sync too
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

    // noindex for pure app/tool pages — not content, not meant to rank
    const NOINDEX_VIEWS = new Set(["app", "sam-scraper", "phase2", "audit", "survey-analytics", "demo-analytics"]);
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
  "/pricing": "pricing",
  "/markets": "markets",
  "/contact": "contact",
};

export default function App() {
  const path = window.location.pathname;
  const aliasSection = LANDING_SECTION_ALIASES[path] || null;
  const [authenticated, setAuthenticated] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [route] = useState(() =>
    window.location.search.includes("phase2=true") ? "phase2" : "audit",
  );
  const [view, setView] = useState(() =>
    aliasSection
      ? "landing"
      : path === "/templates"
      ? "templates"
      : path === "/privacy"
        ? "privacy"
        : path === "/terms"
          ? "terms"
          : path === "/cookies"
            ? "cookies"
            : path === "/sam-rep"
              ? "sam-rep"
              : path === "/discovery"
                ? "discovery"
                : path === "/soc"
                  ? "soc"
                  : path === "/sam-scraper"
                    ? "sam-scraper"
                  : path === "/fed-search" || path === "/search"
                    ? "fed-search"
                  : path === "/survey-analytics"
                    ? "survey-analytics"
                  : path === "/demo-analytics"
                    ? "demo-analytics"
                  : path === "/app"
                    ? "app"
                  : window.location.search.includes("app=true")
                    ? "app"
                  : path === "/about"
                    ? "about"
                  : path === "/sovereign-beta"
                    ? "sovereign-beta"
                  : path === "/demo"
                    ? "demo"
                  : path === "/govcon-guide" || path === "/how-it-works"
                    ? "govcon-guide"
                  : path.startsWith("/labs")
                    ? "labs"
                    : path.startsWith("/compliance/")
                      ? "compliance"
                      : path !== "/"
                        ? "404"
                        : "landing",
  );

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
    } else if (view === "fed-search") {
      logicalPath = "/fed-search";
    } else if (view === "survey-analytics") {
      logicalPath = "/survey-analytics";
    } else if (view === "demo-analytics") {
      logicalPath = "/demo-analytics";
    } else if (view === "about") {
      logicalPath = "/about";
    } else if (view === "sovereign-beta") {
      logicalPath = "/sovereign-beta";
    } else if (view === "demo") {
      logicalPath = "/demo";
    } else if (view === "govcon-guide") {
      logicalPath = "/govcon-guide";
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

  // ── Back navigation: pop state goes back to landing ──
  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState({ view }, "", currentUrl);

    const handlePopState = () => {
      if (view !== "landing") setView("landing");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [view]);

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
  } else if (view === "fed-search") {
    content = <SovereignSearch onBack={() => setView("landing")} />;
  } else if (view === "survey-analytics") {
    content = <SurveyAnalytics />;
  } else if (view === "demo-analytics") {
    content = <DemoAnalytics />;
  } else if (view === "about") {
    content = <About onBack={() => setView("landing")} />;
  } else if (view === "labs") {
    content = <Labs onBack={() => setView("landing")} />;
  } else if (view === "compliance") {
    const slug = window.location.pathname.replace("/compliance/", "");
    content = <CompliancePage slug={slug} onBack={() => setView("app")} />;
  } else if (view === "sovereign-beta") {
    content = <SovereignBeta onBack={() => setView("landing")} />;
  } else if (view === "demo") {
    content = <Demo onBack={() => setView("landing")} onEnterApp={() => setView("app")} />;
  } else if (view === "govcon-guide") {
    content = <GovConGuide onBack={() => setView("landing")} onEnterApp={() => setView("app")} />;
  } else if (view === "landing") {
    content = <Landing 
      onEnterApp={() => setView("app")} 
      onViewSample={() => setView("sam-rep")} 
      onSovereignBeta={() => setView("sovereign-beta")}
      onSovereignSearch={() => setView("fed-search")}
    />;
  } else if (view === "app") {
    // Audit is stateless and zero-knowledge, allow guest access for the first audit
    content = <Audit onBack={() => setView("landing")} />;
  } else if (!authenticated) {
    content = <Login onLogin={() => setAuthenticated(true)} />;
  } else {
    content = route === "audit"
      ? <Audit onBack={() => setView("landing")} />
      : !proposal
        ? <Upload onProposalGenerated={setProposal} onBack={() => setView("landing")} />
        : <Proposal proposal={proposal} onReset={() => setProposal(null)} onBack={() => setView("landing")} />;
  }

  return (
    <ErrorBoundary reloadOnRetry={false} fallbackMode="wanderer">
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d0f14" }} />}>
        {content}
      </Suspense>
      <ConsentBanner />
    </ErrorBoundary>
  );
}
