import React from 'react';
import Link from 'next/link';
import { Cpu, Shield, Activity, Network } from 'lucide-react';

export default function Infrastructure() {
    return (
        <div className="bg-black text-white min-h-screen py-20 px-6 font-sans">
            <div className="max-w-4xl mx-auto space-y-16">
                <header className="space-y-4">
                    <Link href="/" className="text-emerald-500 hover:text-emerald-400 text-sm font-semibold tracking-wide uppercase transition-colors">
                        ← Back to Home
                    </Link>
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Technical Documentation</h1>
                        <p className="text-xl text-zinc-400">The Agentic Economy Infrastructure</p>
                    </div>
                </header>

                <div className="grid gap-12">
                    <section className="space-y-6 relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 p-8 backdrop-blur-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Network className="w-24 h-24 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="text-emerald-500">A.</span> The ARIS Protocol Gateway
                        </h2>
                        <div className="space-y-4 text-zinc-400 leading-relaxed text-lg">
                            <p>
                                ARIS serves as the "USB-C for AI," utilizing the Model Context Protocol (MCP) to standardize how BidSmith connects to specialized data sources.
                            </p>
                            <ul className="grid gap-4 md:grid-cols-2 mt-4">
                                <li className="bg-black/50 p-4 rounded-lg border border-white/5">
                                    <strong className="text-white block mb-1">Discovery</strong>
                                    The Registry indexes agents by capability (e.g., <code className="bg-zinc-900 border border-white/10 px-2 py-1 rounded text-emerald-400 font-mono text-xs">compliance.check</code>, <code className="bg-zinc-900 border border-white/10 px-2 py-1 rounded text-emerald-400 font-mono text-xs">technical.write</code>).
                                </li>
                                <li className="bg-black/50 p-4 rounded-lg border border-white/5">
                                    <strong className="text-white block mb-1">Handshake</strong>
                                    Uses the <code className="bg-zinc-900 border border-white/10 px-2 py-1 rounded text-emerald-400 font-mono text-xs">aris-sdk</code> to issue RS256-signed session tokens, ensuring a secure "handshake" between the requester and the worker agent.
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-6 relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 p-8 backdrop-blur-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Cpu className="w-24 h-24 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="text-blue-500">B.</span> Advanced RAG & Swarm Orchestration
                        </h2>
                        <div className="space-y-4 text-zinc-400 leading-relaxed text-lg">
                            <p>
                                BidSmith employs a Multi-Agent Swarm for proposal generation:
                            </p>
                            <div className="space-y-3 mt-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-400 font-bold">1</div>
                                    <div>
                                        <strong className="text-white block">The Analyst Agent</strong>
                                        Ingests the RFP via the <code className="bg-zinc-900 border border-white/10 px-2 py-1 rounded text-emerald-400 font-mono text-sm">aris-sdk</code> and performs semantic chunking and token budgeting.
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-400 font-bold">2</div>
                                    <div>
                                        <strong className="text-white block">The Compliance Agent</strong>
                                        Cross-references the draft against the "Instructions to Offerors" (Section L) and "Evaluation Criteria" (Section M).
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-400 font-bold">3</div>
                                    <div>
                                        <strong className="text-white block">The Writer Agent</strong>
                                        Synthesizes past performance data into a high-scoring technical narrative.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6 relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/30 p-8 backdrop-blur-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Activity className="w-24 h-24 text-purple-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="text-purple-500">C.</span> Security Observability (The Glass Brain)
                        </h2>
                        <div className="space-y-4 text-zinc-400 leading-relaxed text-lg">
                            <p>
                                Users can monitor the agentic reasoning process through our "Glass Brain" interface. This provides real-time visibility into tool-calling, context retrieval, and decision-making logs without ever exposing the sensitive document content to the ARIS Registry itself.
                            </p>
                        </div>
                    </section>
                </div>

                <footer className="pt-12 border-t border-white/10 text-zinc-500 text-sm font-medium">
                    © 2026 ARIS Registry. All rights reserved. BidSmith and the BidSmith logo are trademarks of the ARIS Protocol ecosystem.
                </footer>
            </div>
        </div>
    );
}
