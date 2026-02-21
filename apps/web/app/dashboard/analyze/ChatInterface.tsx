"use client";
import React, { useEffect, useRef, useState } from "react";
// Use the canonical ai/react import which has full Next.js compatibility in 3.0+
import { useChat } from "ai/react";
import type { Message } from "ai";
import { Paperclip, Send, Loader2, Cpu, SquareTerminal, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatInterfaceProps {
    initialCredits: number;
}

const APPROX_CHARS_PER_TOKEN = 4;
const MAX_CONTEXT_TOKENS = 120000;
const MAX_MESSAGE_TOKENS = 16000;

function estimateTokens(text: string): number {
    return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
}

function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}

function truncateToTokenBudget(text: string, maxTokens: number): string {
    const normalized = normalizeWhitespace(text);
    if (estimateTokens(normalized) <= maxTokens) {
        return normalized;
    }
    const maxChars = Math.max(1, maxTokens * APPROX_CHARS_PER_TOKEN);
    const clipped = normalized.slice(0, maxChars);
    return `${clipped} ... [TRUNCATED_FOR_CONTEXT_WINDOW]`;
}

function sanitizeMessageContent(content: Message["content"]): Message["content"] {
    if (typeof content !== "string") {
        return content;
    }
    return truncateToTokenBudget(content, MAX_MESSAGE_TOKENS);
}

function toSerializableContent(content: Message["content"]): string {
    if (typeof content === "string") {
        return content;
    }
    return JSON.stringify(content);
}

function serializeMessagesForRequest(inputMessages: Message[]) {
    return inputMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: toSerializableContent(msg.content),
    }));
}

function optimizeMessagesForContext(inputMessages: Message[]): Message[] {
    const sanitized = inputMessages.map((msg) => ({
        ...msg,
        content: sanitizeMessageContent(msg.content),
    }));

    const selected: Message[] = [];
    let tokenCount = 0;

    for (let i = sanitized.length - 1; i >= 0; i -= 1) {
        const msg = sanitized[i];
        const contentTokenCount = typeof msg.content === "string" ? estimateTokens(msg.content) : 0;

        if (selected.length > 0 && tokenCount + contentTokenCount > MAX_CONTEXT_TOKENS) {
            break;
        }

        selected.push(msg);
        tokenCount += contentTokenCount;
    }

    return selected.reverse();
}

const playSuccessThud = () => {
    try {
        const webkitAudioContext = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const AudioContextClass = typeof AudioContext !== "undefined" ? AudioContext : webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(120, audioCtx.currentTime); // Deep 120Hz thud
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        console.error("Audio playback failed:", e);
    }
};

