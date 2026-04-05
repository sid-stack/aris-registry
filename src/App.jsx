import { useEffect, useState, lazy, Suspense } from "react";
import { useAuth } from "@clerk/clerk-react";
import Upload from "./pages/Upload";
import Proposal from "./pages/Proposal";
import Login from "./pages/Login";
import Audit from "./pages/Audit";
const AuditSession = lazy(() => import("./pages/AuditSession.jsx"));
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

// Persist an anonymous user id across sessions so audits stay associated.
try {
  if (!localStorage.getItem("aris_uid")) {
    localStorage.setItem("aris_uid", crypto.randomUUID());
  }
} catch { /* storage unavailable */ }

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
  const { isSignedIn } = useAuth();
  const [authenticated, setAuthenticated] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [route] = useState(() =>
    window.location.search.includes("phase2=true") ? "phase2" : "audit",
  );
  const [view, setView] = useState(() => {
    if (path.startsWith("/audit/")) return "audit-session";
    if (aliasSection) return "landing";
    if (path === "/templates") return "templates";
    if (path === "/privacy") return "privacy";
    if (path === "/terms") return "terms";
    if (path === "/cookies") return "cookies";
    if (path === "/sam-rep") return "sam-rep";
    if (path === "/discovery") return "discovery";
    if (path === "/soc") return "soc";
    if (path === "/sam-scraper") return "sam-scraper";
    if (path === "/fed-search" || path === "/search") return "fed-search";
    if (path === "/survey-analytics") return "survey-analytics";
    if (path === "/demo-analytics") return "demo-analytics";
    if (path === "/app" || window.location.search.includes("app=true")) return "app";
    if (path === "/about") return "about";
    if (path === "/sovereign-beta") return "sovereign-beta";
    if (path.startsWith("/labs")) return "labs";
    if (path === "/") return "landing";
    return "404";
  });

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

  // ── HISTORY LOCKDOWN (Trap user on site) ──
  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    // Push state to create a history entry we can intercept
    window.history.pushState({ view }, "", currentUrl);

    const handlePopState = () => {
      const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      // Re-push state immediately to maintain the trap
      window.history.pushState({ view }, "", nextUrl);
      
      if (view !== "landing") {
        setView("landing");
      }
      // If already on landing, the pushState above keeps us there
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
  } else if (view === "audit-session") {
    const auditId = window.location.pathname.replace("/audit/", "");
    content = (
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d0f14" }} />}>
        <AuditSession auditId={auditId} onBack={() => { window.history.pushState({}, "", "/"); setView("landing"); }} />
      </Suspense>
    );
  } else if (view === "landing") {
    content = <Landing
      onEnterApp={() => setView("app")}
      onViewSample={() => setView("sam-rep")}
      onSovereignBeta={() => setView("sovereign-beta")}
      onSovereignSearch={() => setView("fed-search")}
    />;
  } else if (view === "app") {
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
