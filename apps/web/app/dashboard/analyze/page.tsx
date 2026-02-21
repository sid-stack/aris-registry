import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';
import ChatInterface from './ChatInterface';

export default async function AnalyzeServerPage() {
    const localDevUserId = process.env.LOCAL_DEV_USER_ID;
    const { userId } = await auth();
    const resolvedUserId = userId ?? localDevUserId ?? null;

    if (!resolvedUserId) {
        redirect('/sign-in');
    }

    await connectDB();
    const dbUser = await User.findOne({ clerkId: resolvedUserId });

    const fallbackCredits = localDevUserId ? 999 : 0;
    const credits = dbUser?.credits_balance ?? fallbackCredits;

    if (credits <= 0) {
        redirect('/dashboard/billing');
    }

    return (
        <ChatInterface initialCredits={credits} />
    );
}
