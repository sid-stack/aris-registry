import { useState } from "react";
import Upload from "./pages/Upload.jsx";
import Proposal from "./pages/Proposal.jsx";

export default function App() {
  const [proposal, setProposal] = useState(null);
  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", color: "#d4d8e2", fontFamily: "sans-serif" }}>
      {!proposal ? <Upload onProposalGenerated={setProposal} /> : <Proposal proposal={proposal} onReset={() => setProposal(null)} />}
    </div>
  );
}
