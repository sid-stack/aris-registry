'use client';

import { useEffect, useState, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
interface AnalysisResult {
    project_title: string;
    agency: string;
    est_value: string;
    deadline: string;
    exec_summary: string;
    win_probability: string;
    match_score: string;
    is_valid_rfp: boolean;
    rejection_reason: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
// In production, NEXT_PUBLIC_API_URL is injected by Render from the backend service.
// In local dev, falls back to localhost:8000.
const API_BASE = 'https://aris-registry-api.onrender.com';

async function apiFetch(path: string, opts?: RequestInit): Promise<Response> {
    return fetch(`${API_BASE}${path}`, opts);
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Dashboard() {
    const [networkStatus, setNetworkStatus] = useState('Connecting to Aris Protocol...');
    const [agentCount, setAgentCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const [uploadState, setUploadState] = useState<'IDLE' | 'ANALYZING' | 'RESULTS'>('IDLE');
    const [logs, setLogs] = useState<string[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [proposalOpen, setProposalOpen] = useState(false);

    const logsEndRef = useRef<HTMLDivElement>(null);

    // ── Startup: health + agent count ─────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const [healthRes, agentsRes] = await Promise.all([
                    apiFetch('/health'),
                    apiFetch('/api/agents'),
                ]);
                if (!healthRes.ok) throw new Error('Backend Error');
                const health = await healthRes.json();
                setNetworkStatus(health.status || 'Active');
                if (agentsRes.ok) {
                    const agentData = await agentsRes.json();
                    setAgentCount(agentData.count ?? 0);
                }
            } catch {
                setNetworkStatus('Protocol Offline — Check Backend Logs');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // ── Auto-scroll logs ───────────────────────────────────────────────────
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // ── File handlers ──────────────────────────────────────────────────────
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) startAnalysis(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file?.type === 'application/pdf') startAnalysis(file);
    };

    // ── Core analysis flow ─────────────────────────────────────────────────
    const startAnalysis = async (file: File) => {
        setUploadState('ANALYZING');
        setLogs([]);
        setProposalOpen(false);

        const sequence = [
            { text: `SYSTEM: Ingesting "${file.name}"...`, delay: 600 },
            { text: 'AGENT_01: Validating document type...', delay: 1800 },
            { text: 'AGENT_02: Parsing solicitation requirements...', delay: 3200 },
            { text: 'AGENT_03: Scoring historical win-rates...', delay: 4800 },
            { text: 'AGENT_01: Drafting executive summary...', delay: 6200 },
            { text: 'SYSTEM: Analysis complete. Generating report...', delay: 7800 },
        ];
        sequence.forEach(({ text, delay }) => {
            setTimeout(() => setLogs(prev => [...prev, text]), delay);
        });

        const formData = new FormData();
        formData.append('file', file);

        const minWait = new Promise(resolve => setTimeout(resolve, 8800));
        const apiCall = apiFetch('/analyze', {
            method: 'POST',
            body: formData,
            headers: {
                'X-API-Key': 'aris_demo_key_2025' // Demo Key
            }
        })
            .then(async res => {
                if (!res.ok) throw new Error('Analysis failed');
                return res.json() as Promise<AnalysisResult>;
            });

        try {
            const [, result] = await Promise.all([minWait, apiCall]);
            setAnalysisResult(result);
            setUploadState('RESULTS');
        } catch (err) {
            console.error('Analysis error:', err);
            setLogs(prev => [...prev, 'SYSTEM_ERROR: Analysis failed. Please retry.']);
            setTimeout(() => setUploadState('IDLE'), 3000);
        }
    };

    const reset = () => {
        setUploadState('IDLE');
        setLogs([]);
        setAnalysisResult(null);
        setProposalOpen(false);
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-mono">
            <div className="w-full max-w-4xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
                    <h1 className="text-2xl tracking-tight">SYSTEM://BIDSMITH_DASHBOARD</h1>
                    <div className="flex items-center gap-4">
                        <a href="/agents" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                            Agent Registry
                        </a>
                        <a href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                            ← Home
                        </a>
                    </div>
                </div>

                {/* Status grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-5 border border-zinc-800 rounded-lg bg-zinc-900/50">
                        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Network Status</div>
                        <div className={`text-lg font-semibold ${loading ? 'animate-pulse text-zinc-400' : 'text-green-400'}`}>
                            {networkStatus}
                        </div>
                    </div>
                    <div className="p-5 border border-zinc-800 rounded-lg bg-zinc-900/50">
                        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Active Agents</div>
                        <div className="text-lg font-semibold">
                            {agentCount === null
                                ? <span className="animate-pulse text-zinc-400">—</span>
                                : <span className="text-white">{String(agentCount).padStart(2, '0')}</span>
                            }
                        </div>
                    </div>
                    <div className="p-5 border border-zinc-800 rounded-lg bg-zinc-900/50">
                        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Model</div>
                        <div className="text-lg font-semibold text-blue-400">gemini-2.5-flash</div>
                    </div>
                </div>

                {/* Dynamic content area */}
                <div
                    className="min-h-[460px] border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50 flex flex-col relative overflow-hidden transition-all duration-300"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                >

                    {/* ── IDLE ── */}
                    {uploadState === 'IDLE' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 mb-6 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Upload RFP Document</h3>
                            <p className="text-zinc-500 mb-8 max-w-sm text-sm leading-relaxed">
                                Drop a government solicitation PDF here or click to browse.
                                Agents are standing by to analyze.
                            </p>
                            <label className="cursor-pointer px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                                Select PDF
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileUpload}
                                />
                            </label>
                            <p className="text-zinc-700 text-xs mt-4">Or drag and drop anywhere in this box</p>
                        </div>
                    )}

                    {/* ── ANALYZING ── */}
                    {uploadState === 'ANALYZING' && (
                        <div className="absolute inset-0 bg-black flex flex-col p-8 text-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                <span className="text-zinc-400 text-xs uppercase tracking-wider">
                                    Aris Protocol // Agents Active
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {logs.map((log, i) => (
                                    <div key={i} className="text-green-400/90">
                                        <span className="text-zinc-600 mr-2 text-xs">
                                            [{new Date().toLocaleTimeString()}]
                                        </span>
                                        {log}
                                    </div>
                                ))}
                                <div className="text-green-400 animate-pulse">▋</div>
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    )}

                    {/* ── RESULTS ── */}
                    {uploadState === 'RESULTS' && analysisResult && !proposalOpen && (
                        <div className="absolute inset-0 p-8 flex flex-col">

                            {/* Rejection banner — only shown when NOT a valid RFP */}
                            {!analysisResult.is_valid_rfp && (
                                <div className="flex items-start gap-3 mb-5 p-4 rounded-lg bg-red-950/40 border border-red-500/50">
                                    <span className="text-red-400 text-lg shrink-0">🚨</span>
                                    <div>
                                        <div className="text-red-400 font-bold text-sm mb-0.5">
                                            Document Rejected — Not a Government RFP
                                        </div>
                                        <div className="text-red-300/70 text-xs">
                                            {analysisResult.rejection_reason || 'This document does not appear to be a government procurement solicitation.'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Result header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex-1 pr-4">
                                    <h3
                                        className={`text-xl font-bold leading-tight mb-1 ${analysisResult.is_valid_rfp ? 'text-white' : 'text-zinc-500'}`}
                                        title={analysisResult.project_title}
                                    >
                                        {analysisResult.project_title}
                                    </h3>
                                    <p className={`text-sm ${analysisResult.is_valid_rfp ? 'text-blue-400' : 'text-zinc-600'}`}>
                                        {analysisResult.agency}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Win Probability</div>
                                    <div className={`text-4xl font-bold ${analysisResult.is_valid_rfp ? 'text-green-400' : 'text-zinc-600'}`}>
                                        {analysisResult.win_probability}
                                    </div>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {[
                                    { label: 'Est. Value', value: analysisResult.est_value },
                                    { label: 'Deadline', value: analysisResult.deadline },
                                    { label: 'Match Score', value: analysisResult.match_score },
                                ].map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className={`p-4 rounded-lg border ${analysisResult.is_valid_rfp
                                            ? 'bg-zinc-900 border-zinc-800'
                                            : 'bg-zinc-950 border-zinc-900'
                                            }`}
                                    >
                                        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{label}</div>
                                        <div className={`font-semibold text-sm ${analysisResult.is_valid_rfp ? 'text-white' : 'text-zinc-600'}`}>
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Exec summary */}
                            <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800 flex-1 overflow-y-auto mb-6">
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                    {analysisResult.is_valid_rfp ? 'Executive Summary Draft' : 'Analysis'}
                                </div>
                                <p className={`leading-relaxed text-sm ${analysisResult.is_valid_rfp ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                    {analysisResult.exec_summary}
                                </p>
                            </div>

                            {/* Actions — Generate Proposal ONLY shown for valid RFPs */}
                            <div className="flex gap-3">
                                {analysisResult.is_valid_rfp ? (
                                    <button
                                        onClick={() => setProposalOpen(true)}
                                        className="flex-1 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-100 transition-colors"
                                    >
                                        Generate Proposal →
                                    </button>
                                ) : (
                                    <div className="flex-1 py-3 bg-red-950/50 border border-red-500/50 text-red-400 font-bold rounded-lg text-center text-sm flex items-center justify-center gap-2">
                                        <span>🚫</span> Upload a valid government RFP to generate a proposal
                                    </div>
                                )}
                                <button
                                    onClick={reset}
                                    className="px-6 py-3 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg hover:border-zinc-500 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── PROPOSAL VIEW ── */}
                    {uploadState === 'RESULTS' && analysisResult && proposalOpen && (
                        <div className="absolute inset-0 p-8 flex flex-col">
                            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                                <div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Proposal Draft</div>
                                    <h3 className="text-lg font-bold text-white">{analysisResult.project_title}</h3>
                                </div>
                                <button
                                    onClick={() => setProposalOpen(false)}
                                    className="text-zinc-500 hover:text-white text-xs border border-zinc-700 rounded px-3 py-1 transition-colors"
                                >
                                    ← Back to Analysis
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-5 text-sm text-zinc-300 leading-relaxed pr-1">
                                <section>
                                    <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-2">1. Executive Summary</h4>
                                    <p>{analysisResult.exec_summary}</p>
                                </section>
                                <section>
                                    <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-2">2. Understanding of Requirements</h4>
                                    <p>
                                        Our team has thoroughly reviewed the solicitation issued by{' '}
                                        <strong className="text-white">{analysisResult.agency}</strong> and
                                        fully understands the scope, objectives, and technical requirements outlined therein.
                                        We are prepared to meet all deliverables within the specified timeline.
                                    </p>
                                </section>
                                <section>
                                    <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-2">3. Technical Approach</h4>
                                    <p className="text-zinc-500 italic">[Describe your methodology, tools, and how you will meet each requirement.]</p>
                                </section>
                                <section>
                                    <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-2">4. Pricing Summary</h4>
                                    <p>
                                        Estimated contract value range:{' '}
                                        <strong className="text-white">{analysisResult.est_value}</strong>.
                                        Final pricing will be provided in the attached cost volume.
                                    </p>
                                </section>
                                <section>
                                    <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-2">5. Compliance Matrix</h4>
                                    <p className="text-zinc-500 italic">[Auto-generated compliance matrix available on Pro plan.]</p>
                                </section>
                            </div>

                            <div className="mt-6 flex gap-3 border-t border-zinc-800 pt-4">
                                <button
                                    onClick={() => {
                                        const content = [
                                            `BIDSMITH PROPOSAL DRAFT`,
                                            `Project: ${analysisResult.project_title}`,
                                            `Agency: ${analysisResult.agency}`,
                                            `Est. Value: ${analysisResult.est_value}`,
                                            `Deadline: ${analysisResult.deadline}`,
                                            `\n1. EXECUTIVE SUMMARY\n${analysisResult.exec_summary}`,
                                            `\n2. UNDERSTANDING OF REQUIREMENTS\n[Complete this section with your approach.]`,
                                            `\n3. TECHNICAL APPROACH\n[Describe your methodology.]`,
                                            `\n4. PRICING SUMMARY\nEstimated value: ${analysisResult.est_value}`,
                                        ].join('\n');
                                        const blob = new Blob([content], { type: 'text/plain' });
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(blob);
                                        a.download = `BidSmith_Proposal_${analysisResult.project_title.replace(/\s+/g, '_').slice(0, 40)}.txt`;
                                        a.click();
                                    }}
                                    className="flex-1 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-100 transition-colors"
                                >
                                    ↓ Download Draft
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
                    BidSmith · Powered by Aris Protocol · <a href="/" className="hover:text-zinc-500 transition-colors">← Back to home</a>
                </p>
            </div>
        </div>
    );
}
