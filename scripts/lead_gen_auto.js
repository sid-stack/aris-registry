/**
 * BidSmith Lead Gen Automation
 * Pipeline: USAspending (free) → Apollo enrichment → LLM first lines → CSV
 *
 * Usage:
 *   node scripts/lead_gen_auto.js [--naics 541511,541512] [--days 90] [--limit 30] [--dry-run]
 *
 * Env vars required:
 *   APOLLO_API_KEY     — Apollo.io API key
 *   OPENROUTER_API_KEY — for first-line generation (optional, falls back to template)
 *
 * Output: leads/output_YYYY-MM-DD.csv
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────

const APOLLO_API_KEY = process.env.APOLLO_API_KEY?.trim();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// IT Services / Gov Consulting NAICS codes
const DEFAULT_NAICS = [
  '541511', // Custom Computer Programming
  '541512', // Computer Systems Design
  '541519', // Other Computer Related Services
  '541611', // Administrative Mgmt Consulting
  '541690', // Other Scientific & Technical Consulting
  '541715', // R&D in Engineering Sciences
  '561110', // Office Administrative Services
];

// ICP persona title keywords (Apollo people search)
const ICP_TITLES = [
  'Business Development',
  'Capture Manager',
  'Director of Proposals',
  'VP Business Development',
  'Chief Executive',
  'President',
  'Founder',
  'Partner',
  'Head of Growth',
  'Director of Growth',
];

// Known large primes — outside ICP (>10k employees), skip to save Apollo credits
const BIG_PRIME_KEYWORDS = [
  'leidos', 'booz allen', 'saic', 'science applications', 'accenture',
  'deloitte', 'ibm', 'oracle', 'microsoft', 'amazon', 'aws', 'google',
  'raytheon', 'lockheed', 'northrop', 'general dynamics', 'l3harris',
  'caci', 'mantech', 'unison', 'perspecta', 'dxc technology', 'mitre',
  'bah ', 'booz ', 'kpmg', 'pwc', 'ernst', 'mckinsey', 'palantir',
];

// Do Not Contact — already in sequence
const DNC_EMAILS = new Set([
  'jennifer.serin@sev1tech.com',
  'andrew.cohen@sev1tech.com',
  'christa.carter@reisystems.com',
  'erin.horrell@intelligentwaves.com',
  'dennis.freeland@intelligentwaves.com',
  'sales@xceleratesolutions.com',
  'psahady@chevoconsulting.com',
  'zsahady@chevoconsulting.com',
  'ggodbout@fearless.tech',
  'bchappell@alphaomega.com',
  'acandreva@tantustech.com',
  'gprice@akira-tech.com',
  'mbowers@pragmatics.com',
  'lbuckhout@corvus-consulting-llc.com',
  'pdonlin@buchanan.com',
  'tyler.sweatt@secondfront.com',
  'mhopkins@electrosoft-inc.com',
  'jvandemark@sabresystems.com',
  // Batch 3 — already sent
  'ethan.meurlin@octoconsulting.com',
  'gregg.kulichik@intellibridge.us',
  'desmond.clay@torchtechnologies.com',
  'dave.matson@telos.com',
  'greg.sutton@novetta.com',
  'abid.bargeer@gcomsoft.com',
  'christopher.kapuscik@vsolvit.com',
  'chris.bishop@hendall.com',
  'blake.shackelford@katmaicorp.com',
  'cstone@gridironit.com',
  'kamran.bakhtian@doveltech.com',
  'cindy.bishop@salientcrgt.com',
  'madhu.raju@karsun-solutions.com',
  'bala.ramanan@softrams.com',
  'victor.ocampo@actionet.com',
  'ike.kamara@brillient.com',
  'tony.tanner@sentar.com',
  'prince.osei@aalismc.com',
  'sudeep.kumar@softrams.com',
  'matthew.konya@katmaicorp.com',
]);

// ─── Parse CLI args ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const naicsCodes = getArg('--naics')?.split(',') || DEFAULT_NAICS;
const lookbackDays = parseInt(getArg('--days') || '90', 10);
const maxLeads = parseInt(getArg('--limit') || '30', 10);
const dryRun = args.includes('--dry-run');

// ─── USAspending: pull recent contract winners ───────────────────────────────

async function fetchContractWinners(naicsCodes, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const dateStr = cutoff.toISOString().split('T')[0];

  console.log(`[USAspending] Querying ${naicsCodes.length} NAICS codes since ${dateStr}...`);

  const results = [];
  const seenCompanies = new Set();

  // Batch NAICS codes into chunks of 5 (API limit)
  for (let i = 0; i < naicsCodes.length; i += 5) {
    const chunk = naicsCodes.slice(i, i + 5);

    try {
      const resp = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            naics_codes: chunk,
            award_type_codes: ['A', 'B', 'C', 'D'],
            time_period: [{ start_date: dateStr, end_date: new Date().toISOString().split('T')[0] }],
          },
          limit: 50,
          sort: 'Start Date',
          order: 'desc',
          fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Agency', 'Start Date', 'Description', 'NAICS Code', 'NAICS Description'],
        }),
      });

      const data = await resp.json();

      if (data.detail) {
        console.warn(`[USAspending] API warning:`, data.detail);
        continue;
      }

      for (const award of data.results || []) {
        const company = (award['Recipient Name'] || '').trim();
        if (!company || seenCompanies.has(company.toLowerCase())) continue;

        // Skip very small or very large by award amount (proxy for company size)
        const amount = parseFloat(award['Award Amount'] || 0);
        if (amount < 50_000) continue;   // too small
        if (amount > 50_000_000) continue; // likely a large prime, not ICP

        // Skip known large primes by name
        const companyLower = company.toLowerCase();
        if (BIG_PRIME_KEYWORDS.some((kw) => companyLower.includes(kw))) continue;

        seenCompanies.add(companyLower);
        results.push({
          company,
          agency: award['Awarding Agency'] || 'Federal Agency',
          amount,
          contractTitle: award['Description'] || award['Award ID'] || '',
          naicsCode: award['NAICS Code'] || chunk[0],
          naicsDesc: award['NAICS Description'] || 'IT Services',
          awardDate: award['Start Date'] || '',
          awardId: award['Award ID'] || '',
        });
      }
    } catch (err) {
      console.warn(`[USAspending] Fetch failed for NAICS ${chunk}:`, err.message);
    }

    // Rate limit — be polite to the public API
    await sleep(300);
  }

  console.log(`[USAspending] Found ${results.length} unique contractors.`);
  return results;
}

// ─── Apollo: enrich company → get decision makers ───────────────────────────

async function apolloSearchPeople(companyName, titleKeywords) {
  if (dryRun) {
    return [{ name: 'DRY RUN', title: 'Business Development Director', email: 'dry@run.com', linkedin: '' }];
  }

  // Search for people at this company with ICP titles
  // Using one credit per search call
  try {
    const resp = await fetch('https://api.apollo.io/v1/people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        api_key: APOLLO_API_KEY,
        q_organization_name: companyName,
        person_titles: titleKeywords,
        page: 1,
        per_page: 5,
        // Filter: US only, company size 11-500 employees
        organization_num_employees_ranges: ['11,500'],
      }),
    });

    const data = await resp.json();

    if (data.error) {
      console.warn(`[Apollo] Error for "${companyName}":`, data.error);
      return [];
    }

    return (data.people || []).map((p) => ({
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      title: p.title || '',
      email: p.email || '',
      linkedin: p.linkedin_url || '',
      companyDomain: p.organization?.primary_domain || '',
      employeeCount: p.organization?.num_employees || null,
    }));
  } catch (err) {
    console.warn(`[Apollo] Request failed for "${companyName}":`, err.message);
    return [];
  }
}

// ─── LLM: generate personalized first line ──────────────────────────────────

async function generateFirstLine(contact, award) {
  const fallback = `Saw ${award.company} recently won a ${award.naicsDesc.toLowerCase()} contract with ${award.agency} — figured BidSmith might be relevant as you scale your proposal operations.`;

  if (!OPENROUTER_API_KEY) return fallback;

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://bidsmith.pro',
        'X-Title': 'BidSmith Lead Gen',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content:
              'You write cold email openers for BidSmith, a tool that helps gov contractors win more RFPs. Write ONE sentence (max 25 words). Use the contract signal. Be direct. No praise. No fluff. Start with "Saw" or "Noticed".',
          },
          {
            role: 'user',
            content: `Company: ${award.company}\nRecipient: ${contact.name} (${contact.title})\nContract won: ${award.contractTitle || award.naicsDesc} with ${award.agency}\nAmount: $${(award.amount / 1000).toFixed(0)}k`,
          },
        ],
        temperature: 0.3,
        max_tokens: 60,
      }),
    });

    const data = await resp.json();
    const line = data.choices?.[0]?.message?.content?.trim();
    return line || fallback;
  } catch (err) {
    console.warn('[LLM] First line generation failed:', err.message);
    return fallback;
  }
}

// ─── CSV writer ──────────────────────────────────────────────────────────────

function escapeCsv(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toRow(fields) {
  return fields.map(escapeCsv).join(',');
}

// ─── Main pipeline ───────────────────────────────────────────────────────────

async function run() {
  console.log('\n=== BidSmith Lead Gen Automation ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'} | Limit: ${maxLeads} leads | Lookback: ${lookbackDays} days\n`);

  if (!APOLLO_API_KEY) {
    console.error('[FATAL] APOLLO_API_KEY is not set. Add it to .env (never commit API keys to the repo).');
    process.exit(1);
  }

  // Step 1: Pull contract winners from USAspending
  const awards = await fetchContractWinners(naicsCodes, lookbackDays);

  if (awards.length === 0) {
    console.log('No awards found. Try widening NAICS codes or lookback window.');
    process.exit(0);
  }

  // Step 2: Enrich via Apollo + filter
  const rows = [];
  let apolloCallCount = 0;
  const MAX_APOLLO_CALLS = dryRun ? awards.length : Math.min(awards.length, 50); // guard credits

  console.log(`[Apollo] Enriching up to ${MAX_APOLLO_CALLS} companies...\n`);

  for (const award of awards.slice(0, MAX_APOLLO_CALLS)) {
    if (rows.length >= maxLeads) break;

    process.stdout.write(`  → ${award.company}... `);
    const contacts = await apolloSearchPeople(award.company, ICP_TITLES);
    apolloCallCount++;

    if (contacts.length === 0) {
      console.log('no contacts found');
      await sleep(500);
      continue;
    }

    let added = 0;
    for (const contact of contacts) {
      if (!contact.email) continue;
      const emailLower = contact.email.toLowerCase();
      if (DNC_EMAILS.has(emailLower)) continue;

      // ICP filter: employee count 11–200 if available
      if (contact.employeeCount && contact.employeeCount > 500) continue;

      const firstLine = await generateFirstLine(contact, award);

      rows.push({
        firstName: contact.name.split(' ')[0] || '',
        fullName: contact.name,
        title: contact.title,
        email: contact.email,
        company: award.company,
        domain: contact.companyDomain,
        linkedin: contact.linkedin,
        agency: award.agency,
        contractTitle: award.contractTitle,
        awardAmount: award.amount,
        naics: award.naicsDesc,
        awardDate: award.awardDate,
        firstLine,
        signal: `Won ${award.naicsDesc} contract with ${award.agency}`,
      });
      added++;
      if (rows.length >= maxLeads) break;
    }

    console.log(added > 0 ? `${added} contact(s) added` : 'filtered out');

    // Apollo rate limit — 1 req/sec on free plan
    await sleep(dryRun ? 100 : 1100);
  }

  if (rows.length === 0) {
    console.log('\nNo qualified leads found after filtering. Try adjusting --naics or --days.');
    process.exit(0);
  }

  // Step 3: Write CSV
  const outputDir = resolve(__dirname, '../leads');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const today = new Date().toISOString().split('T')[0];
  const outputPath = resolve(outputDir, `output_${today}.csv`);

  const header = toRow([
    'First Name', 'Full Name', 'Title', 'Email', 'Company', 'Domain',
    'LinkedIn', 'Agency', 'Contract', 'Award Amount ($)', 'NAICS',
    'Award Date', 'First Line (Personalized)', 'Signal',
  ]);

  const csvRows = rows.map((r) =>
    toRow([
      r.firstName, r.fullName, r.title, r.email, r.company, r.domain,
      r.linkedin, r.agency, r.contractTitle, r.awardAmount, r.naics,
      r.awardDate, r.firstLine, r.signal,
    ])
  );

  writeFileSync(outputPath, [header, ...csvRows].join('\n'), 'utf8');

  // Step 4: Summary
  console.log(`\n✓ Done.`);
  console.log(`  Leads generated : ${rows.length}`);
  console.log(`  Apollo calls    : ${apolloCallCount} (credits used)`);
  console.log(`  Output file     : ${outputPath}`);

  if (!dryRun) {
    console.log(`\n  Next: import CSV into your email tool (Gmail automation / Instantly / Lemlist)`);
    console.log(`  Remaining Apollo credits: check https://app.apollo.io/#/settings/credits/current`);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

run().catch((err) => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
