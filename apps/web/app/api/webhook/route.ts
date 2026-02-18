import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/mongodb';
import { Analysis } from '@/models';
import { aris4_draft } from '@/lib/aris-protocol';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') ?? '';

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const analysisId = session.metadata?.analysisId;
        const clerkId = session.metadata?.clerkId;

        if (!analysisId || !clerkId) {
            console.error('Missing metadata in Stripe session:', session.id);
            return NextResponse.json({ received: true });
        }

        await connectDB();

        // Idempotency: only process if proposal not already generated
        const analysis = await Analysis.findOne({
            _id: analysisId,
            clerkId,
            proposalDraft: null,
        });

        if (!analysis) {
            console.log(`Webhook skipped (already processed or not found): ${analysisId}`);
            return NextResponse.json({ received: true });
        }

        // We need the original PDF text to run ARIS-4.
        // Since we don't store raw text, we use the extracted intelligence.
        // ARIS-4 will work from the structured data.
        try {
            const result = await aris4_draft(
                // Pass structured context as "pdfText" substitute
                `Project: ${analysis.projectTitle}\nAgency: ${analysis.agency}\nValue: ${analysis.estValue}\nDeadline: ${analysis.deadline}\nCompliance: ${analysis.complianceItems.join('; ')}`,
                {
                    isValidRfp: analysis.isValidRfp,
                    rejectionReason: analysis.rejectionReason,
                    projectTitle: analysis.projectTitle,
                    agency: analysis.agency,
                    naicsCode: analysis.naicsCode,
                    setAside: analysis.setAside,
                    estValue: analysis.estValue,
                    deadline: analysis.deadline,
                    complianceItems: analysis.complianceItems,
                },
                {
                    winThemes: analysis.winThemes,
                    keyRisks: analysis.keyRisks,
                    execBriefing: analysis.execBriefing,
                },
                {
                    winScore: analysis.winScore,
                    matchScore: analysis.matchScore,
                }
            );

            await Analysis.findByIdAndUpdate(analysisId, {
                proposalDraft: result.proposalDraft,
                proposalPaidAt: new Date(),
            });

            console.log(`✅ Proposal generated for analysis: ${analysisId}`);
        } catch (e) {
            console.error('ARIS-4 draft failed:', e);
            // Don't return error — Stripe will retry. Log and investigate.
        }
    }

    return NextResponse.json({ received: true });
}
