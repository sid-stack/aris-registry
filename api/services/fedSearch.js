import { vectorIndex, redis } from "../utils/upstash.js";

/**
 * 🚢 Sovereign Discovery Table V6 (Distributed Row Architecture)
 * Matches Google's sharded search protocols using atomic KV rows.
 * Architecture: Distributed Inverted Index (Redis Sets) + Hash Document Store.
 */
export class FedSearchEngine {
  constructor() {
    this.localCache = new Map(); // Fast read-through cache
    this.stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was"]);
  }

  /**
   * 🚨 THE SINGLE WRITER (ATOMIC)
   * Distributed Row population. Scalable to millions of records.
   */
  async syncSovereignTable(opportunities, region = "US") {
    if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) return;
    if (!redis) return;

    const pipeline = redis.pipeline();
    let addedCount = 0;

    for (const opt of opportunities) {
       const docId = opt.noticeId || opt.id || opt["Award ID"] || opt.pageid;
       const docData = this.normalizeDoc(opt, region);
       
       // 1. Store Document Metadata (Atomic Hash)
       pipeline.hset("aris:mesh:docs", { [docId]: JSON.stringify(docData) });
       
       // 2. Update Inverted Index (Distributed Sets)
       const terms = this.tokenize(`${docData.title} ${opt.description || opt.extract || ""} ${docData.agency}`);
       for (const term of terms) {
         pipeline.sadd(`aris:mesh:term:${term}`, docId);
       }
       
       addedCount++;
    }

    try {
      await pipeline.exec();
      console.log(`🛡️ [TABLE] Bigtable Sync: +${addedCount} distributed rows.`);
      
      // Update Vector Mesh (Sync)
      if (vectorIndex) {
        await vectorIndex.upsert(opportunities.slice(0, 50).map(o => ({
          id: `opt:${o.noticeId || o.id}`,
          metadata: this.normalizeDoc(o, region)
        })));
      }
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
   * High-performance Boolean retrieval across distributed sets.
   */
  async search(query, expand = false) {
    const results = new Map();
    const queryTerms = this.tokenize(query);
    
    if (queryTerms.length > 0 && redis) {
       try {
         // Perform SINTER in Redis for exact keyword intersection (Google precision)
         const termKeys = queryTerms.map(t => `aris:mesh:term:${t}`);
         const matchedIds = await redis.sinter(...termKeys);
         
         if (matchedIds?.length > 0) {
           const docs = await redis.hmget("aris:mesh:docs", ...matchedIds.slice(0, 50));
           docs.forEach((docStr, i) => {
             if (docStr) {
                const doc = typeof docStr === 'string' ? JSON.parse(docStr) : docStr;
                results.set(matchedIds[i], { ...doc, score: 1.0, matchType: 'keyword_mesh' });
             }
           });
         }
       } catch (err) { console.warn("🛡️ [SEARCH] Distributed Mesh Bypass:", err.message); }
    }

    // Semantic Fallback
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

    return Array.from(results.values()).sort((a,b) => b.score - a.score);
  }

  /**
   * Enriches the mesh with general intelligence
   */
  async ingestWikipedia(term) {
    if (!redis) return;
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
    const allDocs = await redis.hvals("aris:mesh:docs");
    return allDocs.map(d => typeof d === 'string' ? JSON.parse(d) : d);
  }

  async getStats() {
    if (!redis) return { tableRows: 0, status: "Offline" };
    const count = await redis.hlen("aris:mesh:docs");
    return { tableRows: count, status: "Operational", architecture: "Distributed_Row" };
  }

  /**
   * Stub for Supabase integration when keys are provided
   */
  isActiveSupabase() {
    return !!process.env.SUPABASE_KEY;
  }
}

export const sovereignSearch = new FedSearchEngine();
