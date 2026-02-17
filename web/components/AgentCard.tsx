"use client";

import { motion } from "framer-motion";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Agent {
    did: string;
    name: string;
    capability: string;
    status: string;
}

export const AgentCard = ({ agent }: { agent: Agent }) => {
    const [copied, setCopied] = useState(false);

    const copyDid = () => {
        navigator.clipboard.writeText(agent.did);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ y: -5, boxShadow: "0 10px 40px -10px rgba(255,255,255,0.05)" }}
            className="group relative flex flex-col p-5 bg-neutral-900/50 border border-white/5 rounded-xl transition-all duration-300 hover:border-white/10"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center text-sm font-bold text-white/80 border border-white/5">
                            {agent.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-neutral-900"></span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white group-hover:text-white/90 transition-colors">
                            {agent.name}
                        </h3>
                        <span className="text-xs text-neutral-500 font-mono">
                            {agent.status}
                        </span>
                    </div>
                </div>
                <div className="px-2 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                    {agent.capability}
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <code className="text-[10px] text-neutral-600 font-mono truncate max-w-[180px]">
                    {agent.did}
                </code>
                <button
                    onClick={copyDid}
                    className="p-1.5 rounded-md hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
                    title="Copy DID"
                >
                    {copied ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
            </div>
        </motion.div>
    );
};
