import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

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
            });

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                console.error(
                    `[STRIPE_WEBHOOK] Python API returned ${apiResponse.status}: ${errorText}. ` +
                    `clerk_id=${clerkUserId}, session=${stripeSessionId}`
                );
                // Return 500 so Stripe retries — this is a transient/server error
                return NextResponse.json(
                    { error: 'credit_update_failed' },
                    { status: 500 }
                );
            }

            const result = await apiResponse.json();
            console.log(
                `[STRIPE_WEBHOOK] ✅ Credits updated. clerk_id=${clerkUserId}, ` +
                `credits=${creditsToAdd}, plan=${planId}, session=${stripeSessionId}`,
                result
            );
        } catch (err) {
            console.error('[STRIPE_WEBHOOK] Failed to call Python API:', err);
            // Return 500 so Stripe retries
            return NextResponse.json({ error: 'api_unreachable' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
