import { spawn, exec } from "child_process";
import { promisify } from "util";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { traceLLM } from "../utils/tracing.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const execPromise = promisify(exec);

/**
 * Legacy Support Service
 * Manages Python bridges and mock intel logic for backward compatibility.
 */

export async function handlePulseCheck(uei) {
  if (!uei || uei.length !== 12) {
    throw new Error("Invalid UEI provided. Must be 12 characters.");
  }

  const analyzerPath = join(__dirname, "../../audit/analyzer.py");
  const { stdout, stderr } = await execPromise(`python3 ${analyzerPath} ${uei}`);
  
  if (stderr) console.warn("[Pulse Check] Analyzer stderr:", stderr);
  return JSON.parse(stdout);
}

export function handleSamScrape(query, filter = "all") {
  // Mock SAM.gov scraping results (Replicated from main)
  const mockResults = [
    {
      id: 1,
      businessName: "Federal Construction Solutions LLC",
      ownerName: "John Smith",
      address: "123 Government St, Washington DC 20500",
      phone: "(555) 123-4567",
      email: "info@federalconstruction.com",
      website: "www.federalconstruction.com",
      naicsCode: "236220",
      capability: "Commercial and Institutional Building Construction",
      samStatus: "Active",
      lastUpdated: "2024-03-15",
      filter: "construction"
    },
    {
      id: 2,
      businessName: "Defense Technology Innovations",
      ownerName: "Sarah Johnson",
      address: "456 Defense Ave, Arlington VA 22201",
      phone: "(555) 987-6543",
      email: "contact@defensetech.com",
      website: "www.defensetech.com",
      naicsCode: "541715",
      capability: "Research and Development",
      samStatus: "Active",
      lastUpdated: "2024-03-14",
      filter: "defense"
    },
    {
      id: 3,
      businessName: "Healthcare Systems Group",
      ownerName: "Michael Chen",
      address: "789 Medical Blvd, Bethesda MD 20814",
      phone: "(555) 456-7890",
      email: "admin@healthcaresystems.com",
      website: "www.healthcaresystems.com",
      naicsCode: "621499",
      capability: "Ambulatory Health Care Services",
      samStatus: "Active",
      lastUpdated: "2024-03-13",
      filter: "healthcare"
    }
  ];

  let filteredResults = mockResults;
  if (filter !== "all") {
    filteredResults = mockResults.filter(result => result.filter === filter);
  }

  const recommendations = [
    {
      type: "similar_business",
      title: "Similar Government Contractors",
      items: ["Advanced Engineering Solutions", "Strategic Defense Partners", "Federal Healthcare Associates"]
    },
    {
      type: "opportunity_match",
      title: "Matching Opportunities",
      items: ["DOD Construction Contract - $2.5M", "VA Healthcare Services - $1.2M", "GSA IT Modernization - $3.8M"]
    }
  ];

  return { results: filteredResults, recommendations, total: filteredResults.length };
}

export async function handleExportRtm(complianceData, res) {
  if (!complianceData || !Array.isArray(complianceData)) {
    throw new Error("Missing or invalid complianceData");
  }

  const bridgePath = join(__dirname, "../../rfp-engine/utils/export_bridge.py");
  const pythonProcess = spawn("python3", [bridgePath]);

  let excelBuffer = [];
  let errorOutput = "";

  pythonProcess.stdin.write(JSON.stringify(complianceData));
  pythonProcess.stdin.end();

  pythonProcess.stdout.on("data", (data) => excelBuffer.push(data));
  pythonProcess.stderr.on("data", (data) => errorOutput += data.toString());

  return new Promise((resolve, reject) => {
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("[LEGACY_SERVICE] Export failed:", errorOutput);
        return reject(new Error("Excel generation failed"));
      }
      const finalBuffer = Buffer.concat(excelBuffer);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=Compliance_Matrix.xlsx");
      res.send(finalBuffer);
      resolve();
    });
  });
}

export async function handleCompareAmendments(baseText, newText) {
  const comparePrompt = `You are the ARIS Delta Engine. Compare these two versions of an RFP (Original vs Amendment).
Identify ONLY the changes that impact Section L (Instructions) or Section M (Evaluation).

Structure:
1. SUMMARY: High-level changes (e.g., "Extension of due date", "New certification requirement").
2. DELTA MATRIX: 
   | Requirement | Change Type | Impact | Citation |
   |---|---|---|---|
   | [Requirement] | [ADDED/REMOVED/MODIFIED] | [High/Med/Low] | [Section] |

Input:
--- ORIGINAL ---
${baseText.slice(0, 5000)}
--- AMENDMENT ---
${newText.slice(0, 5000)}`;

  // Use the new v2.1 tracing for these audits
  return await traceLLM(null, {
    model: "claude-3-5-sonnet",
    messages: [
      { role: "system", content: "You are a federal auditor specialized in amendment diffing." },
      { role: "user", content: comparePrompt }
    ]
  }, "amendment_delta_engine");
}
