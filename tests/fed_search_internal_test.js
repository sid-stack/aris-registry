import { FedSearchEngine } from "../api/services/fedSearch.js";

async function testEngine() {
  const engine = new FedSearchEngine();
  
  const mockData = [
    {
      noticeId: "1",
      title: "AI Research and Development",
      description: "Development of Artificial Intelligence for defense health monitoring.",
      agency: "DHA",
      postedDate: "2026-03-20"
    },
    {
      noticeId: "2",
      title: "Cybersecurity Infrastructure Support",
      description: "Securing federal networks against cyber threats and zero-day attacks.",
      agency: "CISA",
      postedDate: "2026-03-19"
    },
    {
      noticeId: "3",
      title: "Machine Learning Pilot",
      description: "Pilot program for ML models in predictive maintenance.",
      agency: "DOD",
      postedDate: "2026-03-18"
    }
  ];

  console.log("--- 🚢 Sovereign Fed Search Diagnostic ---");
  
  // 1. Ingestion
  await engine.ingest(mockData);
  console.log("[PASS] Ingestion complete.");

  // 2. Keyword Search
  const results1 = engine.search("AI");
  console.log(`[TEST] Search 'AI': Found ${results1.length} matches. Expected: 1`);
  if (results1.length !== 1) console.error("[FAIL] 'AI' search failed.");

  // 3. Multi-term Intersection Search
  const results2 = engine.search("Artificial Intelligence");
  console.log(`[TEST] Search 'Artificial Intelligence': Found ${results2.length} matches. Expected: 1`);
  if (results2.length !== 1) console.error("[FAIL] 'Artificial Intelligence' search failed.");

  // 4. No results
  const results3 = engine.search("Quantum");
  console.log(`[TEST] Search 'Quantum': Found ${results3.length} matches. Expected: 0`);
  if (results3.length !== 0) console.error("[FAIL] 'Quantum' search failed.");

  console.log("--- End Diagnostic ---");
}

testEngine().catch(console.error);
