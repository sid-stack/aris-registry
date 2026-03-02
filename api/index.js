import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { classifyIntent } from "./middleware/intent.js";
import { enrichFARClauses } from "./middleware/gatekeeper.js";
import { extractMetadata } from "./middleware/extractor.js";
import { computeScore } from "./middleware/scorer.js";

const __dirname   = dirname(fileURLToPath(import.meta.url));
const PROMPTS     = join(__dirname, "llm");
const SYS_PROMPT  = readFileSync(join(PROMPTS, "system_prompt.txt"), "utf8").trim();
const EXT_PROMPT  = readFileSync(join(PROMPTS, "extract_prompt.txt"), "utf8").trim();
const VAL_PROMPT  = readFileSync(join(PROMPTS, "validate_prompt.txt"), "utf8").trim();

const app  = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
app.use(cors({
  origin: ['https://www.bidsmith.pro', 'https://bidsmith.pro', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, f, cb) => f.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("PDF only")),
});

function makeClient() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");
  return new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: key, defaultHeaders: { "HTTP-Referer": "http://localhost:5173", "X-Title": "ARIS" } });
}

app.get("/api/health", (_, res) => res.json({ status: "ok", version: "3.0.0" }));

app.post("/api/generate", upload.single("rfp"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
    if (!req.body.companyProfile) return res.status(400).json({ error: "No company profile provided" });

    const intent = await classifyIntent(req.body.companyProfile);
    const enriched = await enrichFARClauses(req.file.buffer);
    const metadata = await extractMetadata(req.file.buffer);
    const score = await computeScore(metadata);

    const client = makeClient();
    const response = await client.messages.create({
      model: "google/gemini-2.0-flash-001",
      max_tokens: 2048,
      system: SYS_PROMPT,
      messages: [
        {
          role: "user",
          content: `Company Profile: ${req.body.companyProfile}\n\nRFP Analysis:\n${enriched}\n\nGenerate proposal section.`
        }
      ]
    });

    const proposal = response.content[0].type === "text" ? response.content[0].text : "";
    res.json({ proposal, metadata, score });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ARIS v3 → http://localhost:${PORT}`);
  console.log(`   Pipeline: Intent → Extract → Validate → Score`);
});
