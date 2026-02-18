import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/mongodb';
import { Analysis } from '@/models';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId } = await req.json();
    if (!analysisId) {
        return NextResponse.json({ error: 'analysisId is required' }, { status: 400 });
    }

    // 2. Verify the analysis belongs to this user
    await connectDB();
    const analysis = await Analysis.findOne({ _id: analysisId, clerkId: userId });
    if (!analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    if (analysis.proposalDraft) {
        return NextResponse.json({ error: 'Proposal already generated' }, { status: 409 });
    }

    // 3. Create Stripe Checkout Session ($0.99)
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: 99, // $0.99 in cents
                    product_data: {
                        name: 'BidSmith Proposal Draft',
                        description: `Full AI proposal for: ${analysis.projectTitle}`,
                    },
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        metadata: {
            analysisId: analysisId,
            clerkId: userId,
        },
        success_url: `${APP_URL}/dashboard/history/${analysisId}?proposal=success`,
        cancel_url: `${APP_URL}/dashboard/history/${analysisId}?proposal=cancelled`,
    });

    return NextResponse.json({ url: session.url });
}
