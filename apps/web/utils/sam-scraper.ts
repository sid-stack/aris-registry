import { Aris1Output } from '@/lib/aris-protocol';

export interface ScraperResult {
    rawText: string;
    mappedData: Partial<Aris1Output>;
}

export async function scrapeSamGov(samIdOrUrl: string): Promise<ScraperResult> {
    // Extract ID if URL is provided
    let noticeId = samIdOrUrl;
    if (samIdOrUrl.includes('sam.gov')) {
        const urlParams = new URLSearchParams(samIdOrUrl.split('?')[1] || '');
        const id = urlParams.get('indexId') || urlParams.get('noticeId');
        if (id) {
            noticeId = id;
        } else {
            // Rough extraction from path
            const parts = samIdOrUrl.split('/');
            noticeId = parts[parts.length - 1];
        }
    }

    const API_KEY = process.env.SAM_GOV_API_KEY || 'placeholder_api_key';

    try {
        // Primary: SAM.gov API
        // Public API for opportunities
        const response = await fetch(`https://api.sam.gov/opportunities/v2/search?api_key=${API_KEY}&noticeId=${noticeId}&limit=1`);

        if (response.ok) {
            const data = await response.json();
            if (data && data.opportunitiesData && data.opportunitiesData.length > 0) {
                const opp = data.opportunitiesData[0];

                const mappedData: Partial<Aris1Output> = {
                    isValidRfp: true,
                    projectTitle: opp.title || 'Unknown Title',
                    agency: opp.department || opp.agency || 'Unknown Agency',
                    naicsCode: opp.naicsCode || 'Not specified',
                    setAside: opp.typeOfSetAsideDescription || 'None',
                    estValue: 'TBD',
                    deadline: opp.responseDeadLine || 'TBD',
                    complianceMatrix: [],
                    deliverables: []
                };

                return {
                    rawText: JSON.stringify(opp, null, 2),
                    mappedData
                };
            }
        }

        throw new Error("SAM.gov API request failed or returned empty.");
    } catch (error) {
        console.warn('SAM.gov API failed, falling back to Firecrawl', error);

        // Fallback: Firecrawl
        const targetUrl = samIdOrUrl.startsWith('http') ? samIdOrUrl : `https://sam.gov/opp/${noticeId}/view`;
        const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'placeholder_fc_key';

        try {
            const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: targetUrl,
                    formats: ['markdown']
                })
            });

            if (fcResponse.ok) {
                const fcData = await fcResponse.json();
                const md = fcData.data?.markdown || '';

                return {
                    rawText: md,
                    mappedData: {
                        isValidRfp: true,
                        projectTitle: 'Extracted from SAM.gov (Title pending AI analysis)',
                        agency: 'Agency pending AI analysis',
                        deadline: 'TBD',
                    }
                };
            }
        } catch (fcError) {
            console.error('Firecrawl failed', fcError);
        }
    }

    throw new Error('Could not scrape SAM.gov using API or Fallback.');
}
