// Button import removed as not used
import Link from "next/link";
import { ArrowRight, FileText, Settings, ShieldCheck, Zap } from "lucide-react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col bg-black text-white selection:bg-purple-500/30">
            {/* Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6 md:px-12">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
                        BidSmith
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                        <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="#protocol" className="hover:text-white transition-colors">Protocol</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                                    Log in
                                </button>
                            </SignInButton>
                            <SignInButton mode="modal">
                                <button className="h-9 px-4 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors">
                                    Start Free
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <Link href="/dashboard">
                                <button className="h-9 px-4 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors">
                                    Dashboard
                                </button>
                            </Link>
                        </SignedIn>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black -z-10" />
                    <div className="mx-auto max-w-4xl text-center space-y-8">
                        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                            Aris Protocol v1.0.3 Live
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent pb-2">
                            The Operating System for <br className="hidden md:block" /> Government Contracts.
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            BidSmith uses autonomous AI agents to analyze RFPs, identify compliance risks, and generate winning proposals in seconds—not weeks.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="h-12 px-8 rounded-full bg-white text-black font-semibold text-lg hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                                        Start Analyzing
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <Link href="/dashboard">
                                    <button className="h-12 px-8 rounded-full bg-white text-black font-semibold text-lg hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                                        Go to Dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </Link>
                            </SignedIn>
                            <button className="h-12 px-8 rounded-full border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors backdrop-blur-sm">
                                View Demo
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 border-t border-white/5">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: FileText,
                                    title: "RFP Analysis",
                                    desc: "Instant breakdown of requirements, deliverable dates, and compliance matrices."
                                },
                                {
                                    icon: Zap,
                                    title: "AI Generation",
                                    desc: "Draft technical volumes, past performance, and executive summaries automatically."
                                },
                                {
                                    icon: ShieldCheck,
                                    title: "Compliance Check",
                                    desc: "Real-time validation against FAR/DFARS clauses and proposal instructions."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="group p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="h-12 w-12 rounded-lg bg-zinc-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <feature.icon className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                    <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/10 py-12 bg-black">
                <div className="mx-auto max-w-6xl px-6 text-center text-zinc-500 text-sm">
                    <p>&copy; 2024 Aris Labs Inc. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
