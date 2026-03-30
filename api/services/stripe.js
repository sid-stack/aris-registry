import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const STRIPE_PRODUCTS = {
  starter: { productId: "prod_1QKx2jGYLlqVJEww4X8ZKqLd", priceId: "price_1T0KVnGYLlqVJEwwhV510OeS", mode: "subscription" },
  growth: { productId: "prod_1QKx3kGYLlqVJEww7K2Xh9nM", priceId: "price_1T0KVnGYLlqVJEwwhV510OeS", mode: "subscription" },
  pilot: { productId: "prod_1QKx4pGYLlqVJEww9N4Xh2nO", priceId: "price_1T0KVnGYLlqVJEwwhV510OeS", mode: "payment" },
};

export const STRIPE_PREMIUM_PRODUCTS = {
  standard: { priceId: process.env.STRIPE_PRICE_PREMIUM_STANDARD, turnaroundHours: "48" },
  express: { priceId: process.env.STRIPE_PRICE_PREMIUM_EXPRESS, turnaroundHours: "24" },
};

export async function createDynamicCheckoutSession({ estimatedValue, opportunityTitle, origin }) {
  const numericValue = parseFloat(String(estimatedValue || "0").replace(/[$,MKB]/gi, "")) || 0;
  const isHighValue = numericValue >= 10_000_000;
  const priceAmount = isHighValue ? 29900 : 9900; // cents
  const planName = isHighValue ? "Enterprise Audit" : "Standard Audit";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `ARIS ${planName} — Compliance Matrix`,
          description: opportunityTitle
            ? `Full FAR/DFARS remediation script for: ${opportunityTitle}`
            : "Full compliance matrix, risk flags, remediation script, and bid/no-bid brief",
        },
        unit_amount: priceAmount,
      },
      quantity: 1,
    }],
    metadata: {
      opportunityTitle: opportunityTitle || "",
      estimatedValue: String(estimatedValue || ""),
    },
    success_url: `${origin}/app?checkout=success`,
    cancel_url: `${origin}/app?checkout=cancelled`,
  });

  return session;
}

export async function createCheckoutSession({ plan, premiumTier, context, origin }) {
  const planConfig = STRIPE_PRODUCTS[plan];
  if (!planConfig) throw new Error("Unsupported plan");

  const session = await stripe.checkout.sessions.create({
    mode: planConfig.mode,
    payment_method_types: ["card"],
    line_items: [
      { price: planConfig.priceId, quantity: 1 },
    ],
    metadata: { ...context, premium_tier: premiumTier },
    success_url: `${origin}/app?checkout=success`,
    cancel_url: `${origin}/app?checkout=cancelled`,
  });

  return session;
}

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
