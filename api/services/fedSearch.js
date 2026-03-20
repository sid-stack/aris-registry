/**
 * 🚢 Sovereign Fed Search Engine
 * High-performance Information Retrieval (IR) for Federal Solicitations.
 * Uses Inverted Indexing for stateless, rapid keyword discovery.
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
  async ingest(opportunities) {
    console.log(`[FED_SEARCH] Ingesting ${opportunities.length} opportunities into Inverted Index...`);
    
    for (const opt of opportunities) {
      const docId = opt.noticeId || opt.id;
      const content = `${opt.title} ${opt.description || ""} ${opt.agency || ""}`;
      const terms = this.tokenize(content);

      this.docStore.set(docId, {
        id: docId,
        title: opt.title,
        agency: opt.agency,
        postedDate: opt.postedDate,
        url: opt.url || `https://sam.gov/opp/${docId}/view`
      });

      for (const term of terms) {
        if (!this.index.has(term)) {
          this.index.set(term, new Set());
        }
        this.index.get(term).add(docId);
      }
    }
  }

  /**
   * Performs a boolean intersection search
   */
  search(query) {
    const queryTerms = this.tokenize(query);
    if (queryTerms.length === 0) return [];

    let resultSet = null;

    for (const term of queryTerms) {
      const docIds = this.index.get(term) || new Set();
      if (resultSet === null) {
        resultSet = new Set(docIds);
      } else {
        // Intersect
        resultSet = new Set([...resultSet].filter(id => docIds.has(id)));
      }
    }

    if (!resultSet) return [];

    return Array.from(resultSet)
      .map(id => this.docStore.get(id))
      .sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
  }

  /**
   * AI-Powered Query Expansion (Bridge to Sovereign Intelligence)
   */
  async expandQuery(query, intelligence) {
    // Logic: "AI RFP" -> "Artificial Intelligence, Machine Learning, LLM, Neural Networks"
    // To be implemented in next phase using intelligence.js
    return query; 
  }
}

export const sovereignSearch = new FedSearchEngine();
