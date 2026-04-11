import { apiUrl } from "./api";

const PRODUCTION_STRIPE_PRODUCTS = {
  starter:    { priceId: "price_1T1tb8GYLlqVJEwwysv5FuGm", amount: 99,  label: "Starter — $99/mo" },
  pro:        { priceId: "price_1TC4q3GYLlqVJEww51ByLmGT", amount: 299, label: "Pro — $299/mo" },
  enterprise: { priceId: "price_1TFd3CGYLlqVJEwwalABiAaa", amount: 999, label: "Enterprise — $999/mo" },
};

const DEVELOPMENT_STRIPE_PRODUCTS = {
  starter: {
    ...PRODUCTION_STRIPE_PRODUCTS.starter,
    priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER || PRODUCTION_STRIPE_PRODUCTS.starter.priceId,
  },
  pro: {
    ...PRODUCTION_STRIPE_PRODUCTS.pro,
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO || PRODUCTION_STRIPE_PRODUCTS.pro.priceId,
  },
  enterprise: {
    ...PRODUCTION_STRIPE_PRODUCTS.enterprise,
    priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || PRODUCTION_STRIPE_PRODUCTS.enterprise.priceId,
  },
};

/**
 * Frontend Stripe helpers.
 * Plan keys must match STRIPE_PLANS in api/services/stripe.js exactly.
 * Amounts are display-only — Stripe is the source of truth.
 */
export const STRIPE_PRODUCTS = (import.meta.env.PROD || import.meta.env.MODE === "production")
  ? PRODUCTION_STRIPE_PRODUCTS
  : DEVELOPMENT_STRIPE_PRODUCTS;

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
  const defaultSuccessUrl = `${window.location.origin}/dashboard?checkout=success&source=subscription&plan=${encodeURIComponent(plan)}&session_id={CHECKOUT_SESSION_ID}`;
  const defaultCancelUrl = `${window.location.origin}/pricing?checkout=cancelled&source=subscription&plan=${encodeURIComponent(plan)}`;
  const response = await fetch(apiUrl("/api/checkout/session"), {
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
  const response = await fetch(apiUrl("/api/create-dynamic-checkout-session"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.uid ? { "x-user-id": options.uid } : {}),
    },
    body: JSON.stringify({
      solicitationId: options.solicitationId || options.metadata?.solicitationId || "",
      opportunityTitle: options.opportunityTitle || options.metadata?.opportunityTitle || "",
      uid: options.uid || options.metadata?.uid || "anonymous",
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Checkout failed.");
  }
  return payload;
}
