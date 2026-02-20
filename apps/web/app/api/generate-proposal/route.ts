import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { streamText, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { connectDB } from '@/lib/mongodb';
import { Analysis, User } from '@/models';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Configure AI Providers
const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

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

        // Handle both useChat (messages) and useCompletion (prompt) payloads safely
        const lastUserMessage = messages && messages.length > 0
            ? messages[messages.length - 1]?.content
            : (prompt || 'Generate a standard proposal draft.');

        // --- THE "RESEARCHER-CRITIC-WRITER" LOOP ---

        // Phase 1: The Writer (GPT-4o) drafts the initial section internally
        const writerPrompt = `
        You are ARIS-3, an elite government Proposal Writer.
        Draft a high-quality, persuasive proposal section based on the following RFP data and constraints.
        
        Context:
        ${contextText}
        
        User Request:
        ${lastUserMessage}
        
        Constraints:
        ${constraints || 'Adhere strictly to standard federal procurement guidelines.'}
        `;

        // Instead of streaming immediately, we generate text internally first for the Critic to review
        // Note: For a true long-running agent loop, we would yield status updates to the client.
        // To achieve the requested "Terminal UI", we will use streamText's tools/callbacks.

        // Since the user wants to stream the final result with a "Real-time Terminal" view 
        // showing agent status, we will construct a single 'streamText' call that utilizes 
        // the agent loop within its lifecycle, or we simulate the loop via the stream output.

        // To actually stream the output of the *final* refined draft, while showing status:
        // We will execute the Critic/Refiner loop *before* returning the final read stream,
        // or we can stream the intermediate steps if we want the user to see them.

        // Let's implement the internal Loop first (Synchronous for the server, but fast):

        let result;

        try {
            // First attempt with the elite Hybrid Engine
            const initialDraft = await generateText({
                model: openai('gpt-4o'),
                system: 'You are ARIS-3, an elite government Proposal Writer.',
                prompt: writerPrompt,
            });

            // Phase 2: The Critic (Gemini 1.5 Pro)
            const criticPrompt = `
            You are ARIS-4, a strict Government Compliance Critic.
            Review the following proposal draft against the original RFP context.
            Identify any missing compliance requirements or major weaknesses.
            If it is perfect, simply output "COMPLIANT".
            Otherwise, list the specific revisions required.
            
            Original Context:
            ${contextText}
            
            Draft to Evaluate:
            ${initialDraft.text}
            `;

            let criticReview;
            try {
                criticReview = await generateText({
                    model: google('gemini-1.5-pro'),
                    system: 'You are ARIS-4, a strict Compliance Auditor. Output exactly "COMPLIANT" or provide revisions.',
                    prompt: criticPrompt,
                });
            } catch (criticError) {
                console.warn('[CORE] Gemini 1.5 Pro failed or timed out. Falling back to Gemini 1.5 Flash.', criticError);
                criticReview = await generateText({
                    model: google('gemini-1.5-flash'),
                    system: 'You are ARIS-4, a strict Compliance Auditor. Output exactly "COMPLIANT" or provide revisions.',
                    prompt: criticPrompt,
                });
            }

            // Phase 3: The Refiner streams the final output to the user
            const refinerPrompt = `
            You are ARIS-3 (Writer/Refiner). 
            You previously wrote a draft proposal. Your Compliance Critic reviewed it and left the following feedback:
            
            Critic Feedback:
            ${criticReview.text}
            
            Original Draft:
            ${initialDraft.text}
            
            Instructions:
            If the Critic said "COMPLIANT", just cleanly rewrite the original draft for final polish.
            If the Critic provided revisions, implement those revisions exactly and produce the final, compliant proposal section.
            
            Format beautifully in Markdown.
            `;

            result = await streamText({
                model: openai('gpt-4o'),
                system: 'You are an elite Proposal Refiner producing the final, compliant draft for the user.',
                prompt: refinerPrompt,
            });

            return result.toTextStreamResponse({
                headers: {
                    'Aris-Critic-Feedback': encodeURIComponent(criticReview.text.substring(0, 100))
                }
            });

        } catch (eliteEngineError) {
            console.warn('[CORE] Elite Hybrid Engine failed (OpenAI/Gemini Pro). Executing Global Failover to Gemini 1.5 Flash.', eliteEngineError);

            // EMERGENCY FALLBACK: Direct to Gemini 1.5 Flash to guarantee delivery
            const fallbackPrompt = `
            You are ARIS-Labs Emergency Utility Agent.
            Draft a high-quality, persuasive proposal section based on the following RFP data and constraints.
            Adhere strictly to standard federal procurement guidelines and output compliant Markdown.
            
            Context:
            ${contextText}
            
            User Request:
            ${lastUserMessage}
            
            Constraints:
            ${constraints || 'Adhere strictly to standard federal procurement guidelines.'}
            `;

            result = await streamText({
                model: google('gemini-1.5-flash'),
                system: 'You are an elite Proposal Refiner producing a final, compliant draft for the user.',
                prompt: fallbackPrompt,
            });

            return result.toTextStreamResponse({
                headers: {
                    'Aris-Critic-Feedback': encodeURIComponent('Failover active. Processed directly via Gemini 1.5 Flash.')
                }
            });
        }

    } catch (error: any) {
        console.error('Proposal Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
