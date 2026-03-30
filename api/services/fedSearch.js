import { vectorIndex, redis } from "../utils/upstash.js";
import { usaspending } from "./usaspending.js";
import OpenAI from "openai";

const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: { "HTTP-Referer": "https://bidsmith.pro", "X-Title": "ARIS Sovereign Discovery" }
}) : null;

/**
 * Sovereign Intelligence V7 (The Knowledge Architecture)
 * Features:
 * 1. Distributed Inverted Index (Union-based, not intersection)
 * 2. Knowledge Graph / Ontology Mesh
 * 3. PageRank-inspired Authority Reranking
 * 4. Live USAspending fallback when mesh is empty
 */
export class FedSearchEngine {
  constructor() {
    this.stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was", "is"]);

    // SOVEREIGN ONTOLOGY (Knowledge Graph)
    this.ontology = {
      "artificial intelligence": ["machine learning", "neural networks", "llm", "generative ai", "darpa", "nsf"],
      "cybersecurity": ["zero trust", "threat intelligence", "nist", "cisa", "encryption"],
      "oil": ["petroleum", "energy security", "offshore", "doe", "fossil fuels"],
      "land": ["real estate", "infrastructure", "military base", "blm", "gsa"],
      "defense": ["weaponry", "uav", "tactical", "c4isr", "navy", "army", "air force", "dod"]
    };
  }

