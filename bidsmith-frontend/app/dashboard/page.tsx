'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── NEW: Type definitions matching our new Next.js API ───
interface AnalysisResult {
    id: string;
    projectTitle: string;
    agency: string;
    estValue: string;
    deadline: string;
    winScore: number;
    matchScore: string;
    execBriefing: string;
    winThemes: string[];
    keyRisks: string[];
    complianceItems: string[];
    proposalDraft: string | null;
    isValidRfp: boolean;
    rejectionReason?: string;
}

export default function Dashboard() {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();

    // Stats
    const [stats, setStats] = useState({
        credits: 5, // Default for free tier
        analyzed: 0,
        won: 0
    });

    // UI State
    const [uploadState, setUploadState] = useState<'IDLE' | 'UPLOADING' | 'PROCESSING' | 'RESULTS'>('IDLE');
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [proposalOpen, setProposalOpen] = useState(false);
    const [error, setError] = useState('');

    // Load user stats
    useEffect(() => {
        if (isLoaded && user) {
            fetch('/api/user/credits')
                .then(res => res.json())
                .then(data => {
                    if (data.credits !== undefined) {
                        setStats(prev => ({ ...prev, credits: data.credits }));
                    }
                })
                .catch(err => console.error('Failed to load credits:', err));
        }
    }, [isLoaded, user]);

    // Drag & Drop
    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === 'application/pdf') {
            setFile(droppedFile);
            setError('');
        } else {
            setError('Please upload a valid PDF.');
        }
    }, []);

    // ─── ACTION: Upload & Analyze ───
    const handleAnalyze = async () => {
        if (!file) return;
        setUploadState('UPLOADING');
        setProgress(10);

        try {
            // Fake progress for UX
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 90));
            }, 500);

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/generate-analysis', {
                method: 'POST',
                body: formData,
            });

            clearInterval(interval);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Analysis failed');
            }

            const data = await res.json();
            setAnalysisResult(data); // data includes _id, projectTitle, etc.
            setProgress(100);
            setTimeout(() => setUploadState('RESULTS'), 500);

        } catch (err: any) {
            setError(err.message);
            setUploadState('IDLE');
        }
    };

    // ─── ACTION: Generate Proposal (Paid) ───
    const handleGenerateProposal = async () => {
        if (!analysisResult) return;
        try {
            const res = await fetch('/api/generate-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysisId: analysisResult.id }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else if (data.error) alert(data.error);
        } catch (e) {
            alert('Failed to initiate proposal generation.');
        }
    };

    const reset = () => {
        setFile(null);
        setUploadState('IDLE');
        setProgress(0);
        setAnalysisResult(null);
        setProposalOpen(false);
    };

    if (!isLoaded) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
    if (!user) {
        router.push('/sign-in');
        return null; // Redirecting
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            {/* ── NAVBAR ── */}
            <nav className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                            <span className="font-bold text-white text-xs">B</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight">BidSmith</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 text-sm text-zinc-400">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span>{5 - (stats.credits || 0)} Free Analyses Left</span> {/* Approximate logic */}
                            </div>
                        </div>
                        <div className="h-6 w-px bg-zinc-800"></div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{user.fullName || user.emailAddresses[0].emailAddress}</span>
                            <button
                                onClick={() => signOut(() => router.push('/'))}
                                className="text-xs text-zinc-500 hover:text-white transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-6 md:p-12">
                {/* ── HEADER ── */}
                <div className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        Welcome back, <span className="text-blue-500">{user.firstName || 'Hunter'}</span>.
                    </h1>
                    <p className="text-zinc-500">Ready to secure your next government contract?</p>
                </div>

                {/* ── MAIN CARD ── */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl min-h-[500px] relative overflow-hidden backdrop-blur-sm">

                    {/* ── UPLOAD VIEW ── */}
                    {uploadState === 'IDLE' && (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={onDrop}
                            className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all"
                        >
                            <div className="w-24 h-24 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 border border-zinc-700 shadow-inner">
                                <span className="text-4xl">📄</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Upload Solicitation</h2>
                            <p className="text-zinc-500 mb-8 max-w-md text-center">
                                Drag & drop your PDF here, or click to browse. We'll extract intelligence, identify win themes, and score your fit.
                            </p>

                            <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                id="file-upload"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setFile(e.target.files[0]);
                                        setError('');
                                    }
                                }}
                            />
                            <label
                                htmlFor="file-upload"
                                className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            >
                                Select PDF
                            </label>
                            {file && (
                                <div className="mt-6 flex items-center gap-3 px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
                                    <span className="text-sm text-zinc-300">{file.name}</span>
                                    <button
                                        onClick={handleAnalyze}
                                        className="text-blue-400 hover:text-blue-300 text-sm font-bold ml-2"
                                    >
                                        Analyze →
                                    </button>
                                </div>
                            )}
                            {error && <p className="mt-4 text-red-400 text-sm bg-red-950/30 px-3 py-1 rounded border border-red-900/50">{error}</p>}
                        </div>
                    )}

                    {/* ── PROCESSING VIEW ── */}
                    {(uploadState === 'UPLOADING' || uploadState === 'PROCESSING') && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                            <div className="w-full max-w-md space-y-4">
                                <div className="flex justify-between text-xs uppercase tracking-widest text-zinc-500">
                                    <span>Analyzing RFP...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="text-center text-zinc-600 text-sm pt-2">
                                    identifying win themes · checking compliance · calculating score
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── RESULTS VIEW ── */}
                    {uploadState === 'RESULTS' && analysisResult && !proposalOpen && (
                        <div className="absolute inset-0 p-0 md:flex">
                            {/* Left Panel: Score & Metadata */}
                            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-800 p-8 flex flex-col bg-zinc-900/20">
                                <div className="mb-6">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{analysisResult.agency}</div>
                                    <h2 className="text-xl font-bold leading-snug">{analysisResult.projectTitle}</h2>
                                </div>

                                {/* Score Ring */}
                                <div className="flex-1 flex flex-col items-center justify-center py-6">
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="64" cy="64" r="56" fill="none" stroke="#27272a" strokeWidth="8" />
                                            <circle
                                                cx="64" cy="64" r="56" fill="none"
                                                stroke={analysisResult.winScore >= 70 ? '#4ade80' : '#facc15'}
                                                strokeWidth="8"
                                                strokeDasharray="351.86"
                                                strokeDashoffset={351.86 - (351.86 * analysisResult.winScore) / 100}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold">{analysisResult.winScore}</span>
                                            <span className="text-[10px] text-zinc-500">WIN PROBABILITY</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between py-2 border-b border-zinc-800">
                                        <span className="text-zinc-500">Est. Value</span>
                                        <span className="font-mono text-white">{analysisResult.estValue}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-zinc-800">
                                        <span className="text-zinc-500">Deadline</span>
                                        <span className="text-white">{analysisResult.deadline}</span>
                                    </div>
                                    <button onClick={reset} className="w-full mt-4 text-zinc-500 hover:text-white text-xs transition-colors">
                                        ← Upload Another RFP
                                    </button>
                                </div>
                            </div>

                            {/* Right Panel: Content */}
                            <div className="flex-1 p-8 overflow-y-auto">
                                {/* Invalid RFP Warning */}
                                {!analysisResult.isValidRfp && (
                                    <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg text-red-200 text-sm">
                                        ⚠️ <strong>Attention:</strong> {analysisResult.rejectionReason}
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Executive Briefing</h3>
                                    <p className="text-zinc-300 leading-relaxed text-sm">{analysisResult.execBriefing}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest mb-3">Win Themes</h3>
                                        <ul className="space-y-2">
                                            {analysisResult.winThemes.map((theme, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                                                    <span className="text-green-500 mt-1">✓</span> {theme}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-3">Key Risks</h3>
                                        <ul className="space-y-2">
                                            {analysisResult.keyRisks.map((risk, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                                                    <span className="text-yellow-500 mt-1">!</span> {risk}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* ── PROPOSAL ACTION ── */}
                                {analysisResult.proposalDraft ? (
                                    <div className="p-6 bg-green-900/10 border border-green-800/30 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-green-400 font-bold">Proposal Draft Ready</h3>
                                            <span className="text-xs bg-green-900/40 text-green-300 px-2 py-0.5 rounded">Pro Unlocked</span>
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-4">You have already generated a proposal for this RFP.</p>
                                        <button
                                            onClick={() => setProposalOpen(true)}
                                            className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                                        >
                                            View & Download Proposal
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-blue-900/10 border border-blue-800/30 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-blue-400 font-bold">Generate Winning Proposal</h3>
                                            <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">Pro Feature</span>
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-4">
                                            Use ARIS-4 to write a compliant, 5-section proposal draft tailored to this solicitation.
                                        </p>
                                        <button
                                            onClick={handleGenerateProposal}
                                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                                        >
                                            Generate Draft — $0.99
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── PROPOSAL VIEW OVERLAY ── */}
                    {uploadState === 'RESULTS' && analysisResult && proposalOpen && (
                        <div className="absolute inset-0 p-8 flex flex-col bg-zinc-900 z-20 overflow-hidden">
                            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4 shrink-0">
                                <div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Proposal Draft</div>
                                    <h3 className="text-lg font-bold text-white max-w-xl truncate">{analysisResult.projectTitle}</h3>
                                </div>
                                <button
                                    onClick={() => setProposalOpen(false)}
                                    className="text-zinc-500 hover:text-white text-xs border border-zinc-700 rounded px-3 py-1 transition-colors"
                                >
                                    ← Back to Analysis
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 text-sm text-zinc-300 leading-relaxed pr-2 pb-20">
                                <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                                    {analysisResult.proposalDraft}
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent flex gap-3">
                                <button
                                    onClick={() => {
                                        if (!analysisResult.proposalDraft) return;
                                        const blob = new Blob([analysisResult.proposalDraft], { type: 'text/plain' });
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(blob);
                                        a.download = `BidSmith_Proposal_${analysisResult.projectTitle.substring(0, 20)}.md`;
                                        a.click();
                                    }}
                                    className="flex-1 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg"
                                >
                                    ↓ Download Markdown
                                </button>
                                <button
                                    onClick={reset}
                                    className="px-6 py-3 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg hover:border-zinc-500 transition-colors"
                                >
                                    New RFP
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-zinc-700 text-xs mt-6">
                    BidSmith · Powered by Aris Protocol · <Link href="/" className="hover:text-zinc-500 transition-colors">← Back to home</Link>
                </p>
            </div>
        </div>
    );
}
