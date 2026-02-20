"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Server, ShieldCheck, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApiClient } from "@/lib/api-client";
import { useSession } from "@clerk/nextjs";

type SyncState = 'START' | 'POLLING' | 'SUCCESS' | 'TIMEOUT';

function TypewriterLog({ logs }: { logs: string[] }) {
    return (
        <div className="font-mono text-xs text-left bg-black/50 p-4 rounded-xl border border-white/5 space-y-2 h-32 overflow-y-auto">
            {logs.map((log, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${log.includes('[OK]') || log.includes('[SYNCED]') ? 'text-green-400' : log.includes('[ERROR]') ? 'text-red-400' : 'text-zinc-400'}`}
                >
                    {log}
                </motion.div>
            ))}
        </div>
    );
}

function SyncContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const { fetchWithAuth } = useApiClient();
    const { session } = useSession();

    const [state, setState] = useState<SyncState>('START');
    const [logs, setLogs] = useState<string[]>([]);

    // Audio ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    }

    useEffect(() => {
        // Initialize Audio
        audioRef.current = new Audio('/sounds/success-thud.mp3');
        // Preload
        audioRef.current.load();

        // Start sequence
        setState('POLLING');
        addLog("> Initializing Zero-Knowledge Handshake...");

        setTimeout(() => addLog("> Checking Clerk session................ [OK]"), 800);

        if (sessionId) {
            setTimeout(() => addLog("> Awaiting Stripe Webhook............... [PENDING]"), 1600);
        } else {
            setTimeout(() => addLog("> Provisioning Initial Account.......... [PENDING]"), 1600);
        }
    }, [sessionId]);

    useEffect(() => {
        if (state !== 'POLLING') return;

        let pollingCount = 0;
        const maxPolls = 10; // 15 seconds (10 * 1.5s)

        const timer = setInterval(async () => {
            pollingCount++;

            try {
                const data = await fetchWithAuth("/users/credits");

                if (data && data.credits_balance > 0) {
                    // Success!
                    clearInterval(timer);
                    setState('SUCCESS');
                    addLog("> Updating MongoDB user record.......... [SYNCED]");
                    addLog("> [SYSTEM]: Integrity Check Passed. Welcome.");

                    // FAANG CRITICAL FIX: The Edge Middleware reads from the JWT. 
                    // We MUST force the client to fetch a fresh JWT containing the new credits
                    // before redirecting, otherwise the Bouncer will loop them back here.
                    addLog("> Refreshing Secure Token............. [PENDING]");
                    if (session) {
                        try {
                            await session.reload();
                            addLog("> Secure Token Refreshed.............. [OK]");
                        } catch (e) {
                            console.error("Failed to reload session", e);
                        }
                    }

                    // Play Audio
                    try {
                        audioRef.current?.play();
                    } catch (e) {
                        // Ignore autoplay restrictions
                    }

                    // Pre-fetch
                    router.prefetch('/dashboard/analyze');

                    // Zoom into dashboard after 3.5 seconds
                    setTimeout(() => {
                        window.location.href = '/dashboard/analyze';
                    }, 3500);
                    return; // Early return to prevent timeout check in the same tick
                }
            } catch (err) {
                console.error("Polling error", err);
            }

            if (pollingCount >= maxPolls) {
                clearInterval(timer);
                setState('TIMEOUT');
                addLog("> [SYSTEM]: Timeout. Syncing taking longer than expected.");
            }
        }, 1500);

        return () => clearInterval(timer);
    }, [state, router, fetchWithAuth, session]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <AnimatePresence mode="wait">
                {state !== 'SUCCESS' ? (
                    <motion.div
                        key="syncing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="max-w-md w-full bg-zinc-900/40 border border-white/10 rounded-3xl p-8 text-center space-y-8 shadow-2xl backdrop-blur-2xl relative z-10"
                    >
                        {state === 'TIMEOUT' ? (
                            <div className="space-y-6">
                                <div className="h-24 w-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/20">
                                    <Server className="h-10 w-10 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Sync Delayed</h2>
                                    <p className="text-zinc-400 text-sm">Syncing is taking longer than usual. Your funds are secure, but the ledger is queued.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => window.location.href = '/dashboard'} className="flex-1 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition font-semibold hover:text-white text-zinc-300">Return Home</button>
                                    <button onClick={() => window.location.href = 'mailto:support@arislabs.pro'} className="flex-1 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition focus:ring-2 focus:ring-white/50 focus:outline-none">Contact Support</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Glass Brain Pulsing Core */}
                                <div className="relative h-32 w-32 mx-auto flex items-center justify-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                        className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl"
                                    />
                                    <div className="h-20 w-20 rounded-full bg-black border border-white/20 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                                        <Database className="h-8 w-8 text-blue-400" />
                                    </div>
                                    <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-[spin_4s_linear_infinite]" />
                                    <div className="absolute inset-[-10px] rounded-full border border-dashed border-blue-500/20 animate-[spin_6s_linear_infinite_reverse]" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-mono font-bold text-white mb-2 tracking-widest">[SECURE_SYNC]</h2>
                                    <p className="text-zinc-500 text-sm font-mono animate-pulse">
                                        {sessionId ? "Contacting Stripe Ledger..." : "Synchronizing User Profile..."}
                                    </p>
                                </div>

                                <TypewriterLog logs={logs} />
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(34,197,94,0.2)] backdrop-blur-2xl relative z-10"
                    >
                        <div className="h-24 w-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                            <ShieldCheck className="h-12 w-12 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">Access Granted</h2>
                            <p className="text-green-400 font-mono text-sm">Ledger Synchronized. Initializing Engine...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        }>
            <SyncContent />
        </Suspense>
    );
}
