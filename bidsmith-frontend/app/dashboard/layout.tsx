import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <aside className="w-56 shrink-0 border-r border-zinc-900 flex flex-col py-6 px-4 sticky top-0 h-screen">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mb-8 px-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.5)]">
                        <span className="font-bold text-white text-xs">B</span>
                    </div>
                    <span className="font-bold text-white">BidSmith</span>
                </Link>

                {/* Nav */}
                <nav className="flex-1 space-y-1">
                    {[
                        { label: 'Overview', href: '/dashboard', icon: '⬡', status: 'live' },
                        { label: 'Analyze RFP', href: '/dashboard', icon: '↑', status: 'live' }, // Single page app for now
                        { label: 'Billing', href: '/dashboard/billing', icon: '💳', status: 'live' },
                        { label: 'Past Bids', href: '/dashboard/history', icon: '◷', status: 'coming-soon' },
                        { label: 'Settings', href: '/dashboard/settings', icon: '⚙', status: 'coming-soon' },
                    ].map(({ href, label, icon, status }) => (
                        <div key={label}>
                            {status === 'live' ? (
                                <Link
                                    href={href}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-sm"
                                >
                                    <span className="text-base">{icon}</span>
                                    {label}
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 cursor-not-allowed text-sm">
                                    <span className="text-base opacity-50">{icon}</span>
                                    {label} <span className="text-[10px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800">SOON</span>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User */}
                <div className="flex items-center gap-3 px-2 pt-4 border-t border-zinc-900">
                    <UserButton afterSignOutUrl="/" />
                    <span className="text-xs text-zinc-500 truncate">Account</span>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-8 max-w-4xl">
                {children}
            </main>
        </div>
    );
}
