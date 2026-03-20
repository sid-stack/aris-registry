import { indexGlobalOpportunities, vectorIndex } from "../utils/upstash.js";
import { complete } from "./intelligence.js";

/**
 * 🚢 Sovereign Fed Search Engine V3 (Multi-Regional Hybrid IR Mesh)
 * High-performance Information Retrieval across US (SAM.gov) and India (CPPP/GeM).
 */

export class FedSearchEngine {
  constructor() {
    this.index = new Map(); // Term -> Set(DocID)
    this.docStore = new Map(); // DocID -> Metadata
    this.stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was"]);
  }

  /**
   * Tokenizes text into a clean word array
   */
  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(word => word.length >= 2 && !this.stopWords.has(word));
  }

  /**
   * Indexes a collection of solicitations
   */
  async ingest(opportunities, region = "US") {
    console.log(`[FED_SEARCH] [${region}] Ingesting ${opportunities.length} opportunities into Hybrid Mesh...`);
    
    // 1. Inverted Index (Memory)
    for (const opt of opportunities) {
      const docId = opt.noticeId || opt.id || opt.tenderId;
      const content = `${opt.title} ${opt.description || ""} ${opt.agency || opt.organization || ""}`;
      const terms = this.tokenize(content);

      this.docStore.set(docId, {
        id: docId,
        title: opt.title,
        agency: opt.agency || opt.organization,
        postedDate: opt.postedDate || opt.publishDate,
        region,
        url: opt.url || (region === "US" ? `https://sam.gov/opp/${docId}/view` : opt.link)
      });

      for (const term of terms) {
        if (!this.index.has(term)) {
          this.index.set(term, new Set());
        }
        this.index.get(term).add(docId);
      }
    }

    // 2. Vector Index (Upstash - Global Repository)
    if (opportunities.length > 0) {
      try {
        await indexGlobalOpportunities(opportunities.map(o => ({ ...o, region })));
      } catch (err) {
        console.error(`[FED_SEARCH] [${region}] Vector Ingestion Failed:`, err.message);
      }
    }
  }

  /**
   * Performs a Hybrid Search (Keyword Intersection + Semantic Similarity)
   */
  async search(query, expand = false, region = "US") {
    let finalQuery = query;
    const results = new Map();

    // 1. AI Query Expansion (Optional)
    if (expand) {
      finalQuery = await this.expandQuery(query, region);
      console.log(`[FED_SEARCH] [${region}] Expanded Query: "${query}" -> "${finalQuery}"`);
    }

    // 2. Keyword Search (Inverted Index)
    const keywordResults = this.searchKeywords(finalQuery);
    keywordResults.forEach(res => {
      // Only include results from the requested region
      if (res.region === region) {
        results.set(res.id, { ...res, score: 1.0, matchType: 'keyword' });
      }
    });

    // 3. Semantic Search (Upstash Vector)
    if (vectorIndex) {
      try {
        const semanticMatches = await vectorIndex.query({
          data: finalQuery,
          topK: 15,
          includeMetadata: true,
          includeVectors: false,
          filter: `region = '${region}'` // Meta-filtering by region
        });

        semanticMatches.forEach(match => {
          const id = match.id.replace('opt:', '');
          if (!results.has(id)) {
            results.set(id, {
              id,
              title: match.metadata.title,
              agency: match.metadata.agency || match.metadata.organization,
              postedDate: match.metadata.postedDate || match.metadata.publishDate,
              url: match.metadata.url || match.metadata.link,
              region: match.metadata.region,
              score: match.score,
              matchType: 'semantic'
            });
          } else {
            results.get(id).score += match.score;
            results.get(id).matchType = 'hybrid';
          }
        });
      } catch (err) {
        console.warn(`[FED_SEARCH] [${region}] Semantic Search Bypass:`, err.message);
      }
    }

    return Array.from(results.values())
      .sort((a, b) => b.score - a.score || new Date(b.postedDate) - new Date(a.postedDate));
  }

  /**
   * Boolean keyword intersection
   */
  searchKeywords(query) {
    const queryTerms = this.tokenize(query);
    if (queryTerms.length === 0) return [];

    let resultSet = null;
    for (const term of queryTerms) {
      const docIds = this.index.get(term) || new Set();
      if (resultSet === null) {
        resultSet = new Set(docIds);
      } else {
        resultSet = new Set([...resultSet].filter(id => docIds.has(id)));
      }
    }

    if (!resultSet) return [];
    return Array.from(resultSet).map(id => this.docStore.get(id));
  }

  /**
   * AI-Powered Query Expansion via Sovereign Intelligence
   */
  async expandQuery(query, region = "US") {
    const context = region === "US" 
      ? "Federal Procurement Search specialist (FAR/DFARS)" 
      : "Indian Government Procurement (CPPP/GeM) specialist (GFR/Manuals)";
    
    try {
      const expanded = await complete({
        model: "google/gemini-2.0-flash:free",
        messages: [
          { role: "system", content: `You are a ${context}. Expand the user query into a focused list of 3-5 high-impact procurement keywords. Output only the terms, comma separated.` },
          { role: "user", content: query }
        ],
        temperature: 0.1
      }, `fed_search_expansion_${region}`);
      
      return `${query}, ${expanded}`;
    } catch (err) {
      return query;
    }
  }
}

export const sovereignSearch = new FedSearchEngine();
