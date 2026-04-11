/**
 * Frontend Stripe helpers.
 * Plan keys must match STRIPE_PLANS in api/services/stripe.js exactly.
 * Amounts are display-only — Stripe is the source of truth.
 */
export const STRIPE_PRODUCTS = {
  starter:    { priceId: "price_1T1tb8GYLlqVJEwwysv5FuGm", amount: 99,  label: "Starter — $99/mo" },
  pro:        { priceId: "price_1TC4q3GYLlqVJEww51ByLmGT",  amount: 299, label: "Pro — $299/mo" },
  enterprise: { priceId: "price_1TFd3CGYLlqVJEwwalABiAaa",  amount: 999, label: "Enterprise — $999/mo" },
};

/**
 * Creates a Stripe Checkout Session via the BidSmith API.
 *
 * Accepts either:
 *   createCheckoutSession(plan, successUrl, cancelUrl)
 *   createCheckoutSession({ plan, successUrl, cancelUrl, context })
 */
export async function createCheckoutSession(planOrOptions, successUrl, cancelUrl) {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("VITE_STRIPE_PUBLIC_KEY is missing.");
  }

  const options = typeof planOrOptions === "object" && planOrOptions !== null
    ? planOrOptions
    : { plan: planOrOptions, successUrl, cancelUrl };

  const plan = String(options.plan || "").toLowerCase();

  if (!STRIPE_PRODUCTS[plan]) {
    throw new Error(`Unsupported plan "${plan}". Valid: starter, pro, enterprise.`);
  }

  const uid = options.uid || null;
  const defaultSuccessUrl = `${window.location.origin}/dashboard?checkout=success&source=subscription&plan=${encodeURIComponent(plan)}`;
  const defaultCancelUrl = `${window.location.origin}/pricing?checkout=cancelled&source=subscription&plan=${encodeURIComponent(plan)}`;
  const response = await fetch("/api/checkout/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(uid ? { "x-user-id": uid } : {}),
    },
    body: JSON.stringify({
      plan,
      successUrl: options.successUrl || defaultSuccessUrl,
      cancelUrl:  options.cancelUrl  || defaultCancelUrl,
      context:    { ...(options.context || {}), ...(uid ? { uid } : {}) },
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Unable to create Stripe checkout session.");
  }

  return payload.url;
}

/**
 * Creates a one-time dynamic checkout session for a specific audit unlock.
 */
export async function createArisCallSession(options = {}) {
  const response = await fetch("/api/create-dynamic-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      successUrl: options.successUrl,
      cancelUrl:  options.cancelUrl,
      metadata:   options.metadata || {},
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Checkout failed.");
  }
  return payload;
}
