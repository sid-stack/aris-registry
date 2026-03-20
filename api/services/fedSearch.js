import { indexGlobalOpportunities, vectorIndex, redis } from "../utils/upstash.js";

/**
 * 🚢 Sovereign Discovery Table V5 (Immutable Memory Mesh)
 * Architecture: Single-Writer / Read-Only Lookup
 * The "Sovereign Table" is the source of truth, persisted in Upstash Redis.
 */
export class FedSearchEngine {
  constructor() {
    this.index = new Map(); // Term -> Set(DocID) - Read Only in Search
    this.docStore = new Map(); // DocID -> Metadata - Read Only in Search
    this.stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was"]);
    this.isLoaded = false;

    // Baseline Sovereign Seeds (US Sector)
    this.primeSafetyNet();
  }

  primeSafetyNet() {
    const seeds = [
      { id: "AID-2026-001", title: "Artificial Intelligence for Battlefield Readiness", agency: "Army Futures Command", postedDate: "2026-03-10", region: "US", url: "https://sam.gov/opp/ai-battlefield/view", description: "Generative AI and Large Language Model integration for tactical edge computing." },
      { id: "AID-2026-002", title: "Unmanned Aerial Systems (UAV) Detection Mesh", agency: "DHS", postedDate: "2026-03-12", region: "US", url: "https://sam.gov/opp/drone-mesh/view", description: "Distributed sensor networks for counter-UAS operations in urban environments." },
      { id: "AID-2026-003", title: "Zero Trust Cybersecurity Framework Implementation", agency: "DISA", postedDate: "2026-03-15", region: "US", url: "https://sam.gov/opp/zero-trust/view", description: "Migration of legacy systems to a NIST 800-207 compliant identity-centric mesh." }
    ];
    seeds.forEach(s => this.addToMemoryIndex(s));
  }

  /**
   * 🚨 THE SINGLE WRITER
   * This is the only function authorized to update the Sovereign Table.
   * Periodically called by the background Harvester.
   */
  async syncSovereignTable(opportunities, region = "US") {
    if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) return;
    
    console.log(`🛡️ [TABLE] Syncing ${opportunities.length} new discoveries into the Sovereign Mesh...`);
    
    for (const opt of opportunities) {
      this.addToMemoryIndex(opt, region);
    }

    // 1. Persist to Global Vector Mesh (Upstash Vector)
    if (vectorIndex) {
      try {
        await indexGlobalOpportunities(opportunities.map(o => ({ ...o, region })));
      } catch (err) {
        console.error("🛡️ [TABLE] Vector Sync Failed:", err.message);
      }
    }

    // 2. Persist to Sovereign Archive (Upstash Redis)
    await this.persistToArchive();
  }

  /**
   * Private internal logic for memory-resident index population
   */
  addToMemoryIndex(opt, region = "US") {
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
      const snapshot = await redis.get("aris:mesh:docstore:v1");
      if (snapshot) {
        const docs = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
        if (Array.isArray(docs)) {
          docs.forEach(d => this.addToMemoryIndex(d));
          this.isLoaded = true;
          console.log(`📦 [TABLE] Sovereign Mesh Restored. Table Size: ${this.docStore.size}`);
        }
      }
    } catch (err) {
      console.error("📦 [TABLE] Restoration Failed:", err.message);
    }
  }

  async persistToArchive() {
    if (!redis) return;
    try {
      const data = Array.from(this.docStore.values());
      await redis.set("aris:mesh:docstore:v1", JSON.stringify(data));
      await redis.expire("aris:mesh:docstore:v1", 30 * 24 * 60 * 60);
    } catch (err) {
      console.error("📦 [TABLE] Archival Sync Failed:", err.message);
    }
  }

  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(word => word.length >= 2 && !this.stopWords.has(word));
  }

  /**
   * 🔍 READ-ONLY SEARCH
   * Strictly performs lookups in the memory-resident mirror of the Sovereign Table.
   */
  async search(query, expand = false) {
    if (!this.isLoaded) await this.loadFromArchive();

    const results = new Map();
    const queryTerms = this.tokenize(query);
    
    // 1. Keyword Lookup (Sovereign Table Mirror)
    if (queryTerms.length > 0) {
      let resultSet = null;
      for (const term of queryTerms) {
        const docIds = this.index.get(term) || new Set();
        if (resultSet === null) resultSet = new Set(docIds);
        else resultSet = new Set([...resultSet].filter(id => docIds.has(id)));
      }
      if (resultSet) {
        resultSet.forEach(id => {
          const doc = this.docStore.get(id);
          if (doc) results.set(id, { ...doc, score: 1.0, matchType: 'table_lookup' });
        });
      }
    }

    // 2. Semantic Broadness (Deep Vector Mesh)
    if (vectorIndex) {
      try {
        const semanticMatches = await vectorIndex.query({ data: query, topK: 20, includeMetadata: true });
        semanticMatches.forEach(match => {
          const id = match.id.replace('opt:', '');
          if (!results.has(id)) {
            results.set(id, {
              id,
              title: match.metadata.title,
              agency: match.metadata.agency || match.metadata.organization,
              postedDate: match.metadata.postedDate || match.metadata.publishDate,
              url: match.metadata.url || match.metadata.link,
              score: match.score,
              matchType: 'semantic'
            });
          } else {
             results.get(id).score += match.score;
          }
        });
      } catch (err) {
        console.warn("[SEARCH] Semantic layer unavailable:", err.message);
      }
    }

    return Array.from(results.values())
      .sort((a, b) => b.score - a.score || new Date(b.postedDate) - new Date(a.postedDate));
  }

  getStats() {
    return {
      tableRows: this.docStore.size,
      indexTerms: this.index.size,
      status: this.isLoaded ? "Operational" : "Synchronizing",
      readOnly: true
    };
  }
}

export const sovereignSearch = new FedSearchEngine();
