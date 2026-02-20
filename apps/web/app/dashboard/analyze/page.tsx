import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models';
import ChatInterface from './ChatInterface';

export default async function AnalyzeServerPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    await connectDB();
    const dbUser = await User.findOne({ clerkId: userId });

    const credits = dbUser?.credits_balance || 0;

    if (credits <= 0) {
        redirect('/dashboard/billing');
    }

    return (
        <ChatInterface initialCredits={credits} />
    );
}
