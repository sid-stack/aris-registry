import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';

export async function GET() {
    try {
        const localDevUserId = process.env.LOCAL_DEV_USER_ID;
        const { userId } = await auth();
        const user = await currentUser();
        const resolvedUserId = userId ?? localDevUserId ?? null;

        if (!resolvedUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Find or create user to ensure we have a record
        let dbUser = await User.findOne({ clerkId: resolvedUserId });

        if (!dbUser) {
            // Should have been created by webhook, but for robustness:
            dbUser = await User.create({
                clerkId: resolvedUserId,
                email: user?.emailAddresses?.[0]?.emailAddress ?? 'local-dev@aris.ai',
                credits: localDevUserId ? 999 : 5, // Default trial credits
                credits_balance: localDevUserId ? 999 : 5,
                isPro: false
            });
        }

        return NextResponse.json({
            credits_balance: dbUser.credits_balance ?? dbUser.credits ?? 0,
            credits: dbUser.credits_balance ?? dbUser.credits ?? 0, // Fallback for frontend
            isPro: dbUser.isPro
        });

    } catch (error) {
        console.error('Error fetching credits:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
