"use client";
import { useEffect, useState } from "react";
import { useApiClient } from "@/lib/api-client";
import { CreditCard, Loader2 } from "lucide-react";

export default function BillingPage() {
    const { fetchWithAuth } = useApiClient();
    const [credits, setCredits] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCredits = async () => {
            try {
                const data = await fetchWithAuth("/api/users/credits");
                setCredits(data.credits_balance);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadCredits();
    }, []);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <img src="/logo.png" alt="BidSmith Logo" className="h-12 w-12 object-contain" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription & Credits</h1>
                    <p className="text-zinc-400">Manage your billing and top-up analysis credits.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Balance Card */}
                <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl">
                    <p className="text-zinc-400 text-sm font-medium mb-1">CURRENT BALANCE</p>
                    <div className="flex items-baseline gap-1">
                        {loading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                        ) : (
                            <>
                                <h2 className="text-4xl font-mono font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                                    ${credits?.toFixed(2) ?? "0.00"}
                                </h2>
                                <span className="text-zinc-500 text-sm">USD</span>
                            </>
                        )}
                    </div>
                    <p className="mt-4 text-xs text-zinc-500 flex items-center gap-2">
                        <CreditCard className="h-3 w-3" />
                        Each analysis costs 1 Credit
                    </p>
                </div>

                {/* Top Up Card (Stripe Integration) */}
                <div className="p-6 bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 rounded-2xl flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Get More Analyses</h2>
                        <p className="text-zinc-300 text-sm mb-6">Instantly add 25 credits to your account for just $20.</p>
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                const response = await fetchWithAuth("/api/checkout/create-session", {
                                    method: "POST",
                                });
                                if (response.url) {
                                    window.location.href = response.url;
                                } else {
                                    alert("Failed to start checkout");
                                }
                            } catch (err) {
                                alert("Payment system is currently busy. Please try again.");
                                console.error(err);
                            }
                        }}
                        className="w-full py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                        Buy 25 Credits — $20.00
                    </button>
                    <p className="mt-2 text-xs text-zinc-400 text-center">Secure payment via Stripe</p>
                </div>
            </div>
        </div>
    );
}
