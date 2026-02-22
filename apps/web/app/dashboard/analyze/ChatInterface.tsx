"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "ai/react";
import type { Message } from "ai";
import {
    Bot,
    Loader2,
    MessageSquarePlus,
    PanelLeftClose,
    PanelLeftOpen,
    RefreshCw,
    Send,
    Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatInterfaceProps {
    initialCredits: number;
}

type ConversationRole = "user" | "assistant" | "system";

type ConversationSummary = {
    id: string;
    title: string;
    messageCount: number;
    preview: string;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
};

type StoredConversationMessage = {
    id: string;
    role: ConversationRole;
    content: string;
    createdAt: string;
};

type StoredConversation = {
    id: string;
    title: string;
    messages: StoredConversationMessage[];
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
};

const APPROX_CHARS_PER_TOKEN = 4;
const MAX_CONTEXT_TOKENS = 120000;
const MAX_MESSAGE_TOKENS = 16000;
const LEGACY_CACHE_KEY = "aris-labs-v1-cache";

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

function toConversationRole(role: Message["role"]): ConversationRole | null {
    if (role === "user" || role === "assistant" || role === "system") {
        return role;
    }
    return null;
}

function serializeMessagesForStorage(inputMessages: Message[]): StoredConversationMessage[] {
    return inputMessages
        .map((message, index) => {
            const role = toConversationRole(message.role);
            if (!role) {
                return null;
            }

            const rawCreatedAt = (message as { createdAt?: Date | string }).createdAt;
            const createdAt =
                rawCreatedAt && !Number.isNaN(new Date(rawCreatedAt).getTime())
                    ? new Date(rawCreatedAt).toISOString()
                    : new Date().toISOString();

            return {
                id: message.id || `msg-${Date.now()}-${index}`,
                role,
                content: toSerializableContent(message.content),
                createdAt,
            };
        })
        .filter((message): message is StoredConversationMessage => Boolean(message));
}

function deserializeMessages(messages: StoredConversationMessage[]): Message[] {
    return messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
    }));
}

function deriveConversationTitle(messages: StoredConversationMessage[]): string {
    const firstUserMessage = messages.find((message) => message.role === "user");
    if (!firstUserMessage) {
        return "New conversation";
    }

    const normalized = firstUserMessage.content.replace(/\s+/g, " ").trim();
    if (!normalized) {
        return "New conversation";
    }

    return normalized.slice(0, 120);
}

function formatDateTime(input: string): string {
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }
    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(parsed);
}

function summaryFromConversation(conversation: StoredConversation): ConversationSummary {
    const latest = conversation.messages[conversation.messages.length - 1];

    return {
        id: conversation.id,
        title: conversation.title || "New conversation",
        messageCount: conversation.messages.length,
        preview: latest?.content?.slice(0, 120) || "No messages yet",
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
    };
}

