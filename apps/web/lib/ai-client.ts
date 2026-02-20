/**
 * Swappable AI provider client.
 * Set AI_PROVIDER=gemini | openrouter | github in .env.local
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://bidsmith.ai';

export interface AIResponse {
    text: string;
}

export async function askAI(
    prompt: string,
    primaryModel: string = 'google/gemini-2.5-flash',
    backupModel: string = 'anthropic/claude-3-haiku'
): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_KEY;
    if (!apiKey) throw new Error('OPEN_ROUTER_KEY is not set in environment variables');

    // Attempt Primary Model
    try {
        return await callOpenRouter(prompt, primaryModel, apiKey);
    } catch (e: any) {
        const errMessage = e.message || '';
        if (errMessage.includes('429') || errMessage.includes('500') || errMessage.includes('502') || errMessage.includes('503') || errMessage.includes('504')) {
            console.warn(`[AI Failover] Primary model (${primaryModel}) failed with ${errMessage}. Intercepted failover to backup model (${backupModel}).`);
            return await callOpenRouter(prompt, backupModel, apiKey);
        }
        // If it's a 400 (Bad Request) or something unrelated to capacity, throw immediately.
        throw e;
    }
}

async function callOpenRouter(prompt: string, model: string, apiKey: string): Promise<string> {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': APP_URL!,
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`[${model}] ${res.status} — ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
}
