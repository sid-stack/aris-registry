'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function BidSmithHome() {
    const { getToken } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const startNewBid = async () => {
        setLoading(true);
        const token = await getToken();

        // In local development or generic deployment, assuming backend is accessible via NEXT_PUBLIC_API_URL or relative
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/bidsmith/conversations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: `RFP Bid ${new Date().toLocaleDateString()}`
            })
        });

        if (res.ok) {
            const data = await res.json();
            router.push(`/bidsmith/chat/${data.id}`);
        } else {
            console.error("Failed to start bid", await res.text());
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        BidSmith 🤝
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Your AI co-pilot for government RFP responses.
                        Powered by the decentralized Aris agent network.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600">45%</div>
                            <div className="text-gray-600">Faster Response Time</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <div className="text-3xl font-bold text-green-600">$2.5M</div>
                            <div className="text-gray-600">Won in Contracts</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <div className="text-3xl font-bold text-purple-600">100%</div>
                            <div className="text-gray-600">Compliance Rate</div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <h2 className="text-2xl font-semibold mb-4">
                            Start Your Winning Proposal
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Upload an RFP and let our specialized agents collaborate to create
                            a compliant, competitive response.
                        </p>
                        <button
                            onClick={startNewBid}
                            disabled={loading}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Start New Bid →'}
                        </button>
                    </div>

                    {/* How it works */}
                    <div className="mt-16">
                        <h3 className="text-2xl font-semibold text-center mb-8">
                            Powered by Aris Agent Network
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { name: 'RFP Analyzer', emoji: '🔍' },
                                { name: 'Requirements Extractor', emoji: '📋' },
                                { name: 'Technical Writer', emoji: '✍️' },
                                { name: 'Pricing Strategist', emoji: '💰' },
                                { name: 'Compliance Checker', emoji: '✅' },
                                { name: 'Past Performance', emoji: '📊' },
                                { name: 'Executive Summary', emoji: '📝' },
                                { name: 'Proposal Writer', emoji: '🚀' }
                            ].map((agent, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-4 text-center">
                                    <div className="text-3xl mb-2">{agent.emoji}</div>
                                    <div className="text-sm font-medium">{agent.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