const playSuccessThud = () => {
    try {
        const webkitAudioContext = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const AudioContextClass = typeof AudioContext !== "undefined" ? AudioContext : webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(120, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (error) {
        console.error("Audio playback failed:", error);
    }
};

export default function ChatInterface({ initialCredits }: ChatInterfaceProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const skipNextPersistRef = useRef<boolean>(false);
    const [analysisId, setAnalysisId] = useState<string | null>(null);

    const [agentStatus, setAgentStatus] = useState<string>("[SYSTEM]: Awaiting constraints...");
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isHydrating, setIsHydrating] = useState(false); // NO LONGER BLOCKING INITIAL RENDER
    const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
    const [isPersisting, setIsPersisting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [initialMessages] = useState<Message[]>(() => {
        if (typeof window !== "undefined") {
            try {
                const cached = localStorage.getItem(LEGACY_CACHE_KEY);
                if (cached) return JSON.parse(cached);
            } catch (e) {
                console.warn("Failed parsing legacy cache", e);
            }
        }
        return [];
    });

    const {
        messages,
        setMessages,
        input,
        setInput,
        handleInputChange,
        handleSubmit,
        isLoading,
        error: chatError,
        reload,
    } = useChat({
        api: "/api/generate-proposal",
        initialMessages,
        experimental_prepareRequestBody: ({ messages: requestMessages }) => {
            const payload: Record<string, any> = {
                messages: serializeMessagesForRequest(optimizeMessagesForContext(requestMessages as Message[])),
                conversationId: activeConversationId,
            };
            if (analysisId) payload.analysisId = analysisId;
            return payload as any;
        },
        onError: (error: Error) => {
            console.error("Agent Streaming Error:", error);
            setAgentStatus("[SYSTEM_FAULT]: Service temporarily unavailable or 500 anomaly detected.");
        },
        onFinish: () => {
            setAgentStatus("[SYSTEM]: Final Proposal Rendering Complete.");
            playSuccessThud();
        },
    });

    const isDraftConversation = useMemo(() => activeConversationId === null, [activeConversationId]);

    const upsertConversationSummary = useCallback((summary: ConversationSummary) => {
        setConversations((prev) => {
            const filtered = prev.filter((item) => item.id !== summary.id);
            return [summary, ...filtered].sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            );
        });
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const sp = new URLSearchParams(window.location.search);
                const a = sp.get("analysisId");
                if (a) setAnalysisId(a);
            } catch { }
        }
    }, []);

    const loadConversation = useCallback(
        async (conversationId: string) => {
            setLoadingConversationId(conversationId);
            try {
                const response = await fetch(`/api/conversations/${conversationId}`, { cache: "no-store" });
                if (!response.ok) {
                    throw new Error(`Failed to load conversation (${response.status})`);
                }

                const data = (await response.json()) as { conversation: StoredConversation };
                skipNextPersistRef.current = true;
                setActiveConversationId(data.conversation.id);
                setMessages(deserializeMessages(data.conversation.messages));
                setInput("");
                upsertConversationSummary(summaryFromConversation(data.conversation));
            } catch (error) {
                console.error(error);
                setAgentStatus("[SYSTEM]: Failed to load conversation.");
            } finally {
                setLoadingConversationId(null);
            }
        },
        [setInput, setMessages, upsertConversationSummary],
    );

    const createConversation = useCallback(async (): Promise<string | null> => {
        try {
            const response = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "New conversation", messages: [] }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create conversation (${response.status})`);
            }

            const data = (await response.json()) as { conversation: StoredConversation };
            setActiveConversationId(data.conversation.id);
            upsertConversationSummary(summaryFromConversation(data.conversation));
            return data.conversation.id;
        } catch (error) {
            console.error(error);
            setAgentStatus("[SYSTEM]: Failed to create a new conversation.");
            return null;
        }
    }, [upsertConversationSummary]);

    const persistConversation = useCallback(
        async (conversationId: string, nextMessages: Message[]) => {
            const serializedMessages = serializeMessagesForStorage(nextMessages);
            if (serializedMessages.length === 0) {
                return;
            }

            setIsPersisting(true);
            try {
                const response = await fetch(`/api/conversations/${conversationId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: deriveConversationTitle(serializedMessages),
                        messages: serializedMessages,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to persist conversation (${response.status})`);
                }

                const data = (await response.json()) as { conversation: StoredConversation };
                upsertConversationSummary(summaryFromConversation(data.conversation));
            } catch (error) {
                console.error(error);
                setAgentStatus("[SYSTEM]: Could not persist conversation state.");
            } finally {
                setIsPersisting(false);
            }
        },
        [upsertConversationSummary],
    );

    const hydrateConversations = useCallback(async () => {
        try {
            const response = await fetch("/api/conversations", { cache: "no-store" });
            if (!response.ok) {
                throw new Error(`Failed to list conversations (${response.status})`);
            }

            const data = (await response.json()) as { conversations: ConversationSummary[] };
            const loaded = data.conversations || [];
            setConversations(loaded);

            if (loaded.length > 0) {
                await loadConversation(loaded[0].id);
                return;
            }

            const legacyCache = localStorage.getItem(LEGACY_CACHE_KEY);
            if (!legacyCache) {
                return;
            }

            // Sync from cache to DB if valid
            try {
                const parsed = JSON.parse(legacyCache) as Message[];
                if (!Array.isArray(parsed) || parsed.length === 0) {
                    return;
                }

                const migratedMessages = serializeMessagesForStorage(parsed);
                const createResponse = await fetch("/api/conversations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: deriveConversationTitle(migratedMessages),
                        messages: migratedMessages,
                    }),
                });

                if (createResponse.ok) {
                    const created = (await createResponse.json()) as { conversation: StoredConversation };
                    upsertConversationSummary(summaryFromConversation(created.conversation));
                    skipNextPersistRef.current = true;
                    setActiveConversationId(created.conversation.id);
                    setMessages(deserializeMessages(created.conversation.messages));
                    localStorage.removeItem(LEGACY_CACHE_KEY);
                }
            } catch (error) {
                console.error("Failed to migrate legacy cache:", error);
            }
        } catch (error) {
            console.error(error);
            setAgentStatus("[SYSTEM]: Failed to load conversation list.");
        } finally {
            setIsHydrating(false);
        }
    }, [loadConversation, setMessages, upsertConversationSummary]);

    useEffect(() => {
        void hydrateConversations();
    }, [hydrateConversations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, agentStatus]);

    useEffect(() => {
        if (!activeConversationId || messages.length === 0) {
            return;
        }

        if (skipNextPersistRef.current) {
            skipNextPersistRef.current = false;
            return;
        }

        if (persistTimerRef.current) {
            clearTimeout(persistTimerRef.current);
        }

        persistTimerRef.current = setTimeout(() => {
            void persistConversation(activeConversationId, messages as Message[]);
        }, 900);

        // Immediate write to localStorage cache stream tracking
        if (messages.length > 0) {
            localStorage.setItem(LEGACY_CACHE_KEY, JSON.stringify(messages));
        }

        return () => {
            if (persistTimerRef.current) {
                clearTimeout(persistTimerRef.current);
            }
        };
    }, [activeConversationId, messages, persistConversation]);

    const startNewConversation = useCallback(() => {
        if (isLoading) {
            return;
        }

        skipNextPersistRef.current = true;
        setActiveConversationId(null);
        setMessages([]);
        setInput("");
        setAgentStatus("[SYSTEM]: New draft conversation started.");
    }, [isLoading, setInput, setMessages]);

    const deleteConversation = useCallback(
        async (conversationId: string) => {
            try {
                const response = await fetch(`/api/conversations/${conversationId}`, {
                    method: "DELETE",
                });

                if (!response.ok) {
                    throw new Error(`Failed to delete conversation (${response.status})`);
                }

                setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));

                if (activeConversationId === conversationId) {
                    skipNextPersistRef.current = true;
                    setActiveConversationId(null);
                    setMessages([]);
                    setAgentStatus("[SYSTEM]: Conversation deleted.");
                }
            } catch (error) {
                console.error(error);
                setAgentStatus("[SYSTEM]: Unable to delete conversation.");
            }
        },
        [activeConversationId, setMessages],
    );

    const handleResetCurrentConversation = useCallback(async () => {
        if (!activeConversationId || messages.length === 0 || isLoading) {
            return;
        }

        if (!window.confirm("Clear the current conversation messages?")) {
            return;
        }

        skipNextPersistRef.current = true;
        setMessages([]);

        try {
            const response = await fetch(`/api/conversations/${activeConversationId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "New conversation", messages: [] }),
            });

            if (!response.ok) {
                throw new Error(`Failed to clear conversation (${response.status})`);
            }

            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation.id === activeConversationId
                        ? {
                            ...conversation,
                            title: "New conversation",
                            preview: "No messages yet",
                            messageCount: 0,
                            updatedAt: new Date().toISOString(),
                        }
                        : conversation,
                ),
            );
            setAgentStatus("[SYSTEM]: Conversation cleared.");
        } catch (error) {
            console.error(error);
            setAgentStatus("[SYSTEM]: Failed to clear conversation.");
        }
    }, [activeConversationId, isLoading, messages.length, setMessages]);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!input.trim() || isLoading) {
            return;
        }

        let conversationId = activeConversationId;
        if (!conversationId) {
            conversationId = await createConversation();
            if (!conversationId) {
                return;
            }
        }

        setAgentStatus("[SYSTEM]: Activating Multi-Agent Swarm...");
        setTimeout(() => setAgentStatus("[ARIS Analyst]: Parsing solicitation constraints..."), 700);
        setTimeout(() => setAgentStatus("[ARIS Writer]: Drafting response sections..."), 1800);
        setTimeout(() => setAgentStatus("[ARIS Critic]: Running compliance review..."), 3200);

        handleSubmit(undefined, {
            body: { conversationId },
        });
    };

    return (
        <div className="relative flex h-full min-h-[76vh] rounded-2xl border border-zinc-700/50 bg-[#202123] text-zinc-100 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <aside
                className={`absolute inset-y-0 left-0 z-20 w-80 bg-[#171717] border-r border-zinc-700/60 transition-transform duration-200 lg:relative ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16"
                    }`}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-zinc-700/60 px-3 py-3">
                        <button
                            type="button"
                            onClick={startNewConversation}
                            className="inline-flex items-center gap-2 rounded-md border border-zinc-600 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                        >
                            <MessageSquarePlus className="h-4 w-4" />
                            New chat
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen((prev) => !prev)}
                            className="rounded-md border border-zinc-600 p-2 text-zinc-300 hover:bg-zinc-800"
                            aria-label="Toggle conversations panel"
                        >
                            {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 py-2">
                        {conversations.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-xs text-zinc-500">
                                No saved conversations yet.
                            </div>
                        ) : (
                            conversations.map((conversation) => {
                                const isActive = conversation.id === activeConversationId;
                                const isLoadingItem = loadingConversationId === conversation.id;

                                return (
                                    <div
                                        key={conversation.id}
                                        className={`group mb-1 rounded-lg border ${isActive
                                            ? "border-zinc-500 bg-zinc-800/80"
                                            : "border-transparent bg-transparent hover:border-zinc-700 hover:bg-zinc-800/40"
                                            }`}
                                    >
                                        <div className="flex items-start gap-2 p-2">
                                            <button
                                                type="button"
                                                onClick={() => void loadConversation(conversation.id)}
                                                className="flex-1 text-left"
                                            >
                                                <div className="line-clamp-1 text-sm font-medium text-zinc-200">
                                                    {conversation.title}
                                                </div>
                                                <div className="line-clamp-2 text-xs text-zinc-400">
                                                    {conversation.preview}
                                                </div>
                                                <div className="mt-1 text-[11px] text-zinc-500">
                                                    {isLoadingItem ? "Loading..." : formatDateTime(conversation.updatedAt)}
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void deleteConversation(conversation.id)}
                                                className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200"
                                                aria-label="Delete conversation"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col bg-[#343541]">
                <header className="flex items-center justify-between border-b border-zinc-700/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen((prev) => !prev)}
                            className="rounded-md border border-zinc-600 p-2 text-zinc-300 hover:bg-zinc-800 lg:hidden"
                            aria-label="Toggle conversations panel"
                        >
                            {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                        </button>
                        <div className="inline-flex items-center gap-2 rounded-md border border-zinc-600 bg-zinc-900/40 px-3 py-1 text-xs text-zinc-300">
                            <Bot className="h-4 w-4" />
                            ARIS Agent
                        </div>
                        <div className="text-xs text-zinc-500">{isDraftConversation ? "Draft conversation" : "Saved conversation"}</div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-xs text-zinc-400">Credits: <span className="font-semibold text-zinc-200">{initialCredits}</span></div>
                        <div className="text-xs text-zinc-500">{isPersisting ? "Saving..." : "Synced"}</div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {isHydrating && messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading conversations...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center text-zinc-400">
                            <Bot className="mb-4 h-10 w-10 text-zinc-500" />
                            <h2 className="text-lg font-semibold text-zinc-200">ARIS Conversation Workspace</h2>
                            <p className="mt-2 text-sm text-zinc-400">
                                Start a chat to see full `Client` and `ARIS Agent` conversation history. Messages are stored and reloaded in this sidebar.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {messages.map((message) => {
                                const isUser = message.role === "user";
                                const roleLabel = isUser ? "Client" : "ARIS Agent";

                                return (
                                    <div
                                        key={message.id}
                                        className={`w-full border-b border-zinc-700/50 ${isUser ? "bg-[#343541]" : "bg-[#444654]"}`}
                                    >
                                        <div className="mx-auto max-w-3xl px-5 py-6">
                                            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300">
                                                {roleLabel}
                                            </div>
                                            {isUser ? (
                                                <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-100">{toSerializableContent(message.content)}</p>
                                            ) : (
                                                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-7 prose-pre:border prose-pre:border-zinc-600 prose-pre:bg-[#202123] prose-th:text-zinc-200 prose-a:text-cyan-300 hover:prose-a:text-cyan-200">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{toSerializableContent(message.content)}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </main>

                <footer className="border-t border-zinc-700/60 bg-[#343541] p-4">
                    <div className="mx-auto max-w-3xl">
                        {chatError && (
                            <div className="mb-4 flex flex-col items-center justify-center p-4 border border-red-500/50 bg-red-500/10 rounded-xl">
                                <p className="text-sm text-red-400 mb-2">Error: Failed to parse stream or connection lost.</p>
                                <button
                                    type="button"
                                    onClick={() => reload()}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Retry Message
                                </button>
                            </div>
                        )}
                        {isLoading && (
                            <div className="mb-2 flex items-center gap-2 text-xs font-mono text-zinc-400">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {agentStatus}
                            </div>
                        )}

                        <form ref={formRef} onSubmit={onSubmit} className="rounded-2xl border border-zinc-600 bg-[#40414f] p-2 shadow-lg">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Message ARIS Agent..."
                                    rows={1}
                                    className="max-h-56 min-h-[56px] w-full resize-none bg-transparent px-3 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-400"
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && !event.shiftKey) {
                                            event.preventDefault();
                                            formRef.current?.requestSubmit();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleResetCurrentConversation()}
                                    className="rounded-xl p-3 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-50"
                                    disabled={!activeConversationId || messages.length === 0 || isLoading}
                                    aria-label="Clear current conversation"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="rounded-xl bg-zinc-100 p-3 text-zinc-900 transition-colors hover:bg-white disabled:bg-zinc-700 disabled:text-zinc-400"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </button>
                            </div>
                        </form>
                        <p className="mt-2 text-center text-[11px] text-zinc-500">ARIS Agent may produce mistakes. Verify compliance-critical outputs.</p>
                    </div>
                </footer>
            </section>
        </div >
    );
}
