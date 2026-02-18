import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';

export async function GET() {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Find or create user to ensure we have a record
        let dbUser = await User.findOne({ clerkId: userId });

        if (!dbUser) {
            // Should have been created by webhook, but for robustness:
            dbUser = await User.create({
                clerkId: userId,
                email: user.emailAddresses[0].emailAddress,
                credits: 5, // Default trial credits
                isPro: false
            });
        }

        return NextResponse.json({
            credits: dbUser.credits,
            isPro: dbUser.isPro
        });

    } catch (error) {
        console.error('Error fetching credits:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