export default function ChatInterface({ initialCredits }: ChatInterfaceProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const { messages, setMessages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/generate-proposal",
        experimental_prepareRequestBody: ({ messages: requestMessages }) => ({
            messages: serializeMessagesForRequest(optimizeMessagesForContext(requestMessages as Message[])),
        }),
        onError: (err: Error) => {
            console.error("Agent Streaming Error:", err);
            setAgentStatus("[SYSTEM_FAULT]: Service temporarily unavailable or 500 anomaly detected.");
        },
        onFinish: () => {
            setAgentStatus("[SYSTEM]: Final Proposal Rendering Complete.");
            playSuccessThud();
        }
    });

    const [agentStatus, setAgentStatus] = useState<string>("[SYSTEM]: Awaiting constraints...");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Client-Side Hydration: Load messages from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('aris-labs-v1-cache');
        if (saved) {
            try {
                const parsed: unknown = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(optimizeMessagesForContext(parsed as Message[]));
                }
            } catch (e) {
                console.error("Failed to parse chat history:", e);
            }
        }
    }, [setMessages]);

    // 2. Client-Side Persistence: Save messages to LocalStorage when they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('aris-labs-v1-cache', JSON.stringify(optimizeMessagesForContext(messages as Message[])));
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, agentStatus]);

    // 3. Reset Handler
    const handleReset = () => {
        if (window.confirm("Are you sure you want to clear your Analysis History?")) {
            localStorage.removeItem('aris-labs-v1-cache');
            setMessages([]);
            setAgentStatus("[SYSTEM]: History cleared. Awaiting constraints...");
        }
    };

    // Simulate Agent steps
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setAgentStatus("[SYSTEM]: Activating Multi-Agent Swarm...");
        setTimeout(() => setAgentStatus("[ARIS-1 Analyst]: Extracting raw text & constraints..."), 800);
        setTimeout(() => setAgentStatus("[ARIS-3 Writer]: Drafting initial proposal sections..."), 2000);
        setTimeout(() => setAgentStatus("[ARIS-4 Critic]: Engaging Gemini 1.5 Pro for Compliance Audit..."), 4000);

        handleSubmit(e);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] max-h-screen bg-black text-zinc-100 overflow-hidden relative">

            {/* Header */}
            <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-zinc-950/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        <Cpu className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">ARIS Labs Orchestrator</h1>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Proposal Analysis Engine</p>
                    </div>
                </div>
                <div className="text-xs font-mono text-zinc-400 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                    Credits: <span className="text-emerald-400 font-bold">{initialCredits}</span>
                </div>
            </header>

            {/* Message Stream Area */}
            <main className="flex-1 overflow-y-auto w-full flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-6 p-6 md:p-8 pb-32">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4 pt-20">
                            <SquareTerminal className="w-16 h-16 text-zinc-800" />
                            <p className="text-center max-w-md text-sm">
                                Enter your solicitation link or constraints below to trigger the swarm. Our agents will extract the requirements, draft the proposal, and audit compliance against the FAR.
                            </p>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={`w-full flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-2xl p-5 ${m.role === "user"
                                    ? "bg-zinc-800 text-white rounded-br-sm"
                                    : "bg-transparent text-zinc-200 border-l-2 border-emerald-500/50 pl-6 rounded-l-none"
                                    }`}>
                                    {m.role === "user" ? (
                                        <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                                    ) : (
                                        <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-white/10 prose-th:text-emerald-400 prose-a:text-blue-400 hover:prose-a:text-blue-300">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {m.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Fixed Command Bar */}
            <div className="absolute bottom-0 inset-x-0 w-full bg-gradient-to-t from-black via-black to-transparent pt-10 pb-6 pointer-events-none">
                <div className="max-w-3xl mx-auto px-4 md:px-0 pointer-events-auto">

                    {/* Pulsing Agent Status */}
                    {isLoading && (
                        <div className="flex items-center gap-2 mb-3 ml-2 text-xs font-mono text-zinc-400 italic">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_1s_ease-in-out_infinite]" />
                            {agentStatus}
                        </div>
                    )}

                    <form ref={formRef} onSubmit={onSubmit} className="relative flex items-end w-full rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-transparent transition-all shadow-2xl">

                        <button
                            type="button"
                            onClick={handleReset}
                            className="p-4 text-zinc-400 hover:text-rose-400 transition-colors flex-shrink-0 border-r border-zinc-700/50"
                            title="Reset Analysis History"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        <button
                            type="button"
                            className="p-4 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                            title="Upload PDF (Coming Soon)"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>

                        <textarea
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Message ARIS Labs..."
                            className="w-full max-h-48 min-h-[56px] py-4 bg-transparent resize-none text-sm text-white placeholder-zinc-500 outline-none scrollbar-hide"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    formRef.current?.requestSubmit();
                                }
                            }}
                        />

                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-4 m-1 ml-0 rounded-xl bg-white text-black disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors flex-shrink-0 hover:bg-zinc-200"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                    <p className="text-[10px] text-zinc-500 text-center mt-3 mb-1">ARIS Labs AI can make mistakes. Verify critical compliance data.</p>
                </div>
            </div>
        </div>
    );
}
