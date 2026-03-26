import { lazy, Suspense, useEffect, useState } from "react";
import Landing from "./pages/Landing";
import ConsentBanner from "./components/ConsentBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import GovConDashboard from "./pages/GovConDashboard";
import { trackPageView } from "./utils/analytics";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { supabase } from "./lib/supabase";

// Lazy-load secondary views
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
const BidSmithBeta   = lazy(() => import("./pages/BidSmithBeta"));
const BidSmithSearch = lazy(() => import("./pages/BidSmithSearch"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const GovConGuide    = lazy(() => import("./pages/GovConGuide"));
const NotFound       = lazy(() => import("./pages/NotFound"));

const BASE_URL = "https://www.bidsmith.pro";

const PAGE_META = {
  landing: { title: "ARIS | Federal GovCon Intelligence & Compliance", description: "Institutional-grade federal bid intelligence. SAM.gov native, zero-knowledge security.", path: "/" },
  dashboard: { title: "ARIS Dashboard | Gov-Tier Workspace", description: "Mission-critical audit and proposal drafting workspace.", path: "/dashboard" },
};

function usePageMeta(view) {
  useEffect(() => {
    const meta = PAGE_META[view] || PAGE_META.landing;
    document.title = meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.description);
  }, [view]);
}

const LANDING_SECTION_ALIASES = {
  "/solutions": "solutions",
  "/workflow": "workflow",
  "/pricing": "pricing",
};

export default function App() {
  const path = window.location.pathname;
  const aliasSection = LANDING_SECTION_ALIASES[path] || null;
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("aris_authenticated") === "true");
  const [user, setUser] = useState(null);
  const [view, setView] = useState(() => {
    if (path === "/dashboard") return "dashboard";
    if (path === "/login") return "login";
    if (path === "/app") return "app";
    if (path === "/templates") return "templates";
    if (path === "/privacy" || path === "/terms" || path === "/cookies") return "legal";
    return "landing";
  });

  usePageMeta(view);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      } else if (localStorage.getItem("aris_authenticated") !== "true") {
        setAuthenticated(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    trackPageView(window.location.pathname);
  }, [view]);

  let content = null;
  if (view === "landing") {
    content = <Landing 
      onEnterApp={() => setView("app")} 
      onViewSample={() => setView("sam-rep")} 
      onEnterDashboard={() => setView("dashboard")}
      onSovereignSearch={() => setView("bid-search")}
    />;
  } else if (view === "dashboard") {
    content = authenticated 
      ? <GovConDashboard onBack={() => setView("landing")} />
      : <Login onLogin={() => setAuthenticated(true)} />;
  } else if (view === "app") {
    content = <Audit onBack={() => setView("landing")} />;
  } else if (view === "login") {
    content = <Login onLogin={() => { setAuthenticated(true); setView("dashboard"); }} />;
  } else if (view === "templates") {
    content = <Templates />;
  } else if (view === "legal") {
    content = <Legal type={path.replace("/", "")} />;
  } else if (view === "sam-rep") {
    content = <SamRep onBack={() => setView("landing")} />;
  } else if (view === "bid-search") {
    content = <BidSmithSearch onBack={() => setView("landing")} />;
  } else {
    content = <NotFound />;
  }

  return (
    <ErrorBoundary reloadOnRetry={false} fallbackMode="wanderer">
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0d14" }} />}>
        {content}
      </Suspense>
      <ConsentBanner />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
}
