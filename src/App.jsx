import { useEffect, useState } from "react";
import Upload from "./pages/Upload";
import Proposal from "./pages/Proposal";
import Login from "./pages/Login";
import Audit from "./pages/Audit";
import Landing from "./pages/Landing";
import Templates from "./pages/Templates";
import Legal from "./pages/Legal";
import SamRep from "./pages/SamRep";
import Discovery from "./pages/Discovery";
import Security from "./pages/Security";
import About from "./pages/About";
import SamScraper from "./pages/SamScraper";
import Labs from "./pages/Labs";
import SovereignBeta from "./pages/SovereignBeta";
import SovereignSearch from "./pages/SovereignSearch";
import SurveyAnalytics from "./components/SurveyAnalytics";
import DemoAnalytics from "./components/DemoAnalytics";
import NotFound from "./pages/NotFound";
import ConsentBanner from "./components/ConsentBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import { trackPageView } from "./utils/analytics";

function usePageMeta(view) {
  useEffect(() => {
    const PAGE_META = {
      landing:          { title: "ARIS | Federal RFP Compliance & Audit Software for Government Contractors", description: "Analyze SAM.gov solicitations in 90 seconds. Compliance matrix, FAR/DFARS risk flags, and bid/no-bid brief — automatically." },
      templates:        { title: "ARIS Templates | Federal Proposal & Compliance Matrix Templates", description: "Download pre-built compliance matrix templates, proposal outlines, and RFP shred worksheets for government contractors." },
      about:            { title: "About ARIS Labs | Federal GovCon Intelligence Platform", description: "ARIS Labs builds agentic intelligence for federal capture teams. Zero-knowledge architecture, SAM.gov native." },
      soc:              { title: "ARIS Security | Zero-Knowledge Data Architecture", description: "ARIS processes solicitation data in transient memory. No persistence, no storage, no leaks." },
      "sam-rep":        { title: "ARIS Sample Audit | DHA Federal Solicitation Report", description: "Inspect a real ARIS audit output for a Defense Health Agency solicitation." },
      discovery:        { title: "ARIS Discovery | Federal Opportunity Discovery Engine", description: "Surface federal contracting opportunities matched to your NAICS codes and capability profile." },
      "sam-scraper":    { title: "ARIS SAM Scraper | SAM.gov Bulk Opportunity Export", description: "Extract and filter SAM.gov opportunities in bulk by NAICS, agency, set-aside, and dollar threshold." },
      "fed-search":     { title: "ARIS Sovereign Search | Federal Intelligence Search", description: "Search federal solicitations, award history, and agency patterns with natural language queries." },
      "sovereign-beta": { title: "ARIS Sovereign v2.1 Private Beta | Early Access", description: "Apply for early access to Sovereign v2.1 — the next generation of ARIS federal intelligence." },
      labs:             { title: "ARIS Labs | Experimental Federal Intelligence Tools", description: "Experimental tools from ARIS Labs for federal capture management and GovCon intelligence." },
      privacy:          { title: "Privacy Policy | ARIS / BidSmith", description: "ARIS Labs privacy policy. How we handle data and your rights." },
      terms:            { title: "Terms of Service | ARIS / BidSmith", description: "Terms of service governing use of the BidSmith platform." },
      cookies:          { title: "Cookie Policy | ARIS / BidSmith", description: "How ARIS uses cookies and local storage on bidsmith.pro." },
      app:              { title: "ARIS Audit Workspace", description: "Your ARIS federal solicitation audit workspace." },
    };
    const meta = PAGE_META[view] || PAGE_META.landing;
    document.title = meta.title;
    const d = document.querySelector('meta[name="description"]');
    if (d) d.setAttribute("content", meta.description);
    const ot = document.querySelector('meta[property="og:title"]');
    if (ot) ot.setAttribute("content", meta.title);
    const od = document.querySelector('meta[property="og:description"]');
    if (od) od.setAttribute("content", meta.description);
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
                  : path.startsWith("/labs")
                    ? "labs"
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
  } else if (view === "sovereign-beta") {
    content = <SovereignBeta onBack={() => setView("landing")} />;
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
      {content}
      <ConsentBanner />
    </ErrorBoundary>
  );
}
