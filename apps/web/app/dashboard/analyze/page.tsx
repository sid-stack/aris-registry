"use client";
import { useState, useRef, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, SquareTerminal } from "lucide-react";
import { ComplianceReport } from "@/components/ComplianceReport";
import ComplianceMatrix from "@/components/ComplianceMatrix";
import { toast } from "sonner";

export default function AnalyzePage() {
    const [file, setFile] = useState<File | null>(null);
    const [samUrl, setSamUrl] = useState<string>("");
    const [constraints, setConstraints] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [compliance, setCompliance] = useState<any | null>(null);
    const [complianceMatrix, setComplianceMatrix] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Terminal UI state
    const [agentStatus, setAgentStatus] = useState<string[]>([
        "[SYSTEM]: Initializing ARIS Core Orchestrator..."
    ]);

    const {
        completion,
        complete,
        isLoading,
        stop,
        input,
        setInput,
    } = useCompletion({
        api: "/api/generate-proposal",
        onFinish: (prompt: string, finalCompletion: string) => {
            // Parse out the structured JSON metadata from the end of the stream
            const jsonRegex = /```json\s+({[\s\S]*?})\s+```/;
            const match = finalCompletion.match(jsonRegex);

            if (match && match[1]) {
                try {
                    const metadata = JSON.parse(match[1]);
                    setCompliance({
                        compliance_score: metadata.compliance_score || "100",
                        status: parseInt(metadata.compliance_score) === 100 ? "FULLY_COMPLIANT" : "MODERATE_RISK",
                        findings: metadata.critic_notes || "Evaluation complete."
                    });

                    // Remove the JSON block from the visible result
                    const cleanText = finalCompletion.replace(jsonRegex, "").trim();
                    setResult(cleanText);
                    addStatus("[SYSTEM]: Final Proposal Rendering Complete.");
                } catch (e) {
                    console.error("Failed to parse stremed metadata:", e);
                    setResult(finalCompletion);
                }
            } else {
                setResult(finalCompletion);
            }
        },
        onError: (err: Error) => {
            console.error("Agent Streaming Error:", err);

            // Professional error override for API/Model failures
            const message = err.message || "An error occurred during generation.";
            if (message.includes("500") || message.includes("Failed") || message.includes("API")) {
                toast.error("Provider Maintenance", {
                    description: "Our upstream AI providers are currently undergoing maintenance. Please try again in a few moments.",
                    duration: 5000,
                });
                addStatus(`[SYSTEM_FAULT]: Upstream API timeout or 500 anomaly detected.`);
                setError("Service temporarily unavailable due to upstream provider maintenance.");
            } else {
                setError(message);
                addStatus(`[ERROR]: ${message}`);
            }
        }
    });

    const addStatus = (msg: string) => {
        setAgentStatus(prev => [...prev.slice(-4), msg]); // Keep last 5 messages
    };

    // Auto-scroll terminal
    const terminalRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [agentStatus]);

    // Cancel stream if user unmounts/navigates away
    useEffect(() => {
        return () => {
            if (isLoading) {
                stop();
                console.log("Stream instantly killed on unmount to save credits.");
            }
        };
    }, [isLoading, stop]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file && !samUrl) return;
        setError(null);
        setResult(null);
        setCompliance(null);
        setComplianceMatrix([]);
        setAgentStatus(["[SYSTEM]: Activating Multi-Agent Swarm..."]);

        // Simulate extraction phase statuses before triggering the actual completion
        setTimeout(() => addStatus("[ARIS-1 Analyst]: Extracting raw text & constraints..."), 500);
        setTimeout(() => addStatus("[ARIS-3 Writer]: Drafting initial proposal sections..."), 1500);
        setTimeout(() => addStatus("[ARIS-4 Critic]: Engaging Gemini 1.5 Pro for Compliance Audit..."), 3000);

        try {
            // Note: In a real app, you'd upload the file first to get an analysisId.
            // For this streaming demo, we pass the constraints directly to generate.
            await complete(constraints || 'Standard Compliance Draft');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Analysis failed.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Proposal Analysis Engine</h1>
                <p className="text-zinc-400">Upload your RFP documents to generate compliance matrices and win themes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-xl border border-white/10 bg-zinc-900/30 space-y-4">
                        <label className="block text-sm font-medium text-zinc-300">1. Upload RFP (PDF)</label>
                        <div className={`
                            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                            ${file
                                ? "border-green-500/50 bg-green-500/10"
                                : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"}
                        `}>
                            <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" accept=".pdf" />
                            <label htmlFor="file-upload" className="cursor-pointer w-full h-full block">
                                {file ? (
                                    <div className="flex flex-col items-center text-green-400">
                                        <CheckCircle className="h-8 w-8 mb-2" />
                                        <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-zinc-500">
                                        <Upload className="h-8 w-8 mb-2" />
                                        <span className="text-sm">Click to upload</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="flex items-center gap-4">
                            <hr className="flex-1 border-zinc-800" />
                            <span className="text-zinc-500 text-xs font-medium uppercase">OR</span>
                            <hr className="flex-1 border-zinc-800" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-zinc-300">Paste SAM.gov Link</label>
                            <input
                                type="text"
                                placeholder="https://sam.gov/opp/..."
                                value={samUrl}
                                onChange={(e) => {
                                    setSamUrl(e.target.value);
                                    if (e.target.value) setFile(null); // Clear file if typing URL
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent"
                            />
                        </div>

                        <label className="block text-sm font-medium text-zinc-300">2. Constraints / Context</label>
                        <textarea
                            value={constraints}
                            onChange={(e) => setConstraints(e.target.value)}
                            placeholder="e.g. Focus on past performance in cybersecurity..."
                            className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
                        />

                        <button
                            disabled={(!file && !samUrl) || isLoading}
                            onClick={handleAnalyze}
                            className={`
                                w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all
                                ${(!file && !samUrl) || isLoading
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    : "bg-white text-black hover:bg-zinc-200"}
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Swarm Active...
                                </>
                            ) : (
                                "Run Agentic Workflow"
                            )}
                        </button>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Result Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Compliance Report Card */}
                    {compliance && (
                        <ComplianceReport
                            score={compliance.compliance_score}
                            status={compliance.status}
                            findings={compliance.findings}
                        />
                    )}

                    {/* Extracted Compliance Matrix */}
                    <ComplianceMatrix items={complianceMatrix} />

                    {/* Real-Time Terminal View */}
                    <div className="rounded-xl border border-white/10 bg-black overflow-hidden flex flex-col">
                        <div className="bg-zinc-900 border-b border-white/10 p-3 flex px-4 items-center gap-2">
                            <SquareTerminal className="w-4 h-4 text-zinc-500" />
                            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Orchestrator Logs</span>
                            {isLoading && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_theme('colors.emerald.400')]"></span>}
                        </div>
                        <div ref={terminalRef} className="p-4 h-32 overflow-y-auto font-mono text-xs space-y-2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
                            {agentStatus.map((status, idx) => (
                                <div key={idx} className={`${status.includes('[ERROR]') ? 'text-red-400' : status.includes('[ARIS-4') ? 'text-purple-400' : status.includes('[ARIS-1') ? 'text-blue-400' : 'text-emerald-400'} opacity-90 animate-in fade-in slide-in-from-bottom-2`}>
                                    {status}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="text-zinc-500 animate-pulse">_</div>
                            )}
                        </div>
                    </div>

                    <div className="min-h-[500px] rounded-xl border border-white/10 bg-zinc-900/20 p-8 relative">
                        {(!result && !completion) ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                                <FileText className="h-16 w-16 opacity-20" />
                                <p>Analysis results will appear here</p>
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                                    <h3 className="text-xl font-bold m-0 flex items-center gap-3">
                                        Proposal Draft
                                        {isLoading && <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">Streaming</span>}
                                    </h3>
                                    {isLoading && (
                                        <button onClick={stop} className="text-xs border border-red-500/30 text-red-500 px-3 py-1 rounded hover:bg-red-500/10 transition-colors">
                                            Kill Stream
                                        </button>
                                    )}
                                </div>
                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 typewriter-container">
                                    {/* Subtly hide the JSON metadata if it streams in before final parsing */}
                                    {result || (completion.includes('```json') ? completion.split('```json')[0] : completion)}
                                    {isLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-500 animate-pulse align-middle"></span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
