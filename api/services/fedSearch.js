import { vectorIndex, redis } from "../utils/upstash.js";
import OpenAI from "openai";

// Optional: Strategy Reasoning Engine (Beating Perplexity)
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: { "HTTP-Referer": "https://bidsmith.pro", "X-Title": "ARIS Sovereign Discovery" }
}) : null;

/**
 * 🚢 Sovereign Discovery Table V6.1 (Strategy Reasoning Engine)
 * Matches Google's sharded search protocols with Perplexity-grade reasoning.
 * Architecture: Distributed Inverted Index (Redis Sets) + Hash Document Store.
 */
export class FedSearchEngine {
  constructor() {
    this.stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was"]);
  }

  /**
   * 🦅 Strategic Query Expansion
   * Generates high-intent synonyms to beat standard search recall.
   */
  async expandQuery(query, region = "US") {
    if (!openai) return query;
    try {
      const response = await openai.chat.completions.create({
        model: "google/gemini-2.0-flash:free",
        messages: [
          { role: "system", content: "You are a Federal Capture Strategist. Expand the search query into 5 high-intent synonyms or related procurement terms. Output ONLY the space-separated terms. Focus on Defense, Energy, and Cyber." },
          { role: "user", content: `Query: ${query}` }
        ],
        temperature: 0.1
      });
      const expanded = response.choices[0].message.content.trim();
      return `${query} ${expanded}`;
    } catch (err) {
      console.warn("[SEARCH] Expansion bypass:", err.message);
      return query;
    }
  }

  /**
   * 🚨 THE SINGLE WRITER (ATOMIC)
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
         
         // 1. Store Document Metadata
         pipeline.hset("aris:mesh:docs", { [docId]: JSON.stringify(docData) });
         
         // 2. Update Inverted Index
         const terms = this.tokenize(`${docData.title} ${opt.description || opt.extract || ""} ${docData.agency}`);
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
      
      console.log(`🛡️ [TABLE] Bigtable Sync Complete. Rows: ${addedCount}`);
    } catch (err) {
      console.error("🛡️ [TABLE] Distributed Sync Fail:", err.message);
    }
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

  /**
   * 🔍 READ-ONLY SEARCH (SINTER)
   */
  async search(query, expand = false, region = "US") {
    const results = new Map();
    let finalQuery = query;

    if (expand) {
      finalQuery = await this.expandQuery(query, region);
    }

    const queryTerms = this.tokenize(finalQuery);
    
    if (queryTerms.length > 0 && redis) {
       try {
         const termKeys = queryTerms.map(t => `aris:mesh:term:${t}`);
         // Only intersect if we have a reasonable number of terms to avoid overhead
         const keysToIntersect = termKeys.slice(0, 5);
         const matchedIds = await redis.sinter(...keysToIntersect);
         
         if (matchedIds?.length > 0) {
           const docs = await redis.hmget("aris:mesh:docs", ...matchedIds.slice(0, 40));
           docs.forEach((docStr, i) => {
             if (docStr) {
                const doc = typeof docStr === 'string' ? JSON.parse(docStr) : docStr;
                results.set(matchedIds[i], { ...doc, score: 1.0, matchType: 'keyword_mesh' });
             }
           });
         }
       } catch (err) { console.warn("🛡️ [SEARCH] Mesh Bypass:", err.message); }
    }

    // Semantic Fallback (Upstash Vector)
    if (vectorIndex) {
      try {
        const semanticMatches = await vectorIndex.query({ data: query, topK: 20, includeMetadata: true });
        semanticMatches.forEach(match => {
          const id = match.id.replace('opt:', '');
          if (!results.has(id)) {
            results.set(id, { id, ...match.metadata, score: match.score, matchType: 'semantic' });
          } else { results.get(id).score += match.score; }
        });
      } catch (err) { /* silent fallback */ }
    }

    return Array.from(results.values()).sort((a,b) => b.score - a.score);
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

  async getTableData(password) {
    if (password !== "aris3690") throw new Error("UNAUTHORIZED");
    if (!redis) return [];
    try {
      const allDocs = await redis.hvals("aris:mesh:docs");
      return allDocs.map(d => typeof d === 'string' ? JSON.parse(d) : d);
    } catch (err) { return []; }
  }

  async getStats() {
    if (!redis) return { tableRows: 0, status: "Offline" };
    try {
      const count = await redis.hlen("aris:mesh:docs");
      return { tableRows: count, status: "Operational", architecture: "Distributed_Row_v6" };
    } catch (err) { return { status: "Error", message: err.message }; }
  }
}

export const sovereignSearch = new FedSearchEngine();
