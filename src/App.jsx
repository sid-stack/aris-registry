import { useState, useEffect } from "react";
import Upload from "./pages/Upload";
import Proposal from "./pages/Proposal";
import Login from "./pages/Login";
import Audit from "./pages/Audit";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [route, setRoute] = useState("audit");

  useEffect(() => {
    // Hidden route for legacy Phase 2
    if (window.location.search.includes("phase2=true")) {
      setRoute("phase2");
    }
  }, []);

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div>
      {route === "audit" ? (
        <Audit />
      ) : (
        !proposal ? <Upload onProposalGenerated={setProposal} /> : <Proposal proposal={proposal} onReset={() => setProposal(null)} />
      )}
    </div>
  );
}
