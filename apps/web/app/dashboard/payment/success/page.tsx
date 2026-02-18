"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Trigger confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    // Auto-redirect countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push("/dashboard");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black/95 text-white p-4">
            <div className="max-w-md w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">

                {/* Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative">
                    <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/20">
                        <CheckCircle2 className="h-10 w-10 text-green-400" />
                    </div>

                    <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                        Payment Successful!
                    </h1>

                    <p className="text-zinc-400 text-lg mt-2">
                        Thank you for your purchase. Your credits have been added to your account.
                    </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Transaction ID</span>
                        <span className="font-mono text-zinc-300">
                            {sessionId ? sessionId.slice(-8) : "—"}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Status</span>
                        <span className="text-green-400 font-medium flex items-center gap-1">
                            Confirmed <CheckCircle2 className="h-3 w-3" />
                        </span>
                    </div>
                </div>

                <div className="space-y-3 pt-4">
                    <Link
                        href="/dashboard"
                        className="block w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                        Return to Dashboard
                        <ArrowRight className="h-4 w-4" />
                    </Link>

                    <p className="text-xs text-zinc-600">
                        Redirecting in {countdown} seconds...
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black/95 text-white flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-green-500" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
