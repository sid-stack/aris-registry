/**
 * 📊 Aris Intelligence Layer: USAspending Integrator
 * Handles historical award data analysis to provide "Winner Hub" context for searches.
 */
export class USAspendingClient {
  constructor() {
    this.baseUrl = "https://api.usaspending.gov/api/v2";
  }

  /**
   * Searches for historical award winners for a given query (keyword based)
   */
  async getAwardsSummary(query) {
    console.log(`[US_DISCOVERY] FETCHING AWARD HISTORIES FOR: "${query}"`);
    
    try {
      // POST /api/v2/search/spending_by_award/
      // Example body: { filters: { keywords: ["AI"] }, limit: 10, fields: ["Award ID", "Recipient Name", "Award Amount"] }
      const resp = await fetch(`${this.baseUrl}/search/spending_by_award/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: { keywords: [query] },
          limit: 10,
          fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Start Date"]
        })
      });
      
      const data = await resp.json();
      return data.results || [];
    } catch (err) {
      console.error("[US_DISCOVERY] USAspending Retrieval Failed:", err.message);
      return [];
    }
  }

  /**
   * Fetches the top agencies for a specific NAICS or keyword
   */
  async getAgencyRankings(query) {
    // ...
    return [];
  }
}

export const usaspending = new USAspendingClient();
