/**
 * 🕵️ Sovereign Deep Discovery: Apify Integrator
 * Handles unstructured data extraction (PDFs, Schedule Catalogs) 
 * that are not accessible via official APIs.
 */
export class ApifyIntegrator {
  constructor() {
    this.token = process.env.APIFY_TOKEN;
    this.baseUrl = "https://api.apify.com/v2";
  }

  /**
   * Triggers a Deep Scraping Actor (e.g. for SAM.gov Attachments)
   */
  async runActor(actorId, input) {
    if (!this.token) {
      console.warn("[APIFY] Missing token. Skipping deep discovery.");
      return null;
    }

    try {
      const resp = await fetch(`${this.baseUrl}/acts/${actorId}/runs?token=${this.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      
      const data = await resp.json();
      return data.data; // Returns the run object
    } catch (err) {
      console.error("[APIFY] Actor Launch Failed:", err.message);
      return null;
    }
  }

  /**
   * Fetches results from a completed dataset
   */
  async getDatasetItems(datasetId) {
    try {
      const resp = await fetch(`${this.baseUrl}/datasets/${datasetId}/items?token=${this.token}`);
      return await resp.json();
    } catch (err) {
      console.error("[APIFY] Dataset Retrieval Failed:", err.message);
      return [];
    }
  }
}

export const apify = new ApifyIntegrator();
