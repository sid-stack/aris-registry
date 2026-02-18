/**
 * Aris Protocol — 4-Agent Orchestrator
 *
 * ARIS-1: Intelligence Extractor   → structured data from raw PDF text
 * ARIS-2: Strategic Analyst        → win themes, risks, executive briefing
 * ARIS-3: Win Probability Scorer   → 0–100 score + match score
 * ARIS-4: Proposal Architect       → full proposal draft (Pro, $0.99)
 */

import { generateText } from './ai-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Aris1Output {
    isValidRfp: boolean;
    rejectionReason: string;
    projectTitle: string;
    agency: string;
    naicsCode: string;
    setAside: string;
    estValue: string;
    deadline: string;
    complianceItems: string[];
}

export interface Aris2Output {
    winThemes: string[];
    keyRisks: string[];
    execBriefing: string;
}

export interface Aris3Output {
    winScore: number;
    matchScore: string;
}

export interface Aris4Output {
    proposalDraft: string;
}

export interface FullAnalysis extends Aris1Output, Aris2Output, Aris3Output {
    proposalDraft: string | null;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function parseJson<T>(raw: string, fallback: T): T {
    try {
        let cleaned = raw.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(cleaned) as T;
    } catch {
        console.error('JSON parse error. Raw:', raw.slice(0, 300));
        return fallback;
    }
}

// ─── ARIS-1: Intelligence Extractor ──────────────────────────────────────────

export async function aris1_extract(pdfText: string): Promise<Aris1Output> {
    const prompt = `
You are ARIS-1, an elite Government Contracts Intelligence Extractor.

First, determine if this document is a legitimate government procurement solicitation.
Valid types: RFP, RFQ, IFB, Sources Sought, AoI, CSO, BAA, SBIR, STTR.
Invalid: tutorials, internal memos, marketing materials, personal documents.

If VALID, return this exact JSON:
{
  "isValidRfp": true,
  "rejectionReason": "",
  "projectTitle": "string",
  "agency": "string (full agency name)",
  "naicsCode": "string (6-digit NAICS or 'Not specified')",
  "setAside": "string (e.g. 'Small Business', '8(a)', 'WOSB', 'None')",
  "estValue": "string (e.g. '$1M–$2M' or 'TBD')",
  "deadline": "string (YYYY-MM-DD or 'TBD')",
  "complianceItems": ["string", "string", "..."] (up to 10 key requirements)
}

If INVALID, return:
{
  "isValidRfp": false,
  "rejectionReason": "one sentence explaining why",
  "projectTitle": "N/A",
  "agency": "N/A",
  "naicsCode": "N/A",
  "setAside": "N/A",
  "estValue": "N/A",
  "deadline": "N/A",
  "complianceItems": []
}

Return ONLY raw JSON. No markdown, no explanation.

DOCUMENT (first 25,000 chars):
${pdfText.slice(0, 25000)}
`.trim();

    const raw = await generateText(prompt);
    return parseJson<Aris1Output>(raw, {
        isValidRfp: false,
        rejectionReason: 'Failed to parse AI response.',
        projectTitle: 'N/A', agency: 'N/A', naicsCode: 'N/A',
        setAside: 'N/A', estValue: 'N/A', deadline: 'N/A',
        complianceItems: [],
    });
}

// ─── ARIS-2: Strategic Analyst ────────────────────────────────────────────────

export async function aris2_analyze(pdfText: string, extraction: Aris1Output): Promise<Aris2Output> {
    const prompt = `
You are ARIS-2, an elite Government Contracting Strategic Analyst.

Given this RFP intelligence brief:
- Project: ${extraction.projectTitle}
- Agency: ${extraction.agency}
- Value: ${extraction.estValue}
- NAICS: ${extraction.naicsCode}
- Set-Aside: ${extraction.setAside}
- Key Requirements: ${extraction.complianceItems.join('; ')}

And the full document text (first 20,000 chars):
${pdfText.slice(0, 20000)}

Return this exact JSON:
{
  "winThemes": ["string", "string", "string"] (3–5 strategic win themes to emphasize in the proposal),
  "keyRisks": ["string", "string"] (2–4 risks or challenges to address),
  "execBriefing": "string (2–3 sentence executive briefing for leadership)"
}

Return ONLY raw JSON. No markdown, no explanation.
`.trim();

    const raw = await generateText(prompt);
    return parseJson<Aris2Output>(raw, {
        winThemes: ['Technical excellence', 'Past performance', 'Cost efficiency'],
        keyRisks: ['Tight deadline', 'Complex compliance requirements'],
        execBriefing: 'Analysis unavailable.',
    });
}

// ─── ARIS-3: Win Probability Scorer ──────────────────────────────────────────

export async function aris3_score(extraction: Aris1Output, strategy: Aris2Output): Promise<Aris3Output> {
    const prompt = `
You are ARIS-3, a Government Contracting Win Probability Scorer.

Score this opportunity based on:
- Project: ${extraction.projectTitle}
- Agency: ${extraction.agency}
- Value: ${extraction.estValue}
- Set-Aside: ${extraction.setAside}
- Win Themes: ${strategy.winThemes.join(', ')}
- Key Risks: ${strategy.keyRisks.join(', ')}
- Compliance Items: ${extraction.complianceItems.length} requirements identified

Consider: contract size, set-aside favorability, number of compliance requirements,
agency familiarity, and strategic alignment.

Return this exact JSON:
{
  "winScore": 72,
  "matchScore": "7.2/10"
}

winScore is an integer 0–100. matchScore is the same value expressed as X.X/10.
Return ONLY raw JSON. No markdown, no explanation.
`.trim();

    const raw = await generateText(prompt);
    return parseJson<Aris3Output>(raw, { winScore: 50, matchScore: '5.0/10' });
}

// ─── ARIS-4: Proposal Architect (Pro) ────────────────────────────────────────

export async function aris4_draft(pdfText: string, extraction: Aris1Output, strategy: Aris2Output, score: Aris3Output): Promise<Aris4Output> {
    const prompt = `
You are ARIS-4, an elite Government Proposal Architect with 20 years of GovCon experience.

Write a complete, compliant proposal draft for this opportunity:

PROJECT INTELLIGENCE:
- Title: ${extraction.projectTitle}
- Agency: ${extraction.agency}
- Value: ${extraction.estValue}
- Deadline: ${extraction.deadline}
- NAICS: ${extraction.naicsCode}
- Set-Aside: ${extraction.setAside}
- Win Score: ${score.winScore}/100

STRATEGIC DIRECTION:
- Win Themes: ${strategy.winThemes.join('; ')}
- Key Risks to Address: ${strategy.keyRisks.join('; ')}
- Executive Briefing: ${strategy.execBriefing}

COMPLIANCE REQUIREMENTS:
${extraction.complianceItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

ORIGINAL RFP (first 15,000 chars for context):
${pdfText.slice(0, 15000)}

Write a professional proposal with these sections:
1. **Executive Summary** (2–3 paragraphs)
2. **Technical Approach** (3–4 paragraphs addressing key requirements)
3. **Management Plan** (2 paragraphs: team structure, communication)
4. **Past Performance** (2 relevant examples, placeholder names OK)
5. **Pricing Narrative** (1 paragraph: value justification, not actual numbers)

Use professional GovCon language. Address each compliance item. Emphasize the win themes.
Return the full proposal as plain text with markdown headers (##).
`.trim();

    const draft = await generateText(prompt);
    return { proposalDraft: draft };
}

// ─── Full Pipeline (Free Tier: ARIS-1 + 2 + 3) ───────────────────────────────

export async function runFullAnalysis(pdfText: string): Promise<FullAnalysis> {
    // Run ARIS-1 first (gate check)
    const extraction = await aris1_extract(pdfText);

    if (!extraction.isValidRfp) {
        return {
            ...extraction,
            winThemes: [], keyRisks: [], execBriefing: '',
            winScore: 0, matchScore: 'N/A',
            proposalDraft: null,
        };
    }

    // Run ARIS-2 and ARIS-3 in parallel
    const [strategy, score] = await Promise.all([
        aris2_analyze(pdfText, extraction),
        aris3_score(extraction, { winThemes: [], keyRisks: [], execBriefing: '' }),
    ]);

    // Re-score with strategy context
    const finalScore = await aris3_score(extraction, strategy);

    return {
        ...extraction,
        ...strategy,
        ...finalScore,
        proposalDraft: null,
    };
}
