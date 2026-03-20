import { indexGlobalOpportunities, vectorIndex, redis } from "../utils/upstash.js";

/**
 * 🚢 Sovereign Discovery Table V5.2 (Data-Preservation Armor)
 * Architecture: Atomic Ingress / Persistence Guard
 */
export class FedSearchEngine {
  constructor() {
    this.index = new Map(); 
    this.docStore = new Map(); 
    this.stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was"]);
    
    this.isLoaded = false;
    this.isLoading = false;

    // Baseline Sovereign Seeds (US Sector)
    this.primeSafetyNet();
  }

  primeSafetyNet() {
    const seeds = [
      { id: "AID-2026-001", title: "Artificial Intelligence for Battlefield Readiness", agency: "Army (AFC)", postedDate: "2026-03-10", region: "US", url: "https://sam.gov/opp/ai-battlefield/view", description: "Tactical edge LLM integration." },
      { id: "AID-2026-002", title: "Counter-UAS Detection Mesh", agency: "DHS", postedDate: "2026-03-12", region: "US", url: "https://sam.gov/opp/drone-mesh/view", description: "Swarmless sensor networks." },
      { id: "AID-2026-003", title: "Zero Trust Cybersecurity Implementation", agency: "DISA", postedDate: "2026-03-15", region: "US", url: "https://sam.gov/opp/zero-trust/view", description: "Identity-centric security mesh." }
    ];
    seeds.forEach(s => this.addToMemoryIndex(s));
  }

  /**
   * 🚨 THE SINGLE WRITER (APPEND-ONLY)
   * This is protected by a Persistence Guard to prevent data loss during startup.
   */
  async syncSovereignTable(opportunities, region = "US") {
    // 🛡️ DATA PRESERVATION GUARD
    // Never persist a partial index before the archive has been loaded.
    if (!this.isLoaded && this.isLoading) {
      console.warn("🛡️ [TABLE] Sync Deferred: Archive restoration in progress.");
      return;
    }

    if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) return;
    
    let addedCount = 0;
    for (const opt of opportunities) {
       const docId = opt.noticeId || opt.id || opt["Award ID"] || opt.pageid;
       if (!this.docStore.has(docId)) {
          this.addToMemoryIndex(opt, region);
          addedCount++;
       }
    }

    if (addedCount > 0) {
      if (vectorIndex) {
        try {
          await indexGlobalOpportunities(opportunities.slice(0, 50).map(o => ({ ...o, region })));
        } catch (err) { console.error("🛡️ [TABLE] Vector Sync Fail:", err.message); }
      }
      
      // Critical check before overwriting the remote archive
      if (this.isLoaded || !this.isLoading) {
        await this.persistToArchive();
        console.log(`🛡️ [TABLE] Mesh Expanded: +${addedCount} rows. Total: ${this.docStore.size}`);
      } else {
        console.warn("🛡️ [TABLE] Persist Blocked: Final state not confirmed.");
      }
    }
  }

  async ingestWikipedia(term) {
    if (!this.isLoaded && this.isLoading) return;
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();
      
      const wikiDoc = {
        id: `wiki:${data.pageid}`,
        title: data.title,
        agency: "Wikipedia (Global Intelligence)",
        postedDate: new Date().toISOString(),
        description: data.extract,
        url: data.content_urls?.desktop?.page || data.canonicalurl,
        region: "GLOBAL"
      };

      this.addToMemoryIndex(wikiDoc, "GLOBAL");
      if (this.isLoaded) await this.persistToArchive();
      return true;
    } catch (err) { return false; }
  }

  addToMemoryIndex(opt, region = "US") {
    const docId = opt.noticeId || opt.id || opt["Award ID"] || opt.pageid || `gen:${Math.random().toString(36).slice(2, 9)}`;
    const title = opt.title || opt["Award ID"] || "Sovereign Intelligence";
    const agency = opt.agency || opt.organization || opt["Awarding Agency"] || "Global Info";
    const postedDate = opt.postedDate || opt.publishDate || opt["Start Date"] || new Date().toISOString().split('T')[0];
    
    const content = `${title} ${opt.description || opt.extract || ""} ${agency}`.toLowerCase();
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
    if (this.isLoading) return;
    
    this.isLoading = true;
    try {
      console.log("🚢 [ARCHIVE] Atomic Restoration Initiated...");
      const snapshot = await redis.get("aris:mesh:docstore:v1");
      
      if (snapshot) {
        const docs = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
        if (Array.isArray(docs)) {
          docs.forEach(d => this.addToMemoryIndex(d));
          console.log(`📦 [TABLE] Snapshot Recovered: ${docs.length} rows.`);
        }
      } else {
        console.log("📦 [TABLE] Remote Archive Empty. Initializing new baseline.");
      }
      this.isLoaded = true;
      this.isLoading = false;
    } catch (err) { 
      console.error("📦 [TABLE] Critical Load Error:", err.message); 
      this.isLoading = false; // Allow retry
    }
  }

  async persistToArchive() {
    // 🛡️ DOUBLE PROTECTION
    if (!redis || !this.isLoaded) return;
    try {
      const data = Array.from(this.docStore.values());
      if (data.length > 5) { // Sanity check: don't persist if we lost too much data
        await redis.set("aris:mesh:docstore:v1", JSON.stringify(data));
        await redis.expire("aris:mesh:docstore:v1", 30 * 24 * 60 * 60);
      }
    } catch (err) { console.error("📦 [TABLE] Archival Sync Failed:", err.message); }
  }

  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(word => word.length >= 2 && !this.stopWords.has(word));
  }

  async search(query, expand = false, region = "US") {
    if (!this.isLoaded && !this.isLoading) await this.loadFromArchive();

    const results = new Map();
    let finalQuery = query;

    if (expand) finalQuery = await this.expandQuery(query, region);
    const queryTerms = this.tokenize(finalQuery);
    
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

    if (vectorIndex) {
      try {
        const semanticMatches = await vectorIndex.query({ data: query, topK: 20, includeMetadata: true });
        semanticMatches.forEach(match => {
          const id = match.id.replace('opt:', '');
          if (!results.has(id)) {
            results.set(id, { id, title: match.metadata.title, agency: match.metadata.agency, postedDate: match.metadata.postedDate, url: match.metadata.url, score: match.score, matchType: 'semantic' });
          } else { results.get(id).score += match.score; }
        });
      } catch (err) { console.warn("[SEARCH] Vector skip:", err.message); }
    }

    return Array.from(results.values()).sort((a,b) => b.score - a.score);
  }

  getTableData(password) {
    if (password !== "aris3690") throw new Error("UNAUTHORIZED_TERMINAL_ACCESS");
    return Array.from(this.docStore.values());
  }

  getStats() {
    return { tableRows: this.docStore.size, indexTerms: this.index.size, status: this.isLoaded ? "Operational" : "Synchronizing", readOnly: true };
  }
}

export const sovereignSearch = new FedSearchEngine();
