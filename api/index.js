import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname   = dirname(fileURLToPath(import.meta.url));
const PROMPTS     = join(__dirname, "llm");
const SYS_PROMPT  = readFileSync(join(PROMPTS, "system_prompt.txt"), "utf8").trim();

const app  = express();
const PORT = process.env.PORT || 8080;

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

const key = process.env.OPENROUTER_API_KEY;
console.log(`[INIT] OPENROUTER_API_KEY: ${key ? 'SET (' + key.substring(0, 20) + '...)' : 'NOT SET'}`);

const client = new OpenAI({ 
  baseURL: "https://openrouter.ai/api/v1", 
  apiKey: key,
  defaultHeaders: { 
    "HTTP-Referer": "http://localhost:5173", 
    "X-Title": "ARIS" 
  } 
});

app.get("/api/health", (_, res) => res.json({ status: "ok", version: "3.0.0" }));

app.post("/api/generate", upload.single("rfp"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
    if (!req.body.companyProfile) return res.status(400).json({ error: "No company profile provided" });

    console.log(`[/api/generate] Processing PDF: ${req.file.originalname}`);
    
    const response = await client.messages.create({
      model: "google/gemini-2.0-flash-001",
      max_tokens: 2048,
      system: SYS_PROMPT,
      messages: [
        {
          role: "user",
          content: `Company Profile: ${req.body.companyProfile}\n\nGenerate a federal proposal draft.`
        }
      ]
    });

    const proposal = response.content[0].type === "text" ? response.content[0].text : "";
    res.json({ proposal, metadata: {}, score: {} });
  } catch (err) {
    console.error("[ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ARIS v3 → http://localhost:${PORT}`);
  console.log(`   Pipeline: Intent → Extract → Validate → Score`);
});
