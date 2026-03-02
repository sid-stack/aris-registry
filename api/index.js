import express from "express";
import cors from "cors";
import multer from "multer";
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

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
console.log(`[INIT] OPENROUTER_API_KEY: ${OPENROUTER_KEY ? 'SET (' + OPENROUTER_KEY.substring(0, 20) + '...)' : 'NOT SET'}`);

app.get("/api/health", (_, res) => res.json({ status: "ok", version: "3.0.0" }));

app.post("/api/generate", upload.single("rfp"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
    if (!req.body.companyProfile) return res.status(400).json({ error: "No company profile provided" });

    console.log(`[/api/generate] Processing PDF: ${req.file.originalname}`);
    
    const response = await fetch("https://openrouter.ai/api/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "ARIS",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        max_tokens: 2048,
        system: SYS_PROMPT,
        messages: [
          {
            role: "user",
            content: `Company Profile: ${req.body.companyProfile}\n\nGenerate a federal proposal draft.`
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "OpenRouter API error");

    const proposal = data.content?.[0]?.text || "No proposal generated";
    res.json({ proposal, metadata: {}, score: {} });
  } catch (err) {
    console.error("[ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ARIS v3 → http://localhost:${PORT}`);
  console.log(`   Pipeline: Intent → Extract → Validate → Score`);
});
