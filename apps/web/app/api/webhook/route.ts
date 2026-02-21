import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.replace(/['"]/g, '') : '';

const stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2024-06-20',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.replace(/['"]/g, '') : '';
const API_BASE = process.env.RENDER_API_URL || 'https://aris-registry.onrender.com';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET!;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') ?? '';

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
    } catch (err) {
        console.error('[STRIPE_WEBHOOK] Signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // --- STRATEGIC: Outcome-Based Billing Handlers ---

    if (event.type === 'payment_intent.amount_capturable_updated') {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.log(`💳 [AUTH_HOLD] Intent ${intent.id} is now capturable. Triggering ARIS Labs...`);

        // In production, this would trigger the Aris Orchestrator to begin proposal generation.
        // We update the DB status to indicate it's ready for processing.
        try {
            await fetch(`${API_BASE}/api/delivery/trigger`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': INTERNAL_API_SECRET
                },
                body: JSON.stringify({ intent_id: intent.id, user_id: intent.metadata.user_id })
            });
        } catch (err) {
            console.error('[STRIPE_WEBHOOK] Failed to trigger delivery:', err);
        }
    }

    if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.log(`✅ [SETTLEMENT] Payment succeeded for Intent ${intent.id}. Finalizing credits...`);

        // This is the SINGLE SOURCE OF TRUTH for credit updates in outcome-based flows.
        const clerkUserId = intent.metadata?.clerk_id;
        const creditsToAdd = 0; // Outcome-based bids don't add credits by default, they deliver a PDF.

        if (clerkUserId) {
            await fetch(`${API_BASE}/api/checkout/internal/add-credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': INTERNAL_API_SECRET,
                },
                body: JSON.stringify({
                    clerk_id: clerkUserId,
                    credits_to_add: 0,
                    stripe_session_id: intent.id, // Using intent.id for idempotency
                    plan_id: 'outcome_bid'
                }),
            });
        }
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        // ... (existing credits top-up logic)

        // Robustness: Handle both frontend (clerk_user_id) and backend (clerk_id) session metadata
        const clerkUserId = session.metadata?.clerk_user_id || session.metadata?.clerk_id;
        const creditsToAddRaw = session.metadata?.credits_to_add;
        const planId = session.metadata?.plan_id ?? 'unknown';
        const stripeSessionId = session.id;

        // Validate required metadata
        if (!clerkUserId || !creditsToAddRaw) {
            console.error('[STRIPE_WEBHOOK] Missing metadata. Got:', JSON.stringify(session.metadata));
            // Return 200 so Stripe doesn't retry — this is a data issue, not a transient error
            return NextResponse.json({ received: true, error: 'missing_metadata' });
        }

        const creditsToAdd = parseFloat(creditsToAddRaw);
        if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
            console.error('[STRIPE_WEBHOOK] Invalid credits_to_add:', creditsToAddRaw);
            return NextResponse.json({ received: true, error: 'invalid_credits' });
        }

        if (!INTERNAL_API_SECRET) {
            console.error('[STRIPE_WEBHOOK] INTERNAL_API_SECRET is not set!');
            return NextResponse.json({ received: true, error: 'server_misconfiguration' }, { status: 500 });
        }

        // Call the Python API's internal endpoint to atomically update credits
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const apiResponse = await fetch(`${API_BASE}/api/checkout/internal/add-credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': INTERNAL_API_SECRET,
                },
                body: JSON.stringify({
                    clerk_id: clerkUserId,
                    credits_to_add: creditsToAdd,
                    stripe_session_id: stripeSessionId,
                    plan_id: planId,
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                throw new Error(`Python API returned ${apiResponse.status}: ${errorText}`);
            }

            const result = await apiResponse.json();
            console.log(
                `[STRIPE_WEBHOOK] ✅ Credits updated via Render. clerk_id=${clerkUserId}, ` +
                `credits=${creditsToAdd}, plan=${planId}, session=${stripeSessionId}`,
                result
            );
        } catch (err: any) {
            console.warn(`[STRIPE_WEBHOOK] Failed to call Python API (${err.message}). Falling back to local MongoDB...`);

            try {
                // local fallback
                const { connectDB } = await import('@/lib/mongodb');
                const { User } = await import('@/models');
                await connectDB();

                // Idempotency check locally
                const userDoc = await User.findOne({ clerkId: clerkUserId });
                if (userDoc && !userDoc.processedStripeSessionIds.includes(stripeSessionId)) {
                    await User.updateOne(
                        { clerkId: clerkUserId },
                        {
                            $inc: { credits_balance: creditsToAdd },
                            $push: { processedStripeSessionIds: stripeSessionId }
                        }
                    );
                    console.log(`[STRIPE_WEBHOOK] ✅ Fallback local MongoDB update successful.`);
                } else {
                    console.log(`[STRIPE_WEBHOOK] ℹ️ Session ${stripeSessionId} already processed (idempotency).`);
                }
            } catch (fallbackErr) {
                console.error('[STRIPE_WEBHOOK] ❌ Critical: Fallback update failed:', fallbackErr);
            }
        }

        // FAANG-Level Polish: Sync MongoDB ledger directly into the Clerk JWT Metadata
        // This allows the edge middleware to instantly route the user based on credits without hitting the DB.
        try {
            const { clerkClient } = await import('@clerk/nextjs/server');
            const client = await clerkClient();
            const user = await client.users.getUser(clerkUserId);
            const currentCredits = (user.publicMetadata.credits as number) || 0;
            await client.users.updateUserMetadata(clerkUserId, {
                publicMetadata: {
                    credits: currentCredits + creditsToAdd,
                    hasActiveSubscription: planId.includes('pro') || planId.includes('starter')
                        ? true
                        : (user.publicMetadata.hasActiveSubscription || false)
                }
            });
            console.log(`[STRIPE_WEBHOOK] 🔄 Clerk JWT Metadata synchronized for ${clerkUserId}`);
        } catch (clerkErr) {
            console.error('[STRIPE_WEBHOOK] Failed to sync Clerk metadata:', clerkErr);
        }
    }

    return NextResponse.json({ received: true });
}
