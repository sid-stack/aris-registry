"use client";

import React, { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, Sparkles } from 'lucide-react';

interface OutcomeCheckoutProps {
    clientSecret: string;
    onSuccess: (paymentIntentId: string) => void;
    amount?: number;
}

export default function OutcomeCheckout({ clientSecret, onSuccess, amount = 500 }: OutcomeCheckoutProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
            confirmParams: {
                // We don't want to redirect, we want to stay in-app
                return_url: `${window.location.origin}/dashboard/billing`,
            },
        });

        if (error) {
            setErrorMessage(error.message || "An unexpected error occurred.");
            setIsLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'requires_capture') {
            // paymentIntent.status === 'requires_capture' means the hold was successful!
            onSuccess(paymentIntent.id);
        } else {
            setErrorMessage("Wait, the payment was captured immediately. This should be a manual hold.");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-zinc-900/80 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[100px] rounded-full" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                        <ShieldCheck className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Secure Authorization</h3>
                        <p className="text-sm text-zinc-400">Funds held, only captured on SUCCESS</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                        <PaymentElement options={{ layout: 'tabs' }} />
                    </div>

                    <AnimatePresence>
                        {errorMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
                            >
                                {errorMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        disabled={isLoading || !stripe || !elements}
                        className="group relative w-full py-4 bg-white text-black font-bold rounded-2xl overflow-hidden active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-20 transition-opacity" />
                        <div className="flex items-center justify-center gap-2">
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Sparkles className="h-5 w-5" />
                            )}
                            <span>{isLoading ? "authorizing..." : `Authorize $${amount} & Start AI`}</span>
                        </div>
                    </button>

                    <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest leading-relaxed">
                        powered by stripe <span className="mx-1">•</span> encrypted 256-bit <span className="mx-1">•</span> outcome guaranteed
                    </p>
                </form>
            </div>
        </div>
    );
}
