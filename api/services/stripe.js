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