  /**
   * Strategic Query Expansion (Ontology-first, LLM fallback)
   */
  async expandQuery(query) {
    const q = query.toLowerCase();
    let terms = [];

    for (const [parent, kids] of Object.entries(this.ontology)) {
      if (q.includes(parent)) terms.push(...kids);
    }

    if (openai && terms.length < 3) {
      try {
        const response = await openai.chat.completions.create({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: "You are a Federal Capture Strategist. Expand the query into 5 procurement-grade synonyms. Return ONLY the terms, space-separated." },
            { role: "user", content: `Query: ${query}` }
          ],
          temperature: 0.1
        });
        const aiTerms = response.choices[0].message.content.trim().split(/\s+/);
        terms.push(...aiTerms);
      } catch (err) {
        console.warn("[SEARCH] LLM query expansion failed:", err.message);
      }
    }

    return Array.from(new Set([query, ...terms])).join(" ");
  }

  /**
   * THE SINGLE WRITER (append-only, deduplicated)
   */
  async syncSovereignTable(opportunities, region = "US") {
    if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) return;
    if (!redis) return;

    try {
      const pipeline = redis.pipeline();
      let addedCount = 0;

      for (const opt of opportunities) {
        const docId = opt.noticeId || opt.id || opt["Award ID"] || opt.pageid;
        if (!docId) continue;

        const docData = this.normalizeDoc(opt, region);

        // Atomic deduplication: only write if new
        pipeline.hsetnx("aris:mesh:docs", docId, JSON.stringify(docData));

        const terms = this.tokenize(`${docData.title} ${docData.agency}`);
        for (const term of terms) {
          pipeline.sadd(`aris:mesh:term:${term}`, docId);
        }
        addedCount++;
      }

      await pipeline.exec();

      // Vector upsert: include `data` field so Upstash auto-embeds the text
      if (vectorIndex && addedCount > 0) {
        await vectorIndex.upsert(opportunities.slice(0, 50).map(o => {
          const doc = this.normalizeDoc(o, region);
          return {
            id: `opt:${o.noticeId || o.id}`,
            data: `${doc.title} ${doc.agency}`,
            metadata: doc
          };
        }));
      }
    } catch (err) {
      console.error("[V7] Sync failed:", err.message);
    }
  }

  /**
   * SOVEREIGN RERANKER (PageRank-style authority + recency scoring)
   */
  rankResults(results) {
    const now = new Date();
    const highAuthorityAgencies = new Set(["darpa", "dod", "dhs", "nsa", "doe", "army", "navy", "air force"]);

    return results.map(r => {
      let authorityScore = 1.0;

      const agencyNorm = (r.agency || "").toLowerCase();
      if (highAuthorityAgencies.has(agencyNorm)) authorityScore += 0.5;

      const postDate = new Date(r.postedDate);
      const daysOld = (now - postDate) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - (daysOld / 365));

      const finalScore = ((r.score || 0.5) * 0.4) + (authorityScore * 0.3) + (recencyScore * 0.3);
      return { ...r, authorityScore: finalScore };
    }).sort((a, b) => b.authorityScore - a.authorityScore);
  }

  /**
   * Levenshtein distance between two strings (iterative, O(n*m))
   */
  levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  /**
   * Fuzzy spell correction for GovCon queries
   * Returns { corrected: string, wasChanged: boolean, original: string }
   */
  async polishQuery(query) {
    const GOVCON_DICT = [
      "dfars", "far", "cmmc", "naics", "solicitation", "compliance", "cybersecurity",
      "procurement", "contract", "proposal", "acquisition", "defense", "federal",
      "agency", "award", "opportunity", "pentagon", "dod", "darpa", "nsa", "dhs",
      "doe", "navy", "army", "air force", "classified", "setaside", "sbir", "sttr", "lpta",
      "bestvalue", "rfp", "rfi", "sources", "sought", "synopsis", "amendment",
      "modification", "protest", "debarment", "suspension", "certification",
      "representation", "subcontract", "teaming", "incumbent", "recompete",
      "capture", "pwin", "cwp", "pwscope", "sow", "soo", "performance",
      "logistics", "intelligence", "cloud", "artificial", "intelligence", "infrastructure"
    ];

    const tokens = query.trim().toLowerCase().split(/\s+/);
    let preliminaryCorrected = tokens.map(token => {
      if (GOVCON_DICT.includes(token)) return token;
      if (token.length <= 2) return token;

      let bestMatch = token;
      let bestDist = 3; // Max distance
      for (const word of GOVCON_DICT) {
        const dist = this.levenshtein(token, word);
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = word;
        }
      }
      return bestMatch;
    }).join(" ");

    // If preliminary failed to change significantly or we have OpenAI, use LLM to fix intent
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: "Correct typos and formalize this federal procurement search query. Return ONLY the corrected text. If it is already correct, return it as is." },
            { role: "user", content: `Query: ${query}` }
          ],
          temperature: 0,
          max_tokens: 100
        });
        const aiCorrected = response.choices[0].message.content.trim().replace(/^"|"$/g, '');
        if (aiCorrected) return { corrected: aiCorrected, wasChanged: true, original: query };
      } catch (err) {
        console.warn("[SEARCH] LLM spell correction failed:", err.message);
      }
    }

    return { corrected: preliminaryCorrected, wasChanged: preliminaryCorrected !== query.toLowerCase(), original: query };
  }

  async search(query, expand = false) {
    // Apply fuzzy spell correction and intent polishing
    const correctionResult = await this.polishQuery(query);
    const effectiveQuery = correctionResult.corrected;

    const results = new Map();
    let queryForExpansion = effectiveQuery;

    if (expand) queryForExpansion = await this.expandQuery(effectiveQuery);
    const queryTerms = this.tokenize(queryForExpansion);

    // Layer 1: Redis inverted index
    if (queryTerms.length > 0 && redis) {
      try {
        const termKeys = queryTerms.map(t => `aris:mesh:term:${t}`);
        const matchedIds = termKeys.length === 1
          ? await redis.smembers(termKeys[0])
          : await redis.sunion(...termKeys.slice(0, 10));

        if (matchedIds?.length > 0) {
          const docs = await redis.hmget("aris:mesh:docs", ...matchedIds.slice(0, 50));
          docs.forEach((docStr, i) => {
            if (docStr) {
              const doc = typeof docStr === "string" ? JSON.parse(docStr) : docStr;
              results.set(matchedIds[i], { ...doc, score: 1.0, matchType: "keyword_mesh" });
            }
          });
        }
      } catch (err) {
        console.warn("[SEARCH] Redis mesh query failed:", err.message);
      }
    }

    // Layer 2: Vector semantic search (Use POLISHED query)
    if (vectorIndex) {
      try {
        const semanticMatches = await vectorIndex.query({ data: effectiveQuery, topK: 20, includeMetadata: true });
        semanticMatches.forEach(match => {
          const id = match.id.replace("opt:", "");
          if (!results.has(id)) {
            results.set(id, { id, ...match.metadata, score: match.score, matchType: "semantic" });
          } else {
            results.get(id).score += match.score;
          }
        });
      } catch (err) {
        console.warn("[SEARCH] Vector query failed:", err.message);
      }
    }

    // Layer 3: Live USAspending fallback (Use POLISHED query)
    if (results.size === 0) {
      try {
        const awards = await usaspending.getAwardsSummary(effectiveQuery);
        awards.forEach(a => {
          const id = a["Award ID"] || `award:${Math.random().toString(36).slice(2, 7)}`;
          if (!results.has(id)) {
            results.set(id, {
              id,
              title: `${a["Recipient Name"]} — ${a["Awarding Agency"]}`,
              agency: a["Awarding Agency"] || "Federal Agency",
              postedDate: a["Start Date"] || new Date().toISOString().split("T")[0],
              region: "US",
              url: "",
              score: 0.5,
              matchType: "award_fallback"
            });
          }
        });
      } catch (err) {
        console.warn("[SEARCH] USAspending fallback failed:", err.message);
      }
    }

    return { results: this.rankResults(Array.from(results.values())), correction: correctionResult };
  }

  normalizeDoc(opt, region) {
    const docId = opt.noticeId || opt.id || opt["Award ID"] || opt.pageid || `gen:${Math.random().toString(36).slice(2, 9)}`;
    const isAward = !!(opt["Award ID"] || opt["Award Amount"]);
    return {
      id: docId,
      title: opt.title || opt["Award ID"] || "Federal Opportunity",
      agency: opt.agency || opt.organization || opt["Awarding Agency"] || "Federal Agency",
      postedDate: opt.postedDate || opt.publishDate || opt["Start Date"] || new Date().toISOString().split("T")[0],
      region: region || "US",
      url: opt.url || (opt.noticeId ? `https://sam.gov/opp/${docId}/view` : ""),
      // Preserve award-specific fields for rich snippets
      recipient: opt["Recipient Name"] || opt.recipient || null,
      amount: opt["Award Amount"] || opt.amount || null,
      description: opt.description || opt.synopsis || null,
      matchType: isAward ? "award_fallback" : (opt.matchType || "keyword_mesh"),
    };
  }

  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(word => word.length >= 2 && !this.stopWords.has(word));
  }

  getTableData(password) {
    if (!password || password !== process.env.ADMIN_PASSWORD) throw new Error("UNAUTHORIZED");
    if (!redis) throw new Error("REDIS_UNAVAILABLE");
    return redis.hvals("aris:mesh:docs").then(all => all.map(d => typeof d === "string" ? JSON.parse(d) : d));
  }

  getStats() {
    if (!redis) return Promise.resolve({ tableRows: 0, status: "Redis_Unconfigured", architecture: "Sovereign_V7_Mesh" });
    return redis.hlen("aris:mesh:docs").then(count => ({
      tableRows: count,
      status: "Operational",
      architecture: "Sovereign_V7_Mesh"
    }));
  }
}

export const sovereignSearch = new FedSearchEngine();
