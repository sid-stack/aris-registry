'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
    const [status, setStatus] = useState('Connecting to Aris Protocol...');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkBackend = async () => {
            try {
                // Pointing to your deployed Python registry
                const response = await fetch('https://aris-registry.onrender.com/health');
                const data = await response.json();
                setStatus(data.status || 'Active');
            } catch (error) {
                setStatus('Protocol Offline - Check Backend Logs');
            } finally {
                setLoading(false);
            }
        };

        checkBackend();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="w-full max-w-4xl">
                <h1 className="text-3xl font-mono mb-8 border-b border-zinc-800 pb-4">
                    SYSTEM://BIDSMITH_DASHBOARD
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900/50">
                        <h2 className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Network Status</h2>
                        <p className={`text-xl font-semibold ${loading ? 'animate-pulse' : 'text-green-400'}`}>
                            {status}
                        </p>
                    </div>

                    <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-900/50">
                        <h2 className="text-sm uppercase tracking-widest text-zinc-500 mb-2">Active Agents</h2>
                        <p className="text-xl font-semibold">03</p>
                    </div>
                </div>

                <div className="mt-8 p-12 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600">
                    No RFPs currently being analyzed. Upload a document to begin.
                </div>
            </div>
        </div>
    );
}
