"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export type AIXStatus = 'authorizing' | 'drafting' | 'delivering' | 'captured' | 'failed';

interface AIXProgressProps {
    status: AIXStatus;
}

const steps = [
    { id: 'authorizing', label: 'Authorizing Card', icon: Circle },
    { id: 'drafting', label: 'Agents Drafting', icon: Circle },
    { id: 'delivering', label: 'Atomic Delivery', icon: Circle },
    { id: 'captured', label: 'Proposal Delivered', icon: CheckCircle2 },
];

export default function AIXProgress({ status }: AIXProgressProps) {
    const getStatusIndex = (s: AIXStatus) => {
        if (s === 'authorizing') return 0;
        if (s === 'drafting') return 1;
        if (s === 'delivering') return 2;
        if (s === 'captured') return 3;
        return -1;
    };

    const currentIndex = getStatusIndex(status);

    return (
        <div className="w-full max-w-lg mx-auto p-8 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm shadow-xl">
            <div className="space-y-8">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = index === currentIndex;
                    const isFuture = index > currentIndex;

                    return (
                        <div key={step.id} className="flex items-center gap-6 relative">
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`absolute left-4 top-10 h-10 w-[2px] ${isCompleted ? 'bg-green-500' : 'bg-white/10'
                                        }`}
                                />
                            )}

                            {/* Step Circle */}
                            <div className="relative">
                                {isActive && status !== 'failed' && (
                                    <motion.div
                                        layoutId="outline"
                                        className="absolute -inset-2 rounded-full border-2 border-blue-400/30"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    />
                                )}

                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 relative transition-colors duration-500 ${isCompleted ? 'bg-green-500 border-green-500 text-black' :
                                            isActive ? 'border-blue-400 bg-blue-400/10 text-blue-400' :
                                                'border-white/10 bg-white/5 text-zinc-600'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : isActive && status !== 'captured' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <span className="text-xs font-bold">{index + 1}</span>
                                    )}
                                </div>
                            </div>

                            {/* Label */}
                            <div className="flex flex-col">
                                <span className={`text-lg font-bold transition-all duration-500 ${isActive ? 'text-white translate-x-1' :
                                        isCompleted ? 'text-green-400' :
                                            'text-zinc-600'
                                    }`}>
                                    {step.label}
                                    {isActive && ' 🟢'}
                                    {isCompleted && ' ✅'}
                                </span>
                                {isActive && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-xs text-zinc-500 font-mono tracking-tighter"
                                    >
                                        {status === 'authorizing' && 'VERIFYING LIMITS & SECURITY...'}
                                        {status === 'drafting' && 'AGENTS GENERATING PROPOSAL...'}
                                        {status === 'delivering' && 'UPLOADING TO STORAGE & CAPTURING FUNDS...'}
                                        {status === 'captured' && 'PAYMENT SUCCESSFUL. CHECK EMAIL.'}
                                    </motion.span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {status === 'failed' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center"
                    >
                        <h4 className="font-bold">Execution Failed</h4>
                        <p className="text-sm">Agent failed to meet quality standards. Hold released.</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
