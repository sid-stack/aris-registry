import Stripe from 'stripe';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!.replace(/['"]/g, '');
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!.replace(/['"]/g, '');

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' });

async function runGhostTest() {
    console.log("👻 Initiating 'Ghost' Webhook Stress-Test...");
    const clerkId = "user_ghost_" + Math.random().toString(36).substring(7);

    const payload = {
        id: "evt_ghost_" + Math.random().toString(36).substring(7),
        object: "event",
        type: "checkout.session.completed",
        api_version: "2024-06-20",
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: "cs_test_ghost123",
                object: "checkout.session",
                metadata: {
                    clerk_id: clerkId,
                    credits_to_add: "500",
                    plan_id: "ghost_protocol"
                }
            }
        }
    };

    const payloadString = JSON.stringify(payload);
    const signature = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret: WEBHOOK_SECRET
    });

    console.log("📡 Firing Ghost Webhook payload to http://localhost:3000/api/webhook");

    const start = performance.now();
    const response = await fetch("http://localhost:3000/api/webhook", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "stripe-signature": signature
        },
        body: payloadString
    });
    const duration = performance.now() - start;

    console.log(`⏱️  Latency: ${duration.toFixed(2)}ms`);
    console.log(`✅ Endpoint Returned Status: ${response.status}`);

    if (duration > 200) {
        console.warn("⚠️ Warning: Latency exceeded 200ms");
    }

    if (response.ok) {
        console.log("🎉 SUCCESS: Webhook absorbed successfully");
    } else {
        console.error("❌ FAILED: Webhook rejected.");
    }
}

runGhostTest().catch(console.error);
