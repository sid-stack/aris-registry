import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
    return (
        <div className="bg-black text-white min-h-screen py-20 px-6 font-sans">
            <div className="max-w-3xl mx-auto space-y-12">
                <header className="space-y-4">
                    <Link href="/" className="text-emerald-500 hover:text-emerald-400 text-sm font-semibold tracking-wide uppercase transition-colors">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Terms of Service</h1>
                    <p className="text-zinc-500">Last Updated: February 19, 2026</p>
                </header>

                <div className="prose prose-invert prose-emerald max-w-none space-y-12">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">A. Service Definition & Outcome-Based Billing</h2>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            BidSmith, powered by the ARIS Protocol, operates under a Work-as-a-Service (WaaS) model. Unlike traditional SaaS, users are charged based on the successful delivery of a specific outcome. A "Successful Delivery" is defined as the point at which the BidSmith agent swarm generates a final proposal asset (PDF or Document) based on the user-provided RFP and makes it available for download.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">B. Payment Authorization & Capture</h2>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            By initiating a proposal project, the User authorizes a temporary hold of $500.00 USD on their provided payment method.
                        </p>
                        <ul className="list-disc pl-5 space-y-4 text-zinc-400 mt-4 text-lg">
                            <li><strong className="text-emerald-400">Capture:</strong> This amount is captured automatically upon the successful generation and storage of the final proposal asset.</li>
                            <li><strong className="text-emerald-400">Release:</strong> If the system fails to generate a compliant asset or encounters an unrecoverable agent error, the hold will be released within 72 hours.</li>
                            <li><strong className="text-emerald-400">Finality:</strong> Payment is for the <em>generation</em> of the professional draft. BidSmith does not guarantee the selection or success of the bid in third-party procurement processes.</li>
                        </ul>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">C. Infrastructure & SDK Usage</h2>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            BidSmith utilizes the <code className="bg-zinc-900 border border-white/10 px-2 py-1 rounded text-emerald-400 font-mono text-sm">aris-sdk</code> for all agentic orchestration. Users agree that all interactions are governed by the ARIS Zero-Trust Handshake protocol. Any attempt to reverse-engineer the <code className="bg-zinc-900 border border-white/10 px-2 py-1 rounded text-emerald-400 font-mono text-sm">aris-sdk</code> or bypass the Registry's settlement layer is a violation of these terms.
                        </p>
                    </section>
                </div>

                <footer className="pt-12 border-t border-white/10 text-zinc-500 text-sm font-medium">
                    © 2026 ARIS Registry. All rights reserved. BidSmith and the BidSmith logo are trademarks of the ARIS Protocol ecosystem.
                </footer>
            </div>
        </div>
    );
}
