import { indexGlobalOpportunities, vectorIndex, redis } from "../utils/upstash.js";
import { complete } from "./intelligence.js";

/**
 * 🚢 Sovereign Fed Search Engine V4.3 (Seed-Layered Mesh)
 * Advanced 情報検索 (IR) for Federal Discovery.
 * Combines a hardcoded Safety-Net, Persistent Redis Archive, and Vector RAG.
 */
export class FedSearchEngine {
  constructor() {
    this.index = new Map(); // Term -> Set(DocID)
    this.docStore = new Map(); // DocID -> Metadata
    this.stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was"]);
    this.isLoaded = false;

    // 🛡️ [SAFETY_NET] Baseline Sovereign Seeds (US Sector)
    // Ensures ARIS is NEVER empty on first load.
    this.primeSafetyNet();
  }

  primeSafetyNet() {
    const seeds = [
      { id: "AID-2026-001", title: "Artificial Intelligence for Battlefield Readiness", agency: "Army Futures Command", postedDate: "2026-03-10", region: "US", url: "https://sam.gov/opp/ai-battlefield/view", description: "Generative AI and Large Language Model integration for tactical edge computing." },
      { id: "AID-2026-002", title: "Unmanned Aerial Systems (UAV) Detection Mesh", agency: "Department of Homeland Security", postedDate: "2026-03-12", region: "US", url: "https://sam.gov/opp/drone-mesh/view", description: "Distributed sensor networks for counter-UAS operations in urban environments." },
      { id: "AID-2026-003", title: "Zero Trust Cybersecurity Framework Implementation", agency: "Defense Information Systems Agency (DISA)", postedDate: "2026-03-15", region: "US", url: "https://sam.gov/opp/zero-trust/view", description: "Migration of legacy systems to a NIST 800-207 compliant identity-centric mesh." },
      { id: "AID-2026-004", title: "Cloud Native Modernization for USAF Logistics", agency: "Department of the Air Force", postedDate: "2026-03-18", region: "US", url: "https://sam.gov/opp/usaf-cloud/view", description: "Vedere-style cloud engineering for global air logistics and supply chain resilience." }
    ];

    seeds.forEach(s => this.ingestedInternal(s));
    console.log(`🛡️ [MESH] Safety Net Primed: ${this.docStore.size} core seeds active.`);
  }

  /**
   * Internal ingestion logic for memory-resident index
   */
  ingestedInternal(opt, region = "US") {
    const docId = opt.noticeId || opt.id || opt.tenderId || opt["Award ID"];
    const title = opt.title || opt["Award ID"] || "Sovereign Opportunity";
    const agency = opt.agency || opt.organization || opt["Awarding Agency"] || "Federal Agency";
    const postedDate = opt.postedDate || opt.publishDate || opt["Start Date"] || new Date().toISOString().split('T')[0];
    
    const content = `${title} ${opt.description || ""} ${agency}`.toLowerCase();
    const terms = this.tokenize(content);

    this.docStore.set(docId, {
      id: docId,
      title,
      agency,
      postedDate,
      region,
      url: opt.url || (opt.noticeId ? `https://sam.gov/opp/${docId}/view` : "")
    });

    for (const term of terms) {
      if (!this.index.has(term)) this.index.set(term, new Set());
      this.index.get(term).add(docId);
    }
  }

  async loadFromArchive() {
    if (!redis) return;
    try {
      console.log("🚢 [ARCHIVE] Restoring Inverted Index from Sovereign Mesh...");
      const snapshot = await redis.get("aris:mesh:docstore:v1");
      if (snapshot) {
        // Handle both string and object return from different Redis clients/versions
        const docs = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
        if (Array.isArray(docs)) {
          console.log(`🚢 [ARCHIVE] Restore Data Detected: ${docs.length} items.`);
          for (const d of docs) {
            this.ingestedInternal(d);
          }
          this.isLoaded = true;
          console.log(`🚢 [ARCHIVE] Operational. Mesh Total: ${this.docStore.size} documents.`);
        }
      }
    } catch (err) {
      console.error("🚢 [ARCHIVE] Load Failed:", err.message);
    }
  }

