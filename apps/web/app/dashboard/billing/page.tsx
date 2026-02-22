"use client";

import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api-client";
import { CreditCard, Loader2, Zap, Rocket, CheckCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import OutcomeCheckout from "@/components/OutcomeCheckout";
import AIXProgress, { AIXStatus } from "@/components/AIXProgress";
import { motion, AnimatePresence } from "framer-motion";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BillingPage() {
    const { fetchWithAuth } = useApiClient();
    const [credits, setCredits] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // Outcome-Based Flow State
    const [showOutcomeFlow, setShowOutcomeFlow] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [aixStatus, setAixStatus] = useState<AIXStatus>('authorizing');
    const [finalPdfUrl, setFinalPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        const loadCredits = async () => {
            try {
                const data = await fetchWithAuth("/users/credits");
                setCredits(data.credits_balance);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadCredits();
    }, []);

    const startOutcomeFlow = async () => {
        try {
            setShowOutcomeFlow(true);
            setAixStatus('authorizing');
            const data = await fetchWithAuth("/checkout/authorize", {
                method: "POST",
                body: JSON.stringify({ plan_id: "outcome_bid" }),
            });
            setClientSecret(data.client_secret);
            setPaymentIntentId(data.id);
        } catch (err) {
            console.error(err);
            alert("Fallback: Failed to initialize secure hold.");
            setShowOutcomeFlow(false);
        }
    };

    const handleAuthSuccess = async (id: string) => {
        setPaymentIntentId(id);
        setAixStatus('drafting');

        // MOCK AGENT EXECUTION (The "Aris Handshake")
        // In production, this would be a real long-polling or webhook event
        setTimeout(async () => {
            try {
                // Agent returned SUCCESS
                setAixStatus('delivering');

                // ATOMIC DELIVERY REQUEST
                const response = await fetchWithAuth("/delivery/deliver", {
                    method: "POST",
                    body: JSON.stringify({
                        intent_id: id,
                        proposal_text: "BID PROPOSAL SUMMARY\n\nProject: RFP-2026-ALPHA\nAgent: Aris Lead Orchestrator\nStatus: Verified\n\nThis proposal was generated autonomously and verified for compliance."
                    }),
                });

                setFinalPdfUrl(response.pdf_url);
                setAixStatus('captured');
            } catch (err) {
                console.error("Delivery/Capture failed:", err);
                setAixStatus('failed');
            }
        }, 3000);
    };

    return (
        <div className="space-y-10 max-w-5xl mx-auto p-6 md:p-12 relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl border border-white/10 shadow-xl shadow-black/50">
                        <img src="/logo.png" alt="ARIS Labs Logo" className="h-12 w-12 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1">Billing & AIX</h1>
                        <p className="text-zinc-400 text-base font-medium">Experience Outcome-Based Engineering.</p>
                    </div>
                </div>

                <div className="px-8 py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center gap-6 shadow-2xl">
                    <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Available Balance</span>
                        <span className="text-3xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                            ${credits?.toFixed(2) ?? "0.00"}
                        </span>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="p-2 bg-white/5 rounded-xl">
                        <CreditCard className="h-6 w-6 text-zinc-400" />
                    </div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {!showOutcomeFlow ? (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10"
                    >
                        {/* Standard Top-up */}
                        <div className="p-10 bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] flex flex-col justify-between group hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/5">
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                                        <Zap className="h-8 w-8 text-yellow-500" />
                                    </div>
                                    <span className="text-zinc-500 text-sm font-semibold uppercase tracking-wider">Pay-as-you-go</span>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Standard Credits</h2>
                                <p className="text-zinc-400 text-base mb-10 leading-relaxed font-medium">
                                    Instant top-up for everyday iterative tasks. Pay now, use anytime. Access to high-speed AI execution and basic data mapping.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <li className="flex items-center gap-3 text-zinc-300 text-sm"><CheckCircle className="h-5 w-5 text-yellow-500" /> 25 Analysis Iterations</li>
                                    <li className="flex items-center gap-3 text-zinc-300 text-sm"><CheckCircle className="h-5 w-5 text-yellow-500" /> Standard Generation Speed</li>
                                    <li className="flex items-center gap-3 text-zinc-300 text-sm"><CheckCircle className="h-5 w-5 text-yellow-500" /> No Expiration Date</li>
                                </ul>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await fetchWithAuth("/checkout", { method: "POST" });
                                        if (response.url) window.location.href = response.url;
                                    } catch (err) {
                                        alert("Service unavailable.");
                                    }
                                }}
                                className="w-full py-5 bg-zinc-800/80 text-white text-lg font-bold rounded-2xl hover:bg-zinc-700 transition-all duration-300 active:scale-[0.98] border border-white/5 shadow-inner"
                            >
                                Get 25 Credits — $20
                            </button>
                        </div>

                        {/* Outcome-Based (THE NEW FLOW) */}
                        <div className="relative p-[2px] rounded-[2.5rem] overflow-hidden group">
                            {/* Animated Gradient Border */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative p-10 bg-zinc-950 rounded-[2.4rem] h-full flex flex-col justify-between overflow-hidden">
                                {/* Ambient inner glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />

                                <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-l from-blue-500/20 to-transparent rounded-bl-3xl border-b border-l border-blue-500/20">
                                    <span className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] shadow-blue-500">Recommended Flagship</span>
                                </div>

                                <div>
                                    <div className="p-4 w-fit bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl mb-8 border border-blue-500/30">
                                        <Rocket className="h-8 w-8 text-blue-400" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-4">Outcome-Based AIX</h2>
                                    <p className="text-zinc-400 text-base mb-10 leading-relaxed font-medium">
                                        Hire a dedicated Digital Enterprise Agent for <span className="text-white font-bold">$500</span>. We hold the funds but <span className="text-blue-400 font-bold border-b border-blue-400 border-dashed">only charge you</span> if the job is successfully completed. Zero risk.
                                    </p>

                                    <ul className="space-y-4 mb-10 relative z-10">
                                        <li className="flex items-center gap-3 text-zinc-300 text-sm"><CheckCircle className="h-5 w-5 text-blue-400" /> Elite Orchestrator Engine</li>
                                        <li className="flex items-center gap-3 text-zinc-300 text-sm"><CheckCircle className="h-5 w-5 text-blue-400" /> Guaranteed Delivery or Refund</li>
                                        <li className="flex items-center gap-3 text-zinc-300 text-sm"><CheckCircle className="h-5 w-5 text-blue-400" /> Human-in-the-loop Reviews</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={startOutcomeFlow}
                                    className="relative w-full py-5 bg-white text-black text-lg font-black rounded-2xl transition-all duration-300 active:scale-[0.98] overflow-hidden group/btn hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                                    Secure Funds & Start AI
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="flow"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 relative z-10"
                    >
                        {aixStatus === 'authorizing' && clientSecret ? (
                            <div className="w-full max-w-xl bg-zinc-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                                    <OutcomeCheckout
                                        clientSecret={clientSecret}
                                        onSuccess={handleAuthSuccess}
                                    />
                                </Elements>
                            </div>
                        ) : (
                            <div className="w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10">
                                <AIXProgress status={aixStatus} />
                            </div>
                        )}

                        {aixStatus === 'captured' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col sm:flex-row items-center gap-6 mt-12"
                            >
                                {finalPdfUrl && (
                                    <a
                                        href={finalPdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold rounded-2xl hover:opacity-90 transition-all flex items-center gap-3 shadow-[0_0_40px_rgba(16,185,129,0.4)] active:scale-[0.98]"
                                    >
                                        <Rocket className="h-6 w-6" />
                                        <span className="text-lg">Download Final PDF</span>
                                    </a>
                                )}
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-10 py-5 bg-zinc-800 border-2 border-zinc-700 rounded-2xl text-white font-bold hover:bg-zinc-700 hover:border-zinc-500 transition-all flex items-center gap-3 text-lg"
                                >
                                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                                    <span>Return to Dashboard</span>
                                </button>
                            </motion.div>
                        )}

                        {aixStatus === 'authorizing' && !clientSecret && (
                            <div className="flex flex-col items-center gap-6 mt-12">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                </div>
                                <p className="text-zinc-400 font-mono text-sm tracking-widest">INITIALIZING SECURE HANDSHAKE...</p>
                            </div>
                        )}

                        <button
                            onClick={() => setShowOutcomeFlow(false)}
                            className="mt-12 text-zinc-500 hover:text-white text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                            ← Cancel and return to overview
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
