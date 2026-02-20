"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Shield, Lock, Cpu, DollarSign, Menu, X, FileText, Zap } from "lucide-react";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import AgentRegistry from "@/components/AgentRegistry";

export default function Home() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleCheckout = async (planId: string) => {
        if (!isSignedIn) {
            router.push('/sign-up');
            return;
        }
        // ... (checkout logic placeholder)
        alert("Redirecting to checkout...");
    };

    return (
        <div className="flex min-h-screen flex-col bg-black text-white selection:bg-emerald-500/30 font-sans">
            {/* Navbar */}
            <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6 md:px-12 max-w-7xl mx-auto">
                    <Link href="/" className="flex items-center gap-4 group">
                        <img
                            src="/logo.png"
                            alt="BidSmith Logo"
                            className="h-16 w-16 object-contain drop-shadow-[0_0_10px_rgba(52,211,153,0.3)] group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="font-bold text-2xl tracking-widest uppercase text-white group-hover:text-emerald-400 transition-colors">BidSmith</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-bold tracking-widest uppercase text-white">
                        <Link href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it Works</Link>
                        <Link href="#security" className="hover:text-emerald-400 transition-colors">Security</Link>
                        <Link href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {isLoaded && !isSignedIn && (
                            <>
                                <SignInButton mode="modal">
                                    <button className="text-sm font-bold tracking-wider uppercase text-white hover:text-emerald-400 transition-colors hidden md:block">
                                        Log in
                                    </button>
                                </SignInButton>
                                <SignInButton mode="modal">
                                    <button className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold tracking-wider uppercase hover:bg-white/10 hover:border-emerald-500/50 transition-all shadow-[0_0_15px_-5px_var(--tw-shadow-color)] shadow-emerald-500/20">
                                        Secure Dashboard
                                    </button>
                                </SignInButton>
                            </>
                        )}
                        {isLoaded && isSignedIn && (
                            <Link href="/dashboard">
                                <button className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-bold tracking-wider uppercase hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">
                                    Dashboard
                                </button>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="md:hidden absolute top-16 left-0 right-0 bg-black/95 border-b border-white/10 p-6 backdrop-blur-3xl"
                        >
                            <nav className="flex flex-col gap-6 text-lg font-bold tracking-wider uppercase text-white">
                                <Link href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="hover:text-emerald-400 transition-colors">How it Works</Link>
                                <Link href="#security" onClick={() => setIsMenuOpen(false)} className="hover:text-emerald-400 transition-colors">Security</Link>
                                <Link href="#pricing" onClick={() => setIsMenuOpen(false)} className="hover:text-emerald-400 transition-colors">Pricing</Link>
                                <div className="h-px bg-white/10 my-2" />
                                <SignInButton mode="modal">
                                    <button className="text-left hover:text-emerald-400 transition-colors">Log in</button>
                                </SignInButton>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main className="flex-1 px-4 py-8 md:px-12 md:py-16">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-900/20 opacity-30 blur-[120px] rounded-full pointe-events-none -z-10" />

                    <div className="mx-auto max-w-5xl text-center space-y-8 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="group inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300 backdrop-blur-md hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-200 transition-all duration-300 cursor-default"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse shadow-[0_0_10px_theme('colors.emerald.400')] group-hover:bg-emerald-300 transition-colors" />
                            Powered by ARIS Zero-Knowledge Protocol
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white pb-2 leading-[1.1] group cursor-default"
                        >
                            <span className="transition-colors duration-300 group-hover:text-emerald-200">Stop Formatting. Start Winning.</span> <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500 group-hover:from-emerald-300 group-hover:to-cyan-300 group-hover:drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                                Autonomous Proposal Writing.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
                        >
                            BidSmith uses a swarm of specialized AI agents to ingest 100-page RFPs, cross-reference your past performance, and draft fully compliant technical volumes in minutes.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                        >
                            <SignInButton mode="modal">
                                <div className="relative group cursor-pointer inline-block">
                                    <button className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95">
                                        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>

                                        <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
                                            <div className="relative z-10 flex items-center space-x-2">
                                                <span className="transition-all duration-500 group-hover:translate-x-1">Let's get started</span>
                                                <svg
                                                    className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1"
                                                    aria-hidden="true"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        clipRule="evenodd"
                                                        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                                                        fillRule="evenodd"
                                                    ></path>
                                                </svg>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            </SignInButton>

                            <button className="h-12 px-8 rounded-lg border border-white/10 text-zinc-300 font-medium hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Read the Security Brief
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="pt-8 text-zinc-500 text-sm flex items-center justify-center gap-6"
                        >
                            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No Subscription</span>
                            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> $500 per win</span>
                            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Zero Data Retention</span>
                        </motion.div>
                    </div>
                </section>

                {/* Embedded Agent Registry */}
                <section id="registry" className="py-24 border-t border-white/5 bg-zinc-900/30">
                    <div className="mx-auto max-w-7xl px-6">
                        <AgentRegistry />
                    </div>
                </section>

                {/* Agentic Workflow Bento Grid */}
                <section id="how-it-works" className="py-24 border-t border-white/5 bg-zinc-950/50">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="mb-16">
                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">Work-as-a-Service.</h2>
                            <p className="text-zinc-400 max-w-xl">You aren&apos;t buying software. You&apos;re hiring a digital employee swarm that works while you sleep.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Zero-Knowledge Ingestion */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black p-8 hover:border-emerald-500/30 transition-colors"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Lock className="h-32 w-32" />
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center mb-6">
                                    <Lock className="h-6 w-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">Zero-Knowledge Ingestion</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm">
                                    Drop your messy PDF into our zero-knowledge vault. Your proprietary company data is cryptographically sealed and <span className="text-emerald-400 font-medium">never</span> used to train external models.
                                </p>
                            </motion.div>

                            {/* Card 2: Swarm Orchestration */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black p-8 hover:border-blue-500/30 transition-colors"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Cpu className="h-32 w-32" />
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center mb-6">
                                    <Cpu className="h-6 w-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">Swarm Orchestration</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm">
                                    BidSmith deploys a dedicated compliance agent, a technical writer, and a pricing analyst that debate and construct your proposal collaboratively in real-time.
                                </p>
                            </motion.div>

                            {/* Card 3: Outcome-Based Billing */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black p-8 hover:border-purple-500/30 transition-colors"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign className="h-32 w-32" />
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center mb-6">
                                    <DollarSign className="h-6 w-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">Outcome-Based Billing</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm">
                                    We align our incentives with yours. No subscriptions. No hidden fees. <span className="text-purple-400 font-medium">$500 flat fee</span> only when you submit a successful bid generated by our agents.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Infrastructure Banner */}
                <section className="py-24 border-t border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black -z-10" />
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="rounded-3xl border border-white/10 bg-zinc-900/30 backdrop-blur-xl p-8 md:p-16 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />

                            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400 mb-6 font-mono">
                                ARIS_PROTOCOL_SECURE_CONNECTION_ESTABLISHED
                            </div>

                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6">Enterprise-Grade by Default.</h2>
                            <p className="text-zinc-400 max-w-2xl mx-auto mb-10 text-lg">
                                BidSmith isn&apos;t a thin wrapper. It runs on the ARIS Network—a decentralized Model Context Protocol (MCP) gateway. This means military-grade data routing, mathematically verifiable session tokens, and zero hallucinations.
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl font-bold text-white">100%</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Uptime</div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl font-bold text-white">AES-256</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Encryption</div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl font-bold text-white">SOC 2</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Compliant</div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl font-bold text-white">&lt; 50ms</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest">Latency</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <footer className="border-t border-zinc-800 py-12 bg-black text-zinc-500 text-xs">
                <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-zinc-800 flex items-center justify-center">
                                <span className="font-bold text-white/50 text-[10px]">B</span>
                            </div>
                            <span className="font-semibold">&copy; 2026 BidSmith AI. All rights reserved.</span>
                        </div>
                        <span className="hidden md:inline text-zinc-700">|</span>
                        <Link href="/infrastructure" className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Powered by Aris Protocol
                        </Link>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
