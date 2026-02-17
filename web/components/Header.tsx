"use client";

import { motion } from "framer-motion";

export const Header = ({ count = 0 }: { count?: number }) => {
    return (
        <header className="flex items-center justify-between py-6 px-4 md:px-8 border-b border-white/10 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold tracking-tight text-white">
                    Aris Network Registry
                </h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 mx-4">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">
                        {count} Agents Active
                    </span>
                </div>
            </div>
        </header>
    );
};
