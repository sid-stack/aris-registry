'use client';

import { useEffect, useState } from 'react';

interface Agent {
    did: string;
    name: string;
    capability: string;
    status: string;
}

const CAPABILITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    'dev.git.manage': { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
    'gov.rfp.bidder': { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
    'fin.defi.trade': { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
    'cloud.aws.monitor': { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
    'chain.solana.validate': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    'devops.vercel.deploy': { bg: 'bg-pink-500/10', text: 'text-pink-400', dot: 'bg-pink-400' },
    'design.figma.audit': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
    'social.discord.moderate': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', dot: 'bg-indigo-400' },
};

function getCapabilityStyle(cap: string) {
    return CAPABILITY_COLORS[cap] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', dot: 'bg-zinc-400' };
}

function AgentInitials({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return (
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-xs px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600"
        >
            {copied ? '✓ copied' : 'copy'}
        </button>
    );
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [filtered, setFiltered] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [activeCap, setActiveCap] = useState('All');

    // Fetch agents
    useEffect(() => {
        const load = async () => {
            const API_BASE = 'https://aris-registry-api.onrender.com';
            try {
                const res = await fetch(`${API_BASE}/api/agents`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setAgents(data.agents ?? []);
                setFiltered(data.agents ?? []);
            } catch {
                setError('Could not reach registry. Is the backend running?');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Filter whenever search or capability changes
    useEffect(() => {
        let result = agents;
        if (activeCap !== 'All') {
            result = result.filter(a => a.capability === activeCap);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                a => a.name.toLowerCase().includes(q) || a.did.toLowerCase().includes(q) || a.capability.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [search, activeCap, agents]);

    // Unique capabilities for filter tabs
    const capabilities = ['All', ...Array.from(new Set(agents.map(a => a.capability)))];

    return (
        <div className="min-h-screen bg-black text-white">

            {/* ── Header ── */}
            <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <a href="/" className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(37,99,235,0.5)]">
                                <span className="font-bold text-white text-xs">B</span>
                            </div>
                            <span className="font-bold text-sm text-white">BidSmith</span>
                        </a>
                        <span className="text-zinc-700">/</span>
                        <span className="text-zinc-400 text-sm">Agent Registry</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!loading && !error && (
                            <div className="flex items-center gap-2 text-xs text-zinc-500 border border-zinc-800 rounded-full px-3 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                                {agents.length} agents live
                            </div>
                        )}
                        <a href="/dashboard" className="text-xs text-zinc-500 hover:text-white transition-colors border border-zinc-800 rounded-full px-3 py-1">
                            Dashboard →
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">

                {/* ── Title ── */}
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-white mb-1">Agent Registry</h1>
                    <p className="text-zinc-500 text-sm">All active nodes registered on the Aris Protocol network.</p>
                </div>

                {/* ── Search + Filters ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name, capability, or DID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                        />
                    </div>
                </div>

                {/* ── Capability filter tabs ── */}
                <div className="flex gap-2 flex-wrap mb-8">
                    {capabilities.map(cap => (
                        <button
                            key={cap}
                            onClick={() => setActiveCap(cap)}
                            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${activeCap === cap
                                    ? 'bg-white text-black border-white'
                                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
                                }`}
                        >
                            {cap === 'All' ? `All (${agents.length})` : cap}
                        </button>
                    ))}
                </div>

                {/* ── States ── */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-24 rounded-xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
                        ))}
                    </div>
                )}

                {error && (
                    <div className="text-center py-20">
                        <div className="text-red-400 mb-2">⚠ {error}</div>
                        <div className="text-zinc-600 text-sm">Run: <code className="text-zinc-400">python -m uvicorn registry.main:app --reload --port 8000</code></div>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="text-center py-20 text-zinc-600">
                        No agents match your search.
                    </div>
                )}

                {/* ── Agent Grid ── */}
                {!loading && !error && filtered.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map((agent, i) => {
                            const style = getCapabilityStyle(agent.capability);
                            return (
                                <div
                                    key={agent.did}
                                    className="group p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all duration-200"
                                >
                                    <div className="flex items-start gap-4">
                                        <AgentInitials name={agent.name} />
                                        <div className="flex-1 min-w-0">

                                            {/* Name + status */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-white text-sm truncate">{agent.name}</h3>
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                                                    <span className="text-green-500 text-xs">live</span>
                                                </span>
                                            </div>

                                            {/* Capability badge */}
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${style.bg} ${style.text} mb-3`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                {agent.capability}
                                            </div>

                                            {/* DID */}
                                            <div className="flex items-center justify-between gap-2">
                                                <code className="text-xs text-zinc-600 truncate">{agent.did}</code>
                                                <CopyButton text={agent.did} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Count footer ── */}
                {!loading && !error && filtered.length > 0 && (
                    <div className="mt-8 text-center text-xs text-zinc-700">
                        Showing {filtered.length} of {agents.length} registered agents
                    </div>
                )}
            </main>
        </div>
    );
}
