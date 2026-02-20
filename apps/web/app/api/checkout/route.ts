import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, currentUser } from '@clerk/nextjs/server';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.replace(/['"]/g, '') : '';

const stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2024-06-20',
    typescript: true,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://bidsmith.ai');

const PLANS: Record<string, { name: string; description: string; unit_amount: number; credits: number }> = {
    // Monthly plans
    starter: {
        name: 'Starter Plan (Monthly)',
        description: '25 RFP Analysis Credits / month',
        unit_amount: 1900,   // $19.00
        credits: 25,
    },
    pro: {
        name: 'Professional Plan (Monthly)',
        description: '150 RFP Analysis Credits / month',
        unit_amount: 9900,   // $99.00
        credits: 150,
    },
    // Yearly plans
    starter_yearly: {
        name: 'Starter Plan (Yearly)',
        description: '25 RFP Analysis Credits / month — billed annually',
        unit_amount: 19000,  // $190.00
        credits: 300,        // 25 * 12
    },
    pro_yearly: {
        name: 'Professional Plan (Yearly)',
        description: '150 RFP Analysis Credits / month — billed annually',
        unit_amount: 99000,  // $990.00
        credits: 1800,       // 150 * 12
    },
    // Legacy credits top-up
    credits: {
        name: '25 Analysis Credits',
        description: 'Top-up pack — 25 analyses',
        unit_amount: 2000,   // $20.00
        credits: 25,
    },
};

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const basePlanId = (body.plan_id as string) || 'credits';
        const frequency = (body.frequency as string) === 'yearly' ? 'yearly' : 'monthly';
        // Build the lookup key: e.g. 'pro' + yearly => 'pro_yearly'
        const planKey = frequency === 'yearly' && basePlanId !== 'credits'
            ? `${basePlanId}_yearly`
            : basePlanId;
        const plan = PLANS[planKey] ?? PLANS[basePlanId] ?? PLANS['credits'];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: plan.name,
                            description: plan.description,
                        },
                        unit_amount: plan.unit_amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${APP_URL}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_URL}/dashboard/billing?canceled=true`,
            customer_email: user.emailAddresses?.[0]?.emailAddress,
            metadata: {
                clerk_user_id: userId,
                plan_id: planKey,
                credits_to_add: String(plan.credits),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('[STRIPE_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
