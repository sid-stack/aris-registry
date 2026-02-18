"use client";
import { useState } from "react";
import { useApiClient } from "@/lib/api-client";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { ComplianceReport } from "@/components/ComplianceReport";

export default function AnalyzePage() {
    const { fetchWithAuth } = useApiClient();
    const [file, setFile] = useState<File | null>(null);
    const [constraints, setConstraints] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [compliance, setCompliance] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        setError(null);
        setResult(null);
        setCompliance(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("constraints", constraints);

        try {
            const response = await fetchWithAuth("/api/analyze/", {
                method: "POST",
                body: formData
            });

            setResult(response.result.ai_analysis);
            if (response.compliance_report) {
                setCompliance(response.compliance_report);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Analysis failed.");
        } finally {
            setIsAnalyzing(false);
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

                        <label className="block text-sm font-medium text-zinc-300">2. Constraints / Context</label>
                        <textarea
                            value={constraints}
                            onChange={(e) => setConstraints(e.target.value)}
                            placeholder="e.g. Focus on past performance in cybersecurity..."
                            className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none"
                        />

                        <button
                            disabled={!file || isAnalyzing}
                            onClick={handleAnalyze}
                            className={`
                                w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all
                                ${!file || isAnalyzing
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    : "bg-white text-black hover:bg-zinc-200"}
                            `}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                                </>
                            ) : (
                                "Run Analysis (0.99 Credits)"
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

                    <div className="min-h-[500px] rounded-xl border border-white/10 bg-zinc-900/20 p-8 relative">
                        {!result ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                                <FileText className="h-16 w-16 opacity-20" />
                                <p>Analysis results will appear here</p>
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                                    <h3 className="text-xl font-bold m-0">Analysis Report</h3>
                                    <button className="text-xs border border-white/10 px-3 py-1 rounded hover:bg-white/10 transition-colors">
                                        Download PDF
                                    </button>
                                </div>
                                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-300">
                                    {result}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
