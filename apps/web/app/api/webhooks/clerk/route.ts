import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models'
import { NextResponse } from 'next/server'

interface ClerkUserCreatedData {
    id: string;
    email_addresses?: Array<{ email_address?: string }>;
}

function isClerkUserCreatedData(data: unknown): data is ClerkUserCreatedData {
    if (!data || typeof data !== 'object') return false;
    const candidate = data as { id?: unknown };
    return typeof candidate.id === 'string';
}

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.text()
    const body = payload;

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        })
    }

    const eventType = evt.type;

    if (eventType === 'user.created') {
        if (!isClerkUserCreatedData(evt.data)) {
            return new NextResponse('Invalid webhook payload', { status: 400 });
        }
        const { id, email_addresses } = evt.data;

        // Handle user creation
        await connectDB();

        const email = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : '';

        try {
            // 1. Initialize MongoDB User (5 credits to start)
            await User.updateOne(
                { clerkId: id },
                {
                    $set: {
                        email,
                        credits: 5,
                        credits_balance: 5,
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            );

            // 2. Sync Clerk JWT Metadata immediately for the Bouncer
            const { clerkClient } = await import('@clerk/nextjs/server');
            const client = await clerkClient();
            await client.users.updateUserMetadata(id, {
                publicMetadata: {
                    credits: 5,
                    hasActiveSubscription: false
                }
            });

            console.log(`✅ [CLERK_WEBHOOK] Successfully onboarded user ${id} with 5 credits.`);
        } catch (error) {
            console.error('[CLERK_WEBHOOK] Error syncing user:', error);
            return new NextResponse('Error syncing user', { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
}
