export const STRIPE_PRODUCTS = {
  starter: { productId: "prod_Starter", priceId: "price_StarterMonthly" },
  growth: { productId: "prod_Growth", priceId: "price_GrowthMonthly" },
  pilot: { productId: "prod_Pilot", priceId: "price_PilotOneTime" },
};

/**
 * Creates a checkout session for the selected pricing plan.
 *
 * Backward compatible signatures:
 *   createCheckoutSession(plan, successUrl, cancelUrl)
 *   createCheckoutSession({ plan, successUrl, cancelUrl, premiumTier, context })
 *
 * @param {keyof typeof STRIPE_PRODUCTS | { plan: keyof typeof STRIPE_PRODUCTS, successUrl?: string, cancelUrl?: string, premiumTier?: "none"|"standard"|"express", context?: {noticeId?: string, opportunityTitle?: string, source?: string} }} planOrOptions
 * @param {string} [successUrl]
 * @param {string} [cancelUrl]
 * @returns {Promise<string>}
 */
export async function createCheckoutSession(planOrOptions, successUrl, cancelUrl) {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("VITE_STRIPE_PUBLIC_KEY is missing. Set it in your environment before checkout.");
  }

  const options = typeof planOrOptions === "object" && planOrOptions !== null
    ? planOrOptions
    : { plan: planOrOptions, successUrl, cancelUrl };
  const plan = String(options.plan || "").toLowerCase();

  if (!STRIPE_PRODUCTS[plan]) {
    throw new Error(`Unsupported Stripe plan "${plan}".`);
  }

  const requestPayload = {
    plan,
    successUrl: options.successUrl,
    cancelUrl: options.cancelUrl,
    premiumTier: options.premiumTier || "none",
    context: options.context || {},
  };

  const response = await fetch("/api/checkout/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
  });

  const responsePayload = await response.json();
  if (!response.ok || !responsePayload?.url) {
    throw new Error(responsePayload?.error || "Unable to create Stripe checkout session.");
  }

  return responsePayload.url;
}

/**
 * Creates a one-time checkout session for Aris engine pay-per-call usage.
 *
 * @param {{ successUrl?: string, cancelUrl?: string, metadata?: Record<string, string> }} [options]
 * @returns {Promise<{url: string, id?: string}>}
 */
export async function createArisCallSession(options = {}) {
  const response = await fetch("/api/aris-call-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
      metadata: options.metadata || {},
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Aris checkout failed");
  }
  return payload;
}
