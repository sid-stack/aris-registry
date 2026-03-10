import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export function useArisDiscover() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const discover = async (capability) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endpoint = API_URL
        ? `${API_URL}/api/arislabs/discover`
        : "/api/arislabs/discover";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capability }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Aris API error");
      }

      setResult({
        agentUrl: data.agent_url,
        latencyMs: data.latency_ms,
        uptimePct: data.uptime_pct,
        priceInr: data.price_inr,
      });
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return { discover, loading, result, error };
}
