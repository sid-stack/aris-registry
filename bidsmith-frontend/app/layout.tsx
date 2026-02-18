import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

export const metadata: Metadata = {
    title: 'BidSmith — AI Co-Pilot for Government Contracting',
    description: 'Analyze RFPs, score win probability, and generate compliant proposal drafts. Powered by the Aris Protocol multi-agent network.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className={cn(inter.variable, firaCode.variable, 'bg-black text-white min-h-screen font-sans antialiased')}>
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
