import { Client } from "langsmith";
import { unstable_cache } from "next/cache";

// 1. Setup local fallbacks
const FALLBACK_PROMPTS: Record<string, string> = {
    'bidsmith-researcher': `You are ARIS-1, an elite government Proposal Researcher.
Address the user conversationally. Draft high-quality, persuasive proposal sections based on the following RFP data and constraints, or answer the user's questions about the document. If the user just says "Hello" or asks a general question, reply conversationally.

Here are examples of how you should analyze and extract information:

Scenario A (Defense AI/Small Biz):
Input: NAVAIR AI Threat Detection, 100% Small Biz set-aside, FAR 52.219-14 applies.
Output: [Core: AI Threat Detection; Compliance: FAR 52.219-14 (50% Rule); Deadline: 2026-03-01; Risk: SB Capacity vs High-Tech Req]

Scenario B (Cloud/Enterprise):
Input: Treasury 2PB Cloud Migration to AWS GovCloud High. Hard 20-page limit.
Output: [Core: 2PB Migration; Compliance: FedRAMP High; Constraint: Hard 20-Page Limit; Risk: Technical depth vs brevity]

Scenario C (Cybersecurity/DHS):
Input: DHS Zero Trust Architecture. Must have NIST 800-53 Rev 5 compliance.
Output: [Core: Zero Trust; Compliance: NIST 800-53 Rev 5; Risk: Legacy system interoperability]

Scenario D (Logistics/Non-Tech):
Input: GSA Office Furniture installation for 5 regional offices.
Output: [Core: Furniture Install; Compliance: TAA (Trade Agreements Act); Risk: Regional shipping logistics]

Now, respond to the user based on their input:`,
    'bidsmith-critic': `You are ARIS-4, a strict Government Legal Analyst and Compliance Critic.
Review the following proposal draft against the original RFP context.
Identify any missing compliance requirements or major weaknesses.
If the draft is a conversational response (e.g. "Hello!"), or if it is compliant, simply output "COMPLIANT".
Otherwise, list the specific revisions required.`,
    'bidsmith-writer': `You are ARIS-Labs AI (Writer/Refiner). 
You previously wrote a draft. Your Compliance Critic reviewed it and left feedback.
If the Critic said "COMPLIANT", just cleanly rewrite the original draft for final output.
If the Critic provided revisions, implement those revisions exactly and produce the final, compliant output.
Format beautifully in Markdown.`,
    'bidsmith-fallback': `You are ARIS-Labs Emergency Utility Agent.
Draft a high-quality, persuasive proposal section based on the following RFP data and constraints.
Adhere strictly to standard federal procurement guidelines and output compliant Markdown.`
};

// Internal function to violently fetch from LangSmith Hub, wrapped in Next.js caching.
const fetchPromptFromHub = async (promptSlug: string) => {
    // 3. Inject workspace ID to environment if missing
    if (!process.env.LANGSMITH_WORKSPACE_ID) {
        process.env.LANGSMITH_WORKSPACE_ID = "default";
    }

    const { pull } = await import("langchain/hub");

    // We isolate the timeout logic inside the actual execution
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
        const pullPromise = pull(promptSlug);
        const abortPromise = new Promise<any>((_, reject) => {
            controller.signal.addEventListener('abort', () => reject(new Error('LangSmith pull timed out after 1.5s')));
        });

        const latestPrompt = await Promise.race([pullPromise, abortPromise]);
        clearTimeout(timeoutId);

        if (latestPrompt && typeof latestPrompt.invoke === 'function') {
            const rawMessages = (latestPrompt as any).promptMessages || [];
            const systemMsg = rawMessages.find((m: any) => m.type === 'system');

            if (systemMsg && systemMsg.prompt && systemMsg.prompt.template) {
                return systemMsg.prompt.template;
            } else if (latestPrompt.template) {
                return latestPrompt.template;
            }
        }
        throw new Error(`Loaded prompt '${promptSlug}' from LangSmith but format was unrecognized.`);
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

// Next.js Unstable Cache wrapper: Caches the successful prompt for 1 hour (3600s)
const getCachedPromptFromHub = unstable_cache(
    async (promptSlug: string) => {
        return await fetchPromptFromHub(promptSlug);
    },
    ['langsmith-hub-prompt'],
    { revalidate: 3600 } // 1 Hour TTL
);

export const getLatestPrompt = async (promptSlug: string): Promise<string> => {
    const fallback = FALLBACK_PROMPTS[promptSlug] || FALLBACK_PROMPTS['bidsmith-fallback'];

    // 2. Short circuit if no API key is present
    if (!process.env.LANGSMITH_API_KEY) {
        return fallback;
    }

    try {
        // This will only hit the network if the cache is expired or empty (0ms latency on hit)
        const cachedTemplate = await getCachedPromptFromHub(promptSlug);
        return cachedTemplate;
    } catch (error: any) {
        console.warn(`[AI] Failed to pull or cache prompt '${promptSlug}' from LangSmith (${error.message}). Using fallback.`);
        return fallback;
    }
};
