export const STRIPE_PRODUCTS = {
  starter: { productId: "prod_Starter", priceId: "price_StarterMonthly" },
  growth: { productId: "prod_Growth", priceId: "price_GrowthMonthly" },
  pilot: { productId: "prod_Pilot", priceId: "price_PilotOneTime" },
};

/**
 * Creates a checkout session for the selected pricing plan.
 *
 * @param {keyof typeof STRIPE_PRODUCTS} plan
 * @param {string} successUrl
 * @param {string} cancelUrl
 * @returns {Promise<string>}
 */
export async function createCheckoutSession(plan, successUrl, cancelUrl) {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("VITE_STRIPE_PUBLIC_KEY is missing. Set it in your environment before checkout.");
  }

  if (!STRIPE_PRODUCTS[plan]) {
    throw new Error(`Unsupported Stripe plan "${plan}".`);
  }

  const response = await fetch("/api/checkout/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, successUrl, cancelUrl }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Unable to create Stripe checkout session.");
  }

  return payload.url;
}

