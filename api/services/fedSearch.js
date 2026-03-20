import { vectorIndex, redis } from "../utils/upstash.js";
import OpenAI from "openai";

const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: { "HTTP-Referer": "https://bidsmith.pro", "X-Title": "ARIS Sovereign Discovery" }
}) : null;

/**
 * 🚢 Sovereign Intelligence V7 (The Knowledge Architecture)
 * Features: 
 * 1. Distributed Inverted Index (Dictionary-style)
 * 2. Knowledge Graph / Ontology Mesh
 * 3. PageRank-inspired Authority Reranking
 * 4. In-place Atomic Deduplication
 */
export class FedSearchEngine {
  constructor() {
    this.stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was", "is"]);
    
    // 🧠 SOVEREIGN ONTOLOGY (Knowledge Graph)
    // Maps core sectors to semantic descendants and related agencies.
    this.ontology = {
      "artificial intelligence": ["machine learning", "neural networks", "llm", "cv", "generative ai", "darpa", "nsf"],
      "cybersecurity": ["zero trust", "threat intelligence", "nist", "cisa", "encryption", "offensive cyber"],
      "oil": ["petroleum", "energy security", "offshore", "renewable energy", "doe", "fossil fuels"],
      "land": ["real estate", "infrastructure", "military base", "territorial", "blm", "gsa"],
      "defense": ["weaponry", "uav", "tactical", "c4isr", "navy", "army", "air force", "dod"]
    };
  }

  /**
   * 🦅 Strategic Query Expansion (V7: Ontology-First)
   */
  async expandQuery(query, region = "US") {
    const q = query.toLowerCase();
    let ontologicalterms = [];
    
    // Layer 1: Knowledge Graph Lookup (Zero-Latency)
    for (const [parent, kids] of Object.entries(this.ontology)) {
      if (q.includes(parent)) ontologicalterms.push(...kids);
    }

    // Layer 2: LLM Strategic Expansion (High-Intent)
    if (openai && ontologicalterms.length < 3) {
      try {
        const response = await openai.chat.completions.create({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: "You are a Federal Capture Strategists. Expand the query into 5 procurement-grade synonyms. ONLY the terms." },
            { role: "user", content: `Query: ${query}` }
          ],
          temperature: 0.1
        });
        const aiTerms = response.choices[0].message.content.trim().split(/\s+/);
        ontologicalterms.push(...aiTerms);
      } catch (err) { /* Silent fallback */ }
    }

    return Array.from(new Set([query, ...ontologicalterms])).join(" ");
  }

  /**
   * 🚨 THE SINGLE WRITER (APPEND-ONLY & DEDUPLICATED)
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
         
         // 🛡️ ATOMIC DEDUPLICATION: Sync to Hash only if NEW
         pipeline.hsetnx("aris:mesh:docs", docId, JSON.stringify(docData));
         
         const terms = this.tokenize(`${docData.title} ${opt.agency} ${opt.description || ""}`);
         for (const term of terms) {
           pipeline.sadd(`aris:mesh:term:${term}`, docId);
         }
         addedCount++;
      }

      await pipeline.exec();
      
      if (vectorIndex && addedCount > 0) {
        await vectorIndex.upsert(opportunities.slice(0, 50).map(o => ({
          id: `opt:${o.noticeId || o.id}`,
          metadata: this.normalizeDoc(o, region)
        })));
      }
    } catch (err) { console.error("🛡️ [V7] Sync Fail:", err.message); }
  }

  /**
   * 🔍 SOVEREIGN RERANKER (PageRank-style Authority Scoring)
   * Weights: Recency (40%), Agency Authority (30%), Semantic Depth (30%)
   */
  rankResults(results) {
    const now = new Date();
    const highAuthorityAgencies = new Set(["darpa", "dod", "dhs", "nsa", "doe", "army", "navy", "air force"]);

    return results.map(r => {
      let authorityScore = 1.0;
      
      // 1. Agency Authority (PageRank)
      const agencyNorm = (r.agency || "").toLowerCase();
      if (highAuthorityAgencies.has(agencyNorm)) authorityScore += 0.5;

      // 2. Recency Decay
      const postDate = new Date(r.postedDate);
      const daysOld = (now - postDate) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 1 - (daysOld / 365)); // 1.0 if today, 0 if > 1 year

      // 3. Final Composite Score
      const finalScore = (r.score * 0.4) + (authorityScore * 0.3) + (recencyScore * 0.3);
      
      return { ...r, authorityScore: finalScore };
    }).sort((a, b) => b.authorityScore - a.authorityScore);
  }

  async search(query, expand = false, region = "US") {
    const results = new Map();
    let finalQuery = query;

    if (expand) finalQuery = await this.expandQuery(query, region);
    const queryTerms = this.tokenize(finalQuery);
    
    if (queryTerms.length > 0 && redis) {
       try {
         const termKeys = queryTerms.map(t => `aris:mesh:term:${t}`);
         const matchedIds = await redis.sinter(...termKeys.slice(0, 10));
         
         if (matchedIds?.length > 0) {
           const docs = await redis.hmget("aris:mesh:docs", ...matchedIds.slice(0, 50));
           docs.forEach((docStr, i) => {
             if (docStr) {
                const doc = typeof docStr === 'string' ? JSON.parse(docStr) : docStr;
                results.set(matchedIds[i], { ...doc, score: 1.0, matchType: 'keyword_mesh' });
             }
           });
         }
       } catch (err) { /* silent */ }
    }

    if (vectorIndex) {
      try {
        const semanticMatches = await vectorIndex.query({ data: query, topK: 20, includeMetadata: true });
        semanticMatches.forEach(match => {
          const id = match.id.replace('opt:', '');
          if (!results.has(id)) {
            results.set(id, { id, ...match.metadata, score: match.score, matchType: 'semantic' });
          } else { results.get(id).score += match.score; }
        });
      } catch (err) { /* silent */ }
    }

    // V7: Apply PageRank-inspired Reranking
    const finalResults = this.rankResults(Array.from(results.values()));
    return finalResults;
  }

  normalizeDoc(opt, region) {
    const docId = opt.noticeId || opt.id || opt["Award ID"] || opt.pageid || `gen:${Math.random().toString(36).slice(2, 9)}`;
    return {
      id: docId,
      title: opt.title || opt["Award ID"] || "Sovereign Intelligence",
      agency: opt.agency || opt.organization || opt["Awarding Agency"] || "Federal Agency",
      postedDate: opt.postedDate || opt.publishDate || opt["Start Date"] || new Date().toISOString().split('T')[0],
      region: region || "US",
      url: opt.url || (opt.noticeId ? `https://sam.gov/opp/${docId}/view` : "")
    };
  }

  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(word => word.length >= 2 && !this.stopWords.has(word));
  }

  async ingestWikipedia(term) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();
      await this.syncSovereignTable([{
        id: `wiki:${data.pageid}`,
        title: data.title,
        agency: "Wikipedia (Global Intelligence)",
        description: data.extract,
        url: data.content_urls?.desktop?.page,
        pageid: data.pageid
      }], "GLOBAL");
    } catch (err) { return false; }
  }

  getTableData(password) {
    if (password !== "aris3690") throw new Error("UNAUTHORIZED");
    return redis.hvals("aris:mesh:docs").then(all => all.map(d => typeof d === 'string' ? JSON.parse(d) : d));
  }

  getStats() {
    return redis.hlen("aris:mesh:docs").then(count => ({
      tableRows: count,
      status: "Operational",
      architecture: "Sovereign_V7_Mesh"
    }));
  }
}

export const sovereignSearch = new FedSearchEngine();
