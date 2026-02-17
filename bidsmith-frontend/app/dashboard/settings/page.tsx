"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SettingsPage() {
    const [user, setUser] = useState<{
        email: string;
        credits_balance: number;
        api_key: string;
        is_paid_user: boolean;
        free_reports_remaining: number;
        total_reports_generated: number;
    } | null>(null);
    const [revealed, setRevealed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        apiFetch('/auth/me').then(async (res) => {
            if (res.ok) {
                setUser(await res.json());
            } else {
                router.push('/auth/login');
            }
        });
    }, [router]);

    async function apiFetch(path: string, opts?: RequestInit) {
        // Next.js handles proxying cookies if on same domain, 
        // but here we are cross-domain (frontend on Vercel/localhost, backend on Render).
        // Standard Fetch credentials: 'include' is needed.
        return fetch(`${API_BASE}${path}`, { ...opts, credentials: 'include' });
        // NOTE: In the Dashboard page we defined apiFetch without credentials: 'include' 
        // because we relied on headers initially. 
        // Now that we rely on Cookies for /auth/me, we MUST use credentials: 'include'.
        // I need to fix apiFetch in Dashboard too! 
        // Wait, the previous tool call didn't update apiFetch in Dashboard to include credentials!
        // I should fix that in next turn.
    }

    const regenerateKey = async () => {
        if (!confirm("Are you sure? This will invalidate your existing API key immediately.")) return;
        const res = await apiFetch('/api/keys/regenerate', { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setUser(prev => prev ? { ...prev, api_key: data.api_key } : null);
            alert("New API Key generated.");
        }
    };

    if (!user) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 font-mono flex flex-col items-center">
            <div className="w-full max-w-2xl">
                <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
                    <h1 className="text-2xl tracking-tight">SETTINGS</h1>
                    <Link href="/dashboard" className="text-xs text-zinc-600 hover:text-white">← Return to Dashboard</Link>
                </div>

                <div className="space-y-6">
                    <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900/50">
                        <h2 className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Account</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-zinc-600 text-sm mb-1">Status</div>
                                <div className={`font-bold ${user.is_paid_user ? 'text-green-400' : 'text-blue-400'}`}>
                                    {user.is_paid_user ? 'PRO' : 'FREE TRIAL'}
                                </div>
                            </div>
                            <div>
                                <div className="text-zinc-600 text-sm mb-1">Usage</div>
                                <div className="text-white text-sm">
                                    {user.is_paid_user ? (
                                        <span>Balance: <span className="text-green-400 font-bold">${user.credits_balance.toFixed(2)}</span></span>
                                    ) : (
                                        <span>{5 - user.free_reports_remaining}/5 Free Reports Used</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900/50">
                        <h2 className="text-zinc-500 text-xs uppercase tracking-widest mb-4">API Access</h2>
                        <div className="mb-6">
                            <div className="text-zinc-600 text-sm mb-2">Private API Key</div>
                            <div className="flex items-center gap-3">
                                <code className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm flex-1 font-mono text-zinc-300">
                                    {revealed ? user.api_key : user.api_key.slice(0, 10) + '**************************'}
                                </code>
                                <button
                                    onClick={() => setRevealed(!revealed)}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                    {revealed ? 'Hide' : 'Reveal'}
                                </button>
                            </div>
                            <p className="text-zinc-600 text-xs mt-2">
                                Use this key in the <code>X-API-Key</code> header for programmatic access.
                            </p>
                        </div>
                        <button
                            onClick={regenerateKey}
                            className="w-full py-2 border border-red-900/50 text-red-500 hover:bg-red-900/10 rounded transition-colors text-sm"
                        >
                            Regenerate API Key
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
