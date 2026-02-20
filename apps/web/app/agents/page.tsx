'use client';

import AgentRegistry from '@/components/AgentRegistry';

export default function AgentsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* ── Header ── */}
            <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/logo.png" alt="BidSmith Logo" className="h-8 w-8 object-contain" />
                            <span className="font-bold text-lg text-white">BidSmith</span>
                        </a>
                        <span className="text-zinc-700">/</span>
                        <span className="text-zinc-400 text-sm">Agent Registry</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/dashboard" className="text-xs text-zinc-500 hover:text-white transition-colors border border-zinc-800 rounded-full px-3 py-1">
                            Dashboard →
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 md:px-12 md:py-16">
                <AgentRegistry />
            </main>
        </div>
    );
}
