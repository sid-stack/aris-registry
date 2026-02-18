"use client";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api-client";
import { FileText, Search, Sparkles } from "lucide-react";

interface Agent {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
}

export default function RegistryPage() {
    const { fetchWithAuth } = useApiClient();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAgents = async () => {
            try {
                const data = await fetchWithAuth("/api/registry/");
                setAgents(data);
            } catch (error) {
                console.error("Failed to fetch registry:", error);
            } finally {
                setLoading(false);
            }
        };
        loadAgents();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">AI Registry</h1>
                <p className="text-zinc-400">Deploy autonomous agents to analyze your government contracts.</p>
            </div>

            {/* Search / Filter (Visual only for MVP) */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search agents..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 rounded-xl bg-zinc-900/50 border border-white/5 animate-pulse" />
                    ))
                ) : (
                    agents.map((agent) => (
                        <div key={agent.id} className="group relative p-6 rounded-xl border border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all hover:border-white/20">
                            <div className="absolute top-6 right-6 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/5 transition-colors">
                                <Sparkles className="h-4 w-4 text-purple-400" />
                            </div>

                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 flex items-center justify-center font-bold text-lg">
                                {agent.name.charAt(0)}
                            </div>

                            <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-300 transition-colors">
                                {agent.name}
                            </h3>
                            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                                {agent.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                <span className="text-xs font-mono text-zinc-400 px-2 py-1 bg-white/5 rounded">
                                    {agent.category}
                                </span>
                                <span className="text-sm font-medium">
                                    ${agent.price.toFixed(2)} <span className="text-zinc-600 text-xs">/ run</span>
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
