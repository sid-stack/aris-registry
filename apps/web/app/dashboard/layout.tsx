"use client";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useApiClient } from "@/lib/api-client";
import { BookOpen, CreditCard, LayoutDashboard, Menu, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { fetchWithAuth } = useApiClient();
    const [credits, setCredits] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/sign-in");
        }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        const loadCredits = async () => {
            try {
                const data = await fetchWithAuth("/users/credits");
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

    const externalLinks = [
        { name: "Docs", href: "https://arislabs.mintlify.app/", icon: BookOpen },
    ];

    return (
        <div className="flex h-screen bg-[#030303] text-white selection:bg-indigo-500/30 font-sans overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[120px]" />
            </div>

            {/* Mobile Sidebar Trigger */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900/80 backdrop-blur-md rounded-md border border-white/10 text-white"
            >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-72 bg-zinc-950/30 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-spring",
                "lg:translate-x-0 lg:static",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full p-6 relative overflow-hidden">
                    {/* Sidebar Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none opacity-50" />

                    <div className="relative z-10 mb-10 pl-2">
                        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/50 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img src="/logo.png" alt="ARIS Labs Logo" className="h-10 w-10 object-contain relative z-10" />
                            </div>
                            <span className="font-bold text-xl tracking-tighter text-white">ARIS Labs</span>
                        </Link>
                    </div>

                    <nav className="space-y-2 flex-1 relative z-10">
                        {routes.map((route) => {
                            const isActive = pathname === route.path;
                            return (
                                <Link
                                    key={route.path}
                                    href={route.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={cn(
                                        "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent",
                                        isActive
                                            ? "bg-white/10 text-white border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                                    )}
                                >
                                    <route.icon size={18} className={cn("transition-colors", isActive ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-400")} />
                                    {route.name}
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                                    )}
                                </Link>
                            );
                        })}

                        <div className="pt-6 mt-6 border-t border-white/5">
                            <div className="px-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2">Resources</div>
                            {externalLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                >
                                    <link.icon size={18} />
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </nav>

                    <div className="relative z-10 mt-auto space-y-4 pt-6">
                        {/* Credit Widget */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/80 to-black/80 p-5 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <CreditCard className="w-12 h-12 text-blue-500 transform rotate-12" />
                            </div>

                            <div className="text-xs font-medium text-zinc-500 mb-2">CURRENT BALANCE</div>
                            <div className="flex items-baseline gap-1 mb-3">
                                <span className="text-3xl font-bold text-white tracking-tight">
                                    ${credits !== null ? credits.toFixed(2) : "--"}
                                </span>
                                <span className="text-xs text-zinc-500 font-medium">USD</span>
                            </div>
                            <Link
                                href="/dashboard/billing"
                                className="block w-full py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-center text-xs font-medium text-blue-300 transition-colors border border-white/5"
                            >
                                Top Up Credits
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
                            <UserButton afterSignOutUrl="/" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-zinc-200">Account</span>
                                <span className="text-xs text-zinc-600">Protected Session</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10">
                <div className="p-8 lg:p-12 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
