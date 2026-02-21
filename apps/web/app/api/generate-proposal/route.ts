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
const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPEN_ROUTER_KEY || process.env.OPENROUTER_API_KEY || '',
    headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ARIS Labs'
    }
});

const ollama = createOpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
});

// Helper to pick model provider dynamically
const hasOpenRouterKey = Boolean(process.env.OPEN_ROUTER_KEY || process.env.OPENROUTER_API_KEY);
const isLocal = process.env.NODE_ENV === 'development' && !hasOpenRouterKey;

const selectModel = (role: 'writer' | 'critic' | 'refiner' | 'fallback') => {
    if (isLocal) {
        return ollama('llama3.2:1b');
    }

    switch (role) {
        case 'writer':
            return openrouter('anthropic/claude-3.5-sonnet');
        case 'critic':
            return google('models/gemini-1.5-pro-latest');
        case 'refiner':
            return openrouter('anthropic/claude-3.5-sonnet');
        case 'fallback':
            return openrouter('google/gemini-2.5-flash');
        default:
            return openrouter('anthropic/claude-3.5-sonnet');
    }
};

// Delete sum global anthropic initialization to prevent crashes if the key is missing at boot

export async function POST(req: NextRequest) {
    // 1. Authenticate (Clerk OR Internal Service Secret for n8n)
    let finalUserId: string | null = null;
    let clerkUserId: string | null = null;
    const localDevUserId = process.env.LOCAL_DEV_USER_ID ?? null;

    const authHeader = req.headers.get('authorization');
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const isHeadlessBot = internalSecret && authHeader === `Bearer ${internalSecret}`;

    if (isHeadlessBot) {
        finalUserId = 'SYSTEM_BOT_ID';
        console.log('[API] Authorized headless n8n / bot request via Service Secret.');
    } else {
        try {
            const { userId } = await auth();
            clerkUserId = userId;
            finalUserId = userId ?? localDevUserId;
        } catch (e) {
            clerkUserId = null;
            finalUserId = localDevUserId;
        }
    }

    if (!finalUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();
        const { messages, prompt, analysisId, constraints, solicitationUrl, stream } = await req.json();

        // --- CORE ENGINE CREDIT CHECK ---
        const isLocalBypass = !isHeadlessBot && !clerkUserId && Boolean(localDevUserId) && finalUserId === localDevUserId;

        if (!isHeadlessBot && !isLocalBypass) {
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

        const convertedMessages = messages || [{ role: 'user', content: prompt || 'Generate a standard proposal draft.' }];
        const isFirstMessage = convertedMessages.length === 1;

        console.log(`Conversational Handshake: [Success] Model: [Hybrid Engine - ${isLocal ? 'Ollama' : 'OpenRouter'}] Domain: [${process.env.NEXT_PUBLIC_APP_URL || 'bidsmith.pro'}] Turn: [${convertedMessages.length}]`);

        // Ensure Anthropic is isolated
        const getAnthropicModel = (modelId: string) => {
            if (process.env.ANTHROPIC_API_KEY) {
                return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(modelId);
            }
            return null;
        };

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
            let initialDraftText = '';
            let criticReviewText = '';

            // ONLY run Writer and Critic on the FIRST message (initial proposal generation)
            if (isFirstMessage) {
                // Phase 1: The Writer drafts the initial section internally
                const writerModel = selectModel('writer');
                console.log('Model reached: writer phase');
                const initialDraft = await tracedGenerateText({
                    model: writerModel,
                    system: systemMessage,
                    messages: convertedMessages,
                });
                initialDraftText = initialDraft.text;

                // Phase 2: The Critic (Gemini 1.5 Pro)
                const criticTemplate = await getLatestPrompt('aris-labs/bidsmith-critic');
                const criticPrompt = criticTemplate
                    .replace('{contextText}', contextText || '')
                    .replace('{initialDraft}', initialDraftText);

                try {
                    // Secondary Agent: Critic
                    const criticModel = selectModel('critic');
                    console.log('Model reached: critic phase');
                    const criticReview = await tracedGenerateText({
                        model: criticModel,
                        maxTokens: 4000,
                        system: 'You are ARIS-4, a strict Compliance Auditor. Output exactly "COMPLIANT" or provide revisions.',
                        prompt: criticPrompt,
                    });
                    criticReviewText = criticReview.text;
                } catch (criticError) {
                    console.warn('[CORE] Primary Critic failed. Falling back to alternative.', criticError);
                    // Alternative Critic if Primary goes down
                    const fallbackCriticModel = isLocal ? ollama('llama3.2:1b') : openrouter('google/gemini-2.5-flash');
                    console.log('Model reached: critic fallback phase');
                    const criticReview = await tracedGenerateText({
                        model: fallbackCriticModel,
                        system: 'You are ARIS-4, a strict Compliance Auditor. Output exactly "COMPLIANT" or provide revisions.',
                        prompt: criticPrompt,
                    });
                    criticReviewText = criticReview.text;
                }
            } else {
                console.log('Conversational follow-up detected. Bypassing Writer/Critic phases.');
            }

            // Phase 3: The Refiner streams the final output to the user
            const refinerTemplate = await getLatestPrompt('aris-labs/bidsmith-writer');
            let refinerSystemMessage = refinerTemplate
                .replace('{criticReview}', criticReviewText)
                .replace('{initialDraft}', initialDraftText);

            refinerSystemMessage += "\n\n" + systemMessage;

            // Append a dummy message to coerce the refiner to use the previous draft
            const finalMessages = [{ role: 'system', content: refinerSystemMessage }, ...convertedMessages];

            const refinerModel = selectModel('refiner');
            console.log('Model reached: refiner phase');
            result = await tracedStreamText({
                model: refinerModel,
                maxTokens: 4000,
                messages: finalMessages,
            });

            return result.toTextStreamResponse({
                headers: {
                    'Aris-Critic-Feedback': encodeURIComponent(isFirstMessage ? criticReviewText.substring(0, 100) : 'Conversational Turn')
                }
            });

        } catch (eliteEngineError) {
            console.warn('[CORE] Elite Hybrid Engine failed. Executing Global Failover.', eliteEngineError);

            // EMERGENCY FALLBACK: Direct Failover Model
            const fallbackModel = selectModel('fallback');
            console.log('Model reached: emergency fallback phase');
            result = await tracedStreamText({
                model: fallbackModel,
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
