import { useState } from "react";
import Upload from "./pages/Upload";
import Proposal from "./pages/Proposal";
import Login from "./pages/Login";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [proposal, setProposal] = useState(null);

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div>
      {!proposal ? <Upload onProposalGenerated={setProposal} /> : <Proposal proposal={proposal} onReset={() => setProposal(null)} />}
    </div>
  );
}
