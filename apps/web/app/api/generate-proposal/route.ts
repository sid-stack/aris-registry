import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { streamText, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { connectDB } from '@/lib/mongodb';
import { Analysis, User } from '@/models';
import { traceable } from 'langsmith/traceable';
import { getLatestPrompt } from '@/lib/ai/prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Configure AI Providers
const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

// Delete sum global anthropic initialization to prevent crashes if the key is missing at boot

export async function POST(req: NextRequest) {
    // 1. Authenticate (Clerk OR Internal Service Secret for n8n)
    let finalUserId: string | null = null;

    const authHeader = req.headers.get('authorization');
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const isHeadlessBot = internalSecret && authHeader === `Bearer ${internalSecret}`;

    if (isHeadlessBot) {
        finalUserId = 'SYSTEM_BOT_ID';
        console.log('[API] Authorized headless n8n / bot request via Service Secret.');
    } else {
        const { userId } = await auth();
        finalUserId = userId;
    }

    if (!finalUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const { messages, prompt, analysisId, constraints, solicitationUrl, stream } = await req.json();

        // --- CORE ENGINE CREDIT CHECK ---
        if (!isHeadlessBot) {
            const dbUser = await User.findOne({ clerkId: finalUserId });
            if (!dbUser || dbUser.credits_balance <= 0) {
                return NextResponse.json({ error: 'Insufficient Credits' }, { status: 402 });
            }

            // Deduct 1 credit (Atomic update)
            await User.updateOne(
                { clerkId: finalUserId },
                { $inc: { credits_balance: -1 } }
            );
            console.log(`[CORE] Deducted 1 credit from ${finalUserId}. Remaining: ${dbUser.credits_balance - 1}`);
        }

        // Ensure we have the necessary context from previous analysis if analysisId is provided
        // For backwards compatibility and testing, we also allow direct text requests
        let contextText = '';
        if (analysisId) {
            const analysis = await Analysis.findOne({ _id: analysisId, clerkId: finalUserId });
            if (analysis) {
                contextText = `
                RFP Project Title: ${analysis.projectTitle}
                Original RFP Text: ${(analysis as any).rawText?.substring(0, 10000)}... // Truncated for context
                Extracted Requirements: ${JSON.stringify((analysis as any).requirements)}
                Extracted FAR Clauses: ${JSON.stringify((analysis as any).farClauses)}
                `;
            }
        }

        // Ensure Anthropic is isolated
        const getAnthropicModel = (modelId: string) => {
            if (process.env.ANTHROPIC_API_KEY) {
                return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(modelId);
            }
            return null;
        };

        const convertedMessages = messages || [{ role: 'user', content: prompt || 'Generate a standard proposal draft.' }];

        const systemMessageTemplate = await getLatestPrompt('aris-labs/bidsmith-researcher');
        const systemMessage = systemMessageTemplate
            .replace('{contextText}', contextText || '')
            .replace('{constraints}', constraints || 'Adhere strictly to standard federal procurement guidelines.');

        // --- THE "RESEARCHER-CRITIC-WRITER" LOOP ---

        // LangSmith Traced Wrappers
        const tracedGenerateText = traceable(generateText, { name: "Agent Generation", project_name: process.env.LANGSMITH_PROJECT || "aris-labs-prod" });
        const tracedStreamText = traceable(streamText, { name: "Agent Streaming", project_name: process.env.LANGSMITH_PROJECT || "aris-labs-prod" });

        let result;

        try {
            // Phase 1: The Writer (GPT-4o) drafts the initial section internally
            const initialDraft = await tracedGenerateText({
                model: openai('gpt-4o'),
                system: systemMessage,
                messages: convertedMessages,
            });

            // Phase 2: The Critic (Gemini 1.5 Pro)
            const criticTemplate = await getLatestPrompt('aris-labs/bidsmith-critic');
            const criticPrompt = criticTemplate
                .replace('{contextText}', contextText || '')
                .replace('{initialDraft}', initialDraft.text || '');

            let criticReview;
            try {
                // Defaulting Critic to Gemini 2.5 Flash via OpenRouter
                criticReview = await tracedGenerateText({
                    model: openrouter('google/gemini-2.5-flash'),
                    maxTokens: 4000,
                    system: 'You are ARIS-4, a strict Compliance Auditor. Output exactly "COMPLIANT" or provide revisions.',
                    prompt: criticPrompt,
                });
            } catch (criticError) {
                console.warn('[CORE] Primary Critic failed. Falling back to alternative.', criticError);
                criticReview = await tracedGenerateText({
                    model: openrouter('meta-llama/llama-3.1-8b-instruct:free'),
                    system: 'You are ARIS-4, a strict Compliance Auditor. Output exactly "COMPLIANT" or provide revisions.',
                    prompt: criticPrompt,
                });
            }

            // Phase 3: The Refiner streams the final output to the user
            const refinerTemplate = await getLatestPrompt('aris-labs/bidsmith-writer');
            const refinerSystemMessage = refinerTemplate
                .replace('{criticReview}', criticReview.text || '')
                .replace('{initialDraft}', initialDraft.text || '');

            // Append a dummy message to coerce the refiner to use the previous draft
            const finalMessages = [...convertedMessages, { role: 'assistant', content: refinerSystemMessage }];

            result = await tracedStreamText({
                model: openrouter('google/gemini-2.5-flash'),
                maxTokens: 4000,
                messages: finalMessages,
            });

            return result.toTextStreamResponse({
                headers: {
                    'Aris-Critic-Feedback': encodeURIComponent(criticReview.text.substring(0, 100))
                }
            });

        } catch (eliteEngineError) {
            console.warn('[CORE] Elite Hybrid Engine failed. Executing Global Failover.', eliteEngineError);

            // EMERGENCY FALLBACK: Direct to Gemini 2.5 Flash to guarantee delivery
            result = await tracedStreamText({
                model: openrouter('google/gemini-2.5-flash'),
                maxTokens: 4000,
                system: systemMessage,
                messages: convertedMessages,
            });

            return result.toTextStreamResponse({
                headers: {
                    'Aris-Critic-Feedback': encodeURIComponent('Failover active. Processed directly via Fallback Model.')
                }
            });
        }

    } catch (error: any) {
        console.error('Proposal Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
