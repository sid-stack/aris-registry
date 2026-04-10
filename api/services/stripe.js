import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ── Pricing ladder: $99 / $499 / $999 ─────────────────────────────────────────
export const AUDIT_PRICE_CENTS = 9900; // $99 — single audit unlock

export const STRIPE_PLANS = {
  starter:    { priceId: process.env.STRIPE_PRICE_STARTER,    mode: "payment",      amountCents: 9900  },
  pro:        { priceId: process.env.STRIPE_PRICE_PRO,        mode: "subscription", amountCents: 49900 },
  enterprise: { priceId: process.env.STRIPE_PRICE_ENTERPRISE, mode: "subscription", amountCents: 99900 },
};

// Legacy alias (kept for backward compat with any existing references)
export const STRIPE_PRODUCTS = STRIPE_PLANS;
export const STRIPE_PREMIUM_PRODUCTS = {};

/**
 * One-click checkout for a single audit unlock ($99).
 * Encodes uid + solicitationId in metadata so the webhook can unlock the gate.
 */
export async function createDynamicCheckoutSession({ solicitationId, opportunityTitle, uid, origin }) {
  const baseUrl = origin || "https://bidsmith.pro";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "BidSmith — Full Compliance Audit",
          description: opportunityTitle
            ? `Full FAR/DFARS compliance matrix + risk brief: ${opportunityTitle}`
            : "Full compliance matrix, risk flags, remediation script, and bid/no-bid brief",
        },
        unit_amount: AUDIT_PRICE_CENTS,
      },
      quantity: 1,
    }],
    metadata: {
      uid:            uid            || "anonymous",
      solicitation_id: solicitationId || "",
      opportunityTitle: opportunityTitle || "",
    },
    success_url: `${baseUrl}/dashboard?checkout=success&sid=${encodeURIComponent(solicitationId || "")}`,
    cancel_url:  `${baseUrl}/dashboard?checkout=cancelled`,
  });

  return session;
}

export async function createCheckoutSession({ plan, context, origin }) {
  const planConfig = STRIPE_PLANS[plan];
  if (!planConfig) throw new Error(`Unsupported plan: ${plan}`);

  const baseUrl = origin || "https://bidsmith.pro";

  const session = await stripe.checkout.sessions.create({
    mode: planConfig.mode,
    payment_method_types: ["card"],
    ...(planConfig.priceId
      ? { line_items: [{ price: planConfig.priceId, quantity: 1 }] }
      : {
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: { name: `BidSmith ${plan} Plan` },
              unit_amount: planConfig.amountCents,
              ...(planConfig.mode === "subscription" ? { recurring: { interval: "month" } } : {}),
            },
            quantity: 1,
          }],
        }),
    metadata: { plan, ...(context || {}) },
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url:  `${baseUrl}/dashboard?checkout=cancelled`,
  });

  return session;
}

// ── Expose the raw stripe instance for webhook signature verification ──────────
export { stripe };

export async function getRevenueStats() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    return { total: 0, balance: 0 };
  }
  try {
    const [balance, payments] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.paymentIntents.list({
        limit: 100,
        created: { gte: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000) }
      })
    ]);

    const totalVolume = payments.data
      .filter(p => p.status === "succeeded")
      .reduce((sum, p) => sum + (p.amount_received / 100), 0);

    const netBalance = balance.available.reduce((sum, val) => sum + (val.amount / 100), 0);

    return { 
      total_30d: totalVolume, 
      available_balance: netBalance 
    };
  } catch (err) {
    console.error("[STRIPE_STATS] fetch_failed", err.message);
    return { total_30d: 0, available_balance: 0 };
  }
}

export async function getStripeLogs() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) return [];
  try {
    const events = await stripe.events.list({ limit: 50 });
    return events.data.map(e => ({
      id: e.id,
      type: e.type,
      created: new Date(e.created * 1000).toISOString(),
      object: e.object,
      description: e.data?.object?.description || e.data?.object?.email || e.data?.object?.amount || "System Event"
    }));
  } catch (err) {
    console.error("[STRIPE_LOGS] failed", err.message);
    return [];
  }
}
