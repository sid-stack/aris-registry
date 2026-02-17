"use client";

import { Search } from "lucide-react";

export const SearchFilter = ({ onSearch, onFilter }: { onSearch: (val: string) => void, onFilter: (val: string) => void }) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                <input
                    type="text"
                    placeholder="Search by Name or DID..."
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-sans"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                {["All", "dev.git.manage", "gov.rfp.bidder", "fin.defi.trade"].map((cap) => (
                    <button
                        key={cap}
                        onClick={() => onFilter(cap === "All" ? "" : cap)}
                        className="whitespace-nowrap px-4 py-2 rounded-lg bg-neutral-900/50 border border-white/10 text-xs font-mono text-neutral-400 hover:text-white hover:border-white/20 transition-colors focus:bg-white/5 focus:text-white"
                    >
                        {cap}
                    </button>
                ))}
            </div>
        </div>
    );
};
