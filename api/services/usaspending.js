/**
 * Aris Intelligence Layer: USAspending Integrator
 * Handles historical award data analysis to provide "Winner Hub" context for searches.
 */

// Required by USAspending API on every request
const CONTRACT_TYPES = ["A", "B", "C", "D"];
const AWARD_FIELDS = ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Start Date"];

export class USAspendingClient {
  constructor() {
    this.baseUrl = "https://api.usaspending.gov/api/v2";
  }

  /**
   * Searches for historical award winners for a given keyword query.
   */
  async getAwardsSummary(query) {
    try {
      const resp = await fetch(`${this.baseUrl}/search/spending_by_award/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            keywords: Array.isArray(query) ? query : [query],
            award_type_codes: CONTRACT_TYPES
          },
          limit: 20,
          fields: AWARD_FIELDS
        })
      });

      const data = await resp.json();
      if (data.detail) {
        console.warn("[US_DISCOVERY] API error:", data.detail);
        return [];
      }
      return data.results || [];
    } catch (err) {
      console.error("[US_DISCOVERY] getAwardsSummary failed:", err.message);
      return [];
    }
  }

  /**
   * Searches for awards filtered by NAICS code(s).
   * Used by the Discovery feed to find relevant past awards.
   */
  async getAwardsByNaics(naicsCodes) {
    const codes = Array.isArray(naicsCodes) ? naicsCodes : [naicsCodes];
    try {
      const resp = await fetch(`${this.baseUrl}/search/spending_by_award/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            naics_codes: codes,
            award_type_codes: CONTRACT_TYPES
          },
          limit: 25,
          fields: AWARD_FIELDS
        })
      });

      const data = await resp.json();
      if (data.detail) {
        console.warn("[US_DISCOVERY] NAICS API error:", data.detail);
        return [];
      }
      return data.results || [];
    } catch (err) {
      console.error("[US_DISCOVERY] getAwardsByNaics failed:", err.message);
      return [];
    }
  }

  async getAgencyRankings(query) {
    return [];
  }
}

export const usaspending = new USAspendingClient();
