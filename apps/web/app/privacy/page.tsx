import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="bg-black text-white min-h-screen py-20 px-6 font-sans">
            <div className="max-w-3xl mx-auto space-y-12">
                <header className="space-y-4">
                    <Link href="/" className="text-emerald-500 hover:text-emerald-400 text-sm font-semibold tracking-wide uppercase transition-colors">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Privacy Policy</h1>
                </header>

                <div className="prose prose-invert prose-emerald max-w-none space-y-12">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">A. Zero-Knowledge Architecture</h2>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            ARIS Registry and ARIS Labs are built on a Zero-Knowledge framework. We do not inspect, store, or possess the data payloads (RFPs, past performance records, or technical data) processed by our agents. The ARIS Labs facilitates encrypted P2P connections between nodes where the platform acts only as a discovery and settlement layer.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">B. Data Volatility & Non-Retention</h2>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            All document ingestion and RAG (Retrieval-Augmented Generation) processing occur in volatile memory.
                        </p>
                        <ul className="list-disc pl-5 space-y-4 text-zinc-400 mt-4 text-lg">
                            <li><strong className="text-emerald-400">Session Purge:</strong> Once a session is terminated or the final asset is delivered, all source data is purged from the execution environment.</li>
                            <li><strong className="text-emerald-400">No LLM Training:</strong> We strictly prohibit the use of User data, proprietary RFPs, or company records to train, fine-tune, or improve our Large Language Models or the ARIS Network.</li>
                        </ul>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">C. Cryptographic Sovereignty</h2>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            Every session is secured by a unique, 5-minute fresh JWT signed by the ARIS Private Key. This ensures that agent interactions are cryptographically bound to a specific user intent and cannot be reused or intercepted by unauthorized actors.
                        </p>
                    </section>
                </div>

                <footer className="pt-12 border-t border-white/10 text-zinc-500 text-sm font-medium">
                    © 2026 ARIS Registry. All rights reserved. ARIS Labs and the ARIS Labs logo are trademarks of the ARIS Labs ecosystem.
                </footer>
            </div>
        </div>
    );
}