  async persistToArchive() {
    if (!redis) return;
    try {
      const data = Array.from(this.docStore.values());
      if (data.length > 0) {
        await redis.set("aris:mesh:docstore:v1", JSON.stringify(data));
        await redis.expire("aris:mesh:docstore:v1", 30 * 24 * 60 * 60);
      }
    } catch (err) {
      console.error("🚢 [ARCHIVE] Persist Failed:", err.message);
    }
  }

  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(word => word.length >= 2 && !this.stopWords.has(word));
  }

  async ingest(opportunities, region = "US", syncToVector = true) {
    if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) return;
    
    for (const opt of opportunities) {
      this.ingestedInternal(opt, region);
    }

    if (syncToVector && vectorIndex) {
      try {
        await indexGlobalOpportunities(opportunities.map(o => ({ ...o, region })));
      } catch (err) {
        console.error(`[FED_SEARCH] [${region}] Vector Ingestion Failed:`, err.message);
      }
    }

    if (syncToVector) await this.persistToArchive();
  }

  async search(query, expand = false, region = "US") {
    // If we have 0 records (besides seeds) and haven't loaded yet, try one load
    if (this.docStore.size <= 4 && !this.isLoaded) {
      await this.loadFromArchive();
    }

    const results = new Map();
    let finalQuery = query;

    if (expand) finalQuery = await this.expandQuery(query, region);

    // 1. Keyword Precision
    this.searchKeywords(finalQuery).forEach(res => {
      results.set(res.id, { ...res, score: 1.0, matchType: 'keyword' });
    });

    // 2. Semantic Broadness
    if (vectorIndex) {
      try {
        const semanticMatches = await vectorIndex.query({ data: finalQuery, topK: 15, includeMetadata: true });
        semanticMatches.forEach(match => {
          const id = match.id.replace('opt:', '');
          if (!results.has(id)) {
            results.set(id, {
              id,
              title: match.metadata.title,
              agency: match.metadata.agency || match.metadata.organization,
              postedDate: match.metadata.postedDate || match.metadata.publishDate,
              url: match.metadata.url || match.metadata.link,
              region: 'US',
              score: match.score,
              matchType: 'semantic'
            });
          } else {
            results.get(id).score += match.score;
            results.get(id).matchType = 'hybrid';
          }
        });
      } catch (err) {
        console.warn("[FED_SEARCH] Vector Mesh Unavailable:", err.message);
      }
    }

    // Sort: Score DESC, then Date DESC
    return Array.from(results.values())
      .sort((a, b) => b.score - a.score || new Date(b.postedDate) - new Date(a.postedDate));
  }

  searchKeywords(query) {
    const queryTerms = this.tokenize(query);
    if (queryTerms.length === 0) return [];

    let resultSet = null;
    for (const term of queryTerms) {
      const docIds = this.index.get(term) || new Set();
      if (resultSet === null) resultSet = new Set(docIds);
      else resultSet = new Set([...resultSet].filter(id => docIds.has(id)));
    }

    if (!resultSet) return [];
    return Array.from(resultSet).map(id => this.docStore.get(id)).filter(Boolean);
  }

  async expandQuery(query, region = "US") {
    try {
      const expanded = await complete({
        model: "google/gemini-2.0-flash:free",
        messages: [{ role: "system", content: "Expand into 3 keywords. Comma separated." }, { role: "user", content: query }],
        temperature: 0.1
      }, `fed_search_expansion_${region}`);
      return `${query}, ${expanded}`;
    } catch (err) { return query; }
  }

  getStats() {
    return {
      docCount: this.docStore.size,
      termCount: this.index.size,
      archived: this.isLoaded,
      seeds: true
    };
  }
}

export const sovereignSearch = new FedSearchEngine();
