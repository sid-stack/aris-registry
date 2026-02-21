import Stripe from 'stripe';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!.replace(/['"]/g, '');
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!.replace(/['"]/g, '');
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://arislabs.ai').replace(/\/$/, '');

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' });

async function runTest() {
    console.log("🚀 Simulating Stripe Webhook (checkout.session.completed)...");

    const payload = {
        id: "evt_test_webhook",
        object: "event",
        type: "checkout.session.completed",
        api_version: "2024-06-20",
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: "cs_test_session123",
                object: "checkout.session",
                metadata: {
                    clerk_id: "user_test_webhook_123",
                    credits_to_add: "150",
                    plan_id: "enterprise_plan"
                }
            }
        }
    };

    const payloadString = JSON.stringify(payload);

    // Generate signature
    const signature = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret: WEBHOOK_SECRET
    });

    console.log(`📡 Sending signed webhook payload to ${APP_URL}/api/webhook`);

    const response = await fetch(`${APP_URL}/api/webhook`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "stripe-signature": signature
        },
        body: payloadString
    });

    const responseText = await response.text();
    console.log(`\n✅ Endpoint Returned Status: ${response.status}`);
    console.log(`📄 Response Data: ${responseText}`);

    if (response.ok) {
        console.log("🎉 SUCCESS: Webhook absorbed and processed successfully by the local engine.");
    } else {
        console.log("❌ FAILED: Webhook rejected.");
    }
}

runTest().catch(console.error);
