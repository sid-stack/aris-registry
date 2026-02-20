'use client';

import { useEffect, useState } from 'react';

interface Agent {
    id: string;
    name: string;
    description?: string;
    category: string;
    status: string;
}

const CAPABILITY_COLORS: Record<string, { bg: string; text: string; dot: string; spotlight: string }> = {
    'dev': { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400', spotlight: 'rgba(168, 85, 247, 0.15)' },
    'gov': { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400', spotlight: 'rgba(59, 130, 246, 0.15)' },
    'procurement': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', spotlight: 'rgba(16, 185, 129, 0.15)' },
    'compliance': { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400', spotlight: 'rgba(249, 115, 22, 0.15)' },
    'legal': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400', spotlight: 'rgba(234, 179, 8, 0.15)' },
    'finance': { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', spotlight: 'rgba(34, 197, 94, 0.15)' },
    'search': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400', spotlight: 'rgba(6, 182, 212, 0.15)' },
    'data': { bg: 'bg-pink-500/10', text: 'text-pink-400', dot: 'bg-pink-400', spotlight: 'rgba(236, 72, 153, 0.15)' },
    'memory': { bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-400', spotlight: 'rgba(244, 63, 94, 0.15)' },
    'pm': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', dot: 'bg-fuchsia-400', spotlight: 'rgba(217, 70, 239, 0.15)' },
    'comms': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', dot: 'bg-indigo-400', spotlight: 'rgba(99, 102, 241, 0.15)' },
};

function getCapabilityStyle(cap: string) {
    return CAPABILITY_COLORS[cap] ?? { bg: 'bg-zinc-800/80', text: 'text-zinc-400', dot: 'bg-zinc-400', spotlight: 'rgba(255, 255, 255, 0.05)' };
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

export default function AgentRegistry() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [filtered, setFiltered] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [activeCap, setActiveCap] = useState('All');

    // Fetch agents
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/registry');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();

                // Route.ts returns an array natively
                const agentArray = Array.isArray(data) ? data : [];
                setAgents(agentArray);
                setFiltered(agentArray);
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
            result = result.filter(a => a.category === activeCap);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                a => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [search, activeCap, agents]);

    // Unique capabilities for filter tabs
    const capabilities = ['All', ...Array.from(new Set(agents.map(a => a.category)))];

    return (
        <div className="w-full">
            {/* ── Title ── */}
            <div className="mb-10 text-center md:text-left shadow-sm">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2">Live Agent Registry</h2>
                <p className="text-zinc-400 text-sm md:text-base">All active, verified nodes currently operating on the Aris Protocol.</p>
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
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                </div>
                <div className="flex items-center justify-center sm:justify-end">
                    {!loading && !error && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 border border-zinc-800 rounded-full px-4 py-2 bg-black/50">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            {agents.length} agents live
                        </div>
                    )}
                </div>
            </div>

            {/* ── Capability filter tabs ── */}
            <div className="flex gap-2 flex-wrap mb-8 justify-center md:justify-start">
                {capabilities.map(cap => (
                    <button
                        key={cap}
                        onClick={() => setActiveCap(cap)}
                        className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all border ${activeCap === cap
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white hover:bg-zinc-800'
                            }`}
                    >
                        {cap === 'All' ? `All (${agents.length})` : cap}
                    </button>
                ))}
            </div>

            {/* ── States ── */}
            {loading && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-28 rounded-xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
                    ))}
                </div>
            )}

            {error && (
                <div className="text-center py-20 bg-zinc-900/20 rounded-2xl border border-zinc-800">
                    <div className="text-red-400 mb-2">⚠ {error}</div>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="text-center py-20 text-zinc-500 bg-zinc-900/20 rounded-2xl border border-zinc-800">
                    No agents match your search.
                </div>
            )}

            {/* ── Agent Grid ── */}
            {!loading && !error && filtered.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((agent) => {
                        const style = getCapabilityStyle(agent.category);
                        return (
                            <SpotlightCard key={agent.id} agent={agent} style={style} />
                        );
                    })}
                </div>
            )}

            {/* ── Count footer ── */}
            {!loading && !error && filtered.length > 0 && (
                <div className="mt-8 text-center text-xs text-zinc-600">
                    Showing {filtered.length} of {agents.length} registered agents
                </div>
            )}
        </div>
    );
}

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

function SpotlightCard({ agent, style }: { agent: Agent; style: ReturnType<typeof getCapabilityStyle> }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({
        currentTarget,
        clientX,
        clientY,
    }: React.MouseEvent<HTMLDivElement>) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <Link href="/infrastructure" className="block relative group/bento rounded-xl overflow-hidden pointer-events-auto">
            <div
                onMouseMove={handleMouseMove}
                className="relative h-full flex flex-col p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors duration-500 overflow-hidden"
            >
                {/* Spotlight Gradient Layer */}
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-500 group-hover/bento:opacity-100"
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                350px circle at ${mouseX}px ${mouseY}px,
                                ${style.spotlight},
                                transparent 80%
                            )
                        `,
                    }}
                />

                {/* Main Content (Translates up on hover) */}
                <div className="relative z-10 flex flex-col h-full transform-gpu transition-all duration-500 group-hover/bento:-translate-y-6">
                    <div className="flex items-start gap-4 mb-4">
                        <AgentInitials name={agent.name} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-white text-base truncate">{agent.name}</h3>
                                <span className="flex items-center gap-1 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse group-hover/bento:scale-125 transition-transform duration-500 inline-block" />
                                    <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">live</span>
                                </span>
                            </div>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono ${style.bg} ${style.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                {agent.category}
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-zinc-400 mb-6">{agent.description}</p>

                    <div className="flex items-center justify-between gap-2 mt-auto">
                        <code className="text-[10px] px-2 py-1 rounded bg-black/50 text-zinc-500 truncate border border-zinc-800/50">{agent.id}</code>
                        {/* We use a div instead of a button here so it doesn't trigger nested button warnings inside the Link */}
                        <div
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(agent.id); }}
                            className="text-zinc-600 hover:text-zinc-300 transition-colors text-xs px-2 py-1 rounded border border-zinc-800 hover:border-zinc-600 cursor-copy"
                        >
                            copy
                        </div>
                    </div>
                </div>

                {/* Bento Reveal CTA (Fades in at the bottom) */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-6 flex flex-row items-center justify-between translate-y-4 opacity-0 transition-all duration-500 group-hover/bento:translate-y-0 group-hover/bento:opacity-100 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                        Access Agent <span className="text-zinc-400">➔</span>
                    </span>
                    <span className="text-xs font-mono text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
                        Secure
                    </span>
                </div>
            </div>
        </Link>
    );
}
