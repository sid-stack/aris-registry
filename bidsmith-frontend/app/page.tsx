import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
    const { userId } = await auth();

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            {/* ── NAVBAR ── */}
            <nav className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                            <span className="font-bold text-white text-xs">B</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">BidSmith</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <a href="https://aris-registry-api.onrender.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">API Docs</a>
                    </div>
                    <div className="flex items-center gap-4">
                        {userId ? (
                            <Link
                                href="/dashboard"
                                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
                            >
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/sign-in" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="px-5 py-2.5 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <main className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Powered by Aris Protocol
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400">
                        Win government contracts <br /> without the paperwork.
                    </h1>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Automate RFP discovery, requirements analysis, and proposal writing with a decentralized network of AI agents.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                            Launch App
                        </Link>
                        <a
                            href="https://aris-registry-api.onrender.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all backdrop-blur-sm"
                        >
                            Learn About Aris Protocol
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="mt-24 pt-10 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 opacity-60 w-full">
                        {[
                            { value: '$400B+', label: 'Annual Market' },
                            { value: '10x', label: 'Faster Analysis' },
                            { value: '24/7', label: 'Agent Monitoring' },
                            { value: '< 30s', label: 'Time to Insight' },
                        ].map(({ value, label }) => (
                            <div key={label}>
                                <div className="text-2xl font-bold text-white">{value}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* ── HOW IT WORKS ── */}
            <section id="how-it-works" className="relative py-32 px-6 border-t border-white/5">
                <div className="max-w-5xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Three steps. One contract.
                    </h2>
                    <p className="text-gray-500 text-lg">
                        BidSmith handles the entire pre-bid workflow so your team can focus on delivery.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
                    {[
                        {
                            step: '01',
                            title: 'Upload the RFP',
                            body: 'Drop any government solicitation PDF. BidSmith extracts every compliance requirement, deadline, and evaluation criterion automatically.',
                        },
                        {
                            step: '02',
                            title: 'AI Scores Your Fit',
                            body: 'Aris Protocol agents cross-reference the RFP against your capabilities and past performance to generate a win-probability score.',
                        },
                        {
                            step: '03',
                            title: 'Draft the Proposal',
                            body: 'One click generates a structured, compliant proposal draft — ready for your team to review and submit.',
                        },
                    ].map(({ step, title, body }) => (
                        <div
                            key={step}
                            className="relative p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        >
                            <div className="text-5xl font-bold text-white/5 mb-4">{step}</div>
                            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" className="py-32 px-6 border-t border-white/5">
                <div className="max-w-5xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Simple pricing.</h2>
                    <p className="text-gray-500 text-lg">Pay per analysis. No seat fees. No surprises.</p>
                </div>

                <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
                    {/* Free */}
                    <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
                        <div className="text-xs uppercase tracking-widest text-gray-500 mb-4">Starter</div>
                        <div className="text-4xl font-bold text-white mb-1">Free</div>
                        <div className="text-gray-500 text-sm mb-8">5 trial analyses</div>
                        <ul className="space-y-3 text-sm text-gray-400 mb-10">
                            {['RFP upload & scoring', 'Executive summary draft', 'Win probability score', 'Email support'].map(f => (
                                <li key={f} className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                        <Link href="/dashboard" className="block text-center py-3 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors font-medium">
                            Get Started
                        </Link>
                    </div>

                    {/* Pro */}
                    <div className="p-8 rounded-2xl border border-blue-500/30 bg-blue-500/5 relative">
                        <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-blue-600 text-xs font-medium text-white">Scale</div>
                        <div className="text-xs uppercase tracking-widest text-blue-400 mb-4">Pro</div>
                        <div className="text-4xl font-bold text-white mb-1">$0.99<span className="text-lg text-gray-400 font-normal">/analysis</span></div>
                        <div className="text-gray-500 text-sm mb-8">Full access, pay as you go</div>
                        <ul className="space-y-3 text-sm text-gray-400 mb-10">
                            {['Everything in Starter', 'Full proposal generation', 'Compliance matrix export', 'Priority agent routing', 'Dedicated Slack support'].map(f => (
                                <li key={f} className="flex items-center gap-2">
                                    <span className="text-blue-400">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                        <Link href="/dashboard" className="block text-center py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            Subscribe Now
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold">B</span>
                        </div>
                        BidSmith © 2026 · Built on{' '}
                        <a href="https://aris-registry-api.onrender.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors">
                            Aris Protocol
                        </a>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                        <a href="mailto:sporwal@usc.edu" className="hover:text-white transition-colors">Contact</a>
                        <a href="https://aris-registry-api.onrender.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Docs</a>
                        <span className="text-gray-800">Privacy · Terms</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
