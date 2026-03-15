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
import Labs from "./pages/Labs";
import NotFound from "./pages/NotFound";
import ConsentBanner from "./components/ConsentBanner";
import { trackPageView } from "./utils/analytics";

export default function App() {
  const path = window.location.pathname;
  const host = window.location.hostname;
  const isLabsSubdomain = host.startsWith("labs.");

  const [authenticated, setAuthenticated] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [route] = useState(() =>
    window.location.search.includes("phase2=true") ? "phase2" : "audit",
  );
  const [view, setView] = useState(() =>
    isLabsSubdomain
      ? "labs"
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
                  : path === "/labs"
                    ? "labs"
                  : path === "/app"
                    ? "app"
                  : window.location.search.includes("app=true")
                    ? "app"
                  : path !== "/"
                    ? "404"
                    : "landing",
  );


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
    } else if (view === "labs") {
      logicalPath = "/labs";
    } else if (view === "landing") {
      logicalPath = "/";
    } else if (!authenticated) {
      logicalPath = "/app/login";
    } else if (route === "audit") {
      logicalPath = "/app/audit";
    } else {
      logicalPath = proposal ? "/app/proposal" : "/app/upload";
    }

    trackPageView(logicalPath);
  }, [view, authenticated, route, proposal]);

  let content = null;
  if (view === "templates") {
    content = <Templates />;
  } else if (view === "privacy" || view === "terms" || view === "cookies") {
    content = <Legal type={view} onBack={() => setView("landing")} />;
  } else if (view === "404") {
    content = <NotFound />;
  } else if (view === "sam-rep") {
    content = <SamRep onBack={() => setView("landing")} />;
  } else if (view === "discovery") {
    content = <Discovery onBack={() => setView("landing")} />;
  } else if (view === "soc") {
    content = <Security onBack={() => setView("landing")} />;
  } else if (view === "labs") {
    content = <Labs onBack={() => setView("landing")} />;
  } else if (view === "landing") {
    content = <Landing onEnterApp={() => setView("app")} onViewSample={() => setView("sam-rep")} />;
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
    <>
      {content}
      <ConsentBanner />
    </>
  );
}
