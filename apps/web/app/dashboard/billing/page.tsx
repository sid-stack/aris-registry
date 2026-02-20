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
        <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <img src="/logo.png" alt="ARIS Labs Logo" className="h-10 w-10 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Billing & AIX</h1>
                        <p className="text-zinc-500 text-sm">Experience Outcome-Based Engineering.</p>
                    </div>
                </div>

                <div className="px-6 py-3 bg-zinc-900 border border-white/10 rounded-2xl flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Balance</span>
                        <span className="text-xl font-mono font-bold text-green-400">
                            ${credits?.toFixed(2) ?? "0.00"}
                        </span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <CreditCard className="h-5 w-5 text-zinc-400" />
                </div>
            </header>

            <AnimatePresence mode="wait">
                {!showOutcomeFlow ? (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {/* Standard Top-up */}
                        <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[2rem] flex flex-col justify-between group hover:border-white/10 transition-all">
                            <div>
                                <div className="p-3 w-fit bg-white/5 rounded-xl mb-6">
                                    <Zap className="h-6 w-6 text-yellow-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Standard Credits</h2>
                                <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                                    Instant top-up for everyday tasks. Pay now, use anytime. High-speed AI execution.
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await fetchWithAuth("/checkout", {
                                            method: "POST",
                                        });
                                        if (response.url) {
                                            window.location.href = response.url;
                                        }
                                    } catch (err) {
                                        alert("Service unavailable.");
                                    }
                                }}
                                className="w-full py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all active:scale-[0.98]"
                            >
                                Get 25 Credits — $20
                            </button>
                        </div>

                        {/* Outcome-Based (THE NEW FLOW) */}
                        <div className="p-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2rem] shadow-2xl shadow-blue-500/10">
                            <div className="p-8 bg-black rounded-[1.9rem] h-full flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 bg-blue-500/20 rounded-bl-2xl text-[10px] font-bold text-blue-300 uppercase tracking-widest border-l border-b border-blue-500/30">
                                    Recommended
                                </div>

                                <div>
                                    <div className="p-3 w-fit bg-blue-500/10 rounded-xl mb-6 border border-blue-500/20">
                                        <Rocket className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Outcome-Based</h2>
                                    <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                                        Hire a Digital Agent for <span className="text-white font-bold">$500</span>. We hold the funds but <span className="text-white underline">only charge you</span> if the job is successfully completed.
                                    </p>
                                </div>

                                <button
                                    onClick={startOutcomeFlow}
                                    className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all active:scale-[0.98]"
                                >
                                    Secure Funds & Start AI
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="flow"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center space-y-12"
                    >
                        {aixStatus === 'authorizing' && clientSecret ? (
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <OutcomeCheckout
                                    clientSecret={clientSecret}
                                    onSuccess={handleAuthSuccess}
                                />
                            </Elements>
                        ) : (
                            <AIXProgress status={aixStatus} />
                        )}

                        {aixStatus === 'captured' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-4"
                            >
                                {finalPdfUrl && (
                                    <a
                                        href={finalPdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-8 py-4 bg-green-500 text-black font-extrabold rounded-2xl hover:bg-green-400 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.3)] active:scale-[0.98]"
                                    >
                                        <Rocket className="h-5 w-5" />
                                        <span>Download Final Bid PDF</span>
                                    </a>
                                )}
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-8 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white font-bold hover:bg-zinc-800 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                    <span>Return to Dashboard</span>
                                </button>
                            </motion.div>
                        )}

                        {aixStatus === 'authorizing' && !clientSecret && (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                                <p className="text-zinc-500 font-mono text-sm">INITIALIZING SECURE HANDSHAKE...</p>
                            </div>
                        )}

                        <button
                            onClick={() => setShowOutcomeFlow(false)}
                            className="text-zinc-600 hover:text-zinc-400 text-sm font-medium transition-colors"
                        >
                            ← Cancel and return
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
