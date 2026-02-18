"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            if (res.ok) {
                // Cookie set by server
                router.push("/dashboard");
            } else {
                const data = await res.json();
                setError(data.detail || "Signup failed");
            }
        } catch {
            setError("Network error");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-mono">
            <div className="w-full max-w-md border border-zinc-800 rounded-xl p-8 bg-zinc-900/50">
                <div className="flex justify-center mb-6">
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Start with 5 free analyses
                    </span>
                </div>
                <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

                {error && <div className="p-3 mb-4 bg-red-900/30 text-red-400 text-sm rounded border border-red-900">{error}</div>}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded transition-colors">
                        Sign Up
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-500">
                    Already have an account? <Link href="/auth/login" className="text-blue-400 hover:underline">Log in</Link>
                </div>
            </div>
        </div>
    );
}
