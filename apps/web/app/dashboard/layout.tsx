"use client";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useApiClient } from "@/lib/api-client";
import { BarChart3, CreditCard, LayoutDashboard, Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { fetchWithAuth } = useApiClient();
    const [credits, setCredits] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const loadCredits = async () => {
            try {
                const data = await fetchWithAuth("/api/users/credits");
                setCredits(data.credits_balance);
            } catch (err) {
                console.error("Failed to load credits", err);
            }
        };
        loadCredits();
    }, []);

    const routes = [
        { name: "Registry", path: "/dashboard", icon: LayoutDashboard },
        { name: "Analyze", path: "/dashboard/analyze", icon: Search },
        { name: "Billing", path: "/dashboard/billing", icon: CreditCard },
    ];

    return (
        <div className="flex h-screen bg-black text-white selection:bg-purple-500/30 font-sans">
            {/* Mobile Sidebar Trigger */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-md border border-white/10"
            >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950/50 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-200 ease-in-out
                lg:translate-x-0 lg:static
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-2 mb-10 pl-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
                        <span className="font-bold text-xl tracking-tighter">BidSmith</span>
                    </div>

                    <nav className="space-y-1 flex-1">
                        {routes.map((route) => {
                            const isActive = pathname === route.path;
                            return (
                                <Link
                                    key={route.path}
                                    href={route.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                        ${isActive
                                            ? "bg-white/10 text-white border border-white/5"
                                            : "text-zinc-500 hover:text-white hover:bg-white/5"}
                                    `}
                                >
                                    <route.icon size={18} />
                                    {route.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto space-y-6 pt-6 border-t border-white/10">
                        {/* Credit Widget */}
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                            <div className="text-xs font-medium text-zinc-500 mb-1">
                                BALANCE
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                                    ${credits !== null ? credits.toFixed(2) : "--"}
                                </span>
                                <span className="text-xs text-zinc-400">USD</span>
                            </div>
                            <Link href="/dashboard/billing" className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block">
                                + Add Credits
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                            <UserButton afterSignOutUrl="/" />
                            <div className="text-xs text-zinc-500">
                                Protected Session
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-black relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black -z-10 pointer-events-none" />
                <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
