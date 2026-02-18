import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, currentUser } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10', // Updated to a recent version
    typescript: true,
});

export async function POST(req: Request) {
    try {
        const { userId } = auth();
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // You can also create or retrieve a Stripe Customer here based on user.email

        const settings = {
            url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'BidSmith Pro Subscription',
                            description: 'Unlimited high-volume analysis'
                        },
                        unit_amount: 9900, // $99.00
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${settings.url}/dashboard/billing?success=true`,
            cancel_url: `${settings.url}/dashboard/billing?canceled=true`,
            customer_email: user.emailAddresses[0].emailAddress,
            metadata: {
                userId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("[STRIPE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
