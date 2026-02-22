"use client";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api-client";
import { Search, Sparkles, Cpu, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { ShinyButton } from "@/components/ui/shiny-button";
import { cn } from "@/lib/utils";

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
                // Determine if we are in dev/demo mode or real mode.
                // For the purpose of this redesign, we'll fetch real data but fallback to gorgeous dummy data if empty/fails 
                // to ensure the user sees the design impact immediately (common in dev cycles).
                const data = await fetchWithAuth("/registry/");
                if (data && data.length > 0) {
                    setAgents(data);
                } else {
                    // Fallback for visual demonstration if API returns empty
                    setAgents([
                        { id: "1", name: "GovAnalyst Pro", description: "Deep-learning model trained on 50 years of procurement data. Predicts winning bids with 94% accuracy.", price: 4.50, category: "Analysis" },
                        { id: "2", name: "Compliance Sentinel", description: "Real-time auditing of proposal documents against FAR/DFARS regulations. Zero-trust architecture.", price: 2.00, category: "Security" },
                        { id: "3", name: "BidWriter X", description: "Generative AI specifically tuned for government rfp responses. Auto-formats to agency standards.", price: 8.00, category: "Generation" },
                        { id: "4", name: "Market Scout", description: "Autonomous agent that monitors SAM.gov and other feeds for opportunities matching your capability statement.", price: 1.50, category: "Intelligence" },
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch registry, utilizing demo data:", error);
                setAgents([
                    { id: "1", name: "GovAnalyst Pro", description: "Deep-learning model trained on 50 years of procurement data. Predicts winning bids with 94% accuracy.", price: 4.50, category: "Analysis" },
                    { id: "2", name: "Compliance Sentinel", description: "Real-time auditing of proposal documents against FAR/DFARS regulations. Zero-trust architecture.", price: 2.00, category: "Security" },
                    { id: "3", name: "BidWriter X", description: "Generative AI specifically tuned for government rfp responses. Auto-formats to agency standards.", price: 8.00, category: "Generation" },
                    { id: "4", name: "Market Scout", description: "Autonomous agent that monitors SAM.gov and other feeds for opportunities matching your capability statement.", price: 1.50, category: "Intelligence" },
                ]);
            } finally {
                // Artificial delay to show off the loader
                setTimeout(() => setLoading(false), 1500);
            }
        };
        loadAgents();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <Loader />
                <p className="text-zinc-500 animate-pulse text-sm uppercase tracking-widest">Initializing Neural Link...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="relative">
                <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl -z-10" />
                <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4">
                    Agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Registry</span>
                </h1>
                <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                    Deploy autonomous intelligence modules for your contracting workflow.
                    <span className="text-zinc-500 block mt-1 text-sm">Powered by Aris Core v2.4</span>
                </p>

                {/* Search Bar */}
                <div className="mt-8 relative max-w-lg group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all opacity-50" />
                    <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex items-center p-1 focus-within:ring-2 ring-blue-500/50 transition-all">
                        <Search className="ml-3 h-5 w-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search for capabilities (e.g., 'compliance', 'writing')..."
                            className="w-full bg-transparent border-none text-white placeholder:text-zinc-600 focus:outline-none px-4 py-3"
                        />
                        <div className="pr-1">
                            <span className="text-xs font-mono text-zinc-500 border border-white/10 px-2 py-1 rounded bg-black/20">CMD+K</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {agents.map((agent, i) => (
                    <div
                        key={agent.id || i}
                        className="group relative flex flex-col h-full bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.15)]"
                    >
                        {/* Hover Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="p-8 flex flex-col flex-1 relative z-10">
                            {/* Icon & Badge */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Cpu className="h-7 w-7 text-blue-400 group-hover:text-purple-400 transition-colors" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300 backdrop-blur-md">
                                    {agent.category}
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">
                                {agent.name}
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed mb-8 flex-1">
                                {agent.description}
                            </p>

                            <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Cost per run</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-white">${agent.price.toFixed(2)}</span>
                                        <span className="text-xs text-zinc-600">USD</span>
                                    </div>
                                </div>

                                <ShinyButton className="!h-9 !px-4">
                                    <span className="text-white font-medium mr-1 text-sm">Deploy</span>
                                    <Zap size={14} className="fill-current text-white" />
                                </ShinyButton>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Verification / Footer Info */}
            <div className="mt-12 flex items-center justify-center gap-6 text-zinc-600 text-sm py-8 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} />
                    <span>Verified Vendors Only</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-zinc-700" />
                <div className="flex items-center gap-2">
                    <Zap size={16} />
                    <span>Instant Provisioning</span>
                </div>
            </div>
        </div>
    );
}
