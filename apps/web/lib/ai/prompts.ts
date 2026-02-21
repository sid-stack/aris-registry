import { Client } from "langsmith";

export const getLatestPrompt = async (promptSlug: string): Promise<string> => {
    // 1. Setup local fallbacks
    const FALLBACK_PROMPTS: Record<string, string> = {
        'bidsmith-researcher': `You are ARIS-1, an elite government Proposal Researcher.
Address the user conversationally. Draft high-quality, persuasive proposal sections based on the following RFP data and constraints, or answer the user's questions about the document. If the user just says "Hello" or asks a general question, reply conversationally.`,
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

    const fallback = FALLBACK_PROMPTS[promptSlug] || FALLBACK_PROMPTS['bidsmith-fallback'];

    // 2. Short circuit if no API key is present (e.g. Local Dev without trace overhead)
    if (!process.env.LANGSMITH_API_KEY) {
        return fallback;
    }

    // 3. Prepare 1.5s Execution Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    // 3. Inject workspace ID to environment if missing
    if (!process.env.LANGSMITH_WORKSPACE_ID) {
        process.env.LANGSMITH_WORKSPACE_ID = "default";
    }

    try {
        const client = new Client({
            apiKey: process.env.LANGSMITH_API_KEY,
            apiUrl: process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com",
            webUrl: "https://smith.langchain.com"
        });

        // 4. Attempt to violently fetch the latest prompt from the registry
        // LangSmith Client does not natively take an abort signal, so we race it.
        const pullPromise = (client as any).pullPrompt(promptSlug);

        const abortPromise = new Promise<{ isAbort: true }>((_, reject) => {
            controller.signal.addEventListener('abort', () => reject(new Error('LangSmith pull timed out after 1.5s')));
        });

        const latestPrompt = await Promise.race([pullPromise, abortPromise]) as any;
        clearTimeout(timeoutId);

        // Parse the prompt string from the returned template
        if (latestPrompt && latestPrompt.templateFormat === 'f-string') {
            return latestPrompt.template;
        } else if (latestPrompt && latestPrompt.messages && latestPrompt.messages.length > 0) {
            // Unpack LangChain Chat Prompt Template format
            const systemMsg = latestPrompt.messages.find((m: any) => m.type === 'system');
            if (systemMsg) return systemMsg.prompt.template;
        }

        console.warn(`[AI] Loaded prompt '${promptSlug}' from LangSmith but format was unrecognized. Using fallback.`);
        return fallback;

    } catch (error: any) {
        clearTimeout(timeoutId);
        console.warn(`[AI] Failed to pull prompt '${promptSlug}' from LangSmith (${error.message}). Using fallback.`);
        return fallback;
    }
};
