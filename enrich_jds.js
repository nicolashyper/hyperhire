#!/usr/bin/env node
// enrich_jds.js — Fetches all active hh_jobs and rewrites description/must_haves/nice_to_haves using Claude Haiku
require('dotenv').config({ override: true });
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function enrichJob(job) {
  const existing = (job.description || '').slice(0, 1500);
  const aboutCompany = (job.about_company || '').slice(0, 400);
  const currentMust = (() => { try { return JSON.parse(job.must_haves || '[]'); } catch { return []; } })();

  const context = [
    `Title: ${job.title}`,
    `Company: ${job.company_name}`,
    `Location: ${job.location} (${job.remote_type})`,
    `Comp: ${job.comp_range}`,
    `Seniority: ${job.seniority}`,
    `Function: ${job.function_area}`,
    aboutCompany ? `About company: ${aboutCompany}` : '',
    existing ? `Raw JD text:\n${existing}` : '',
    currentMust.length ? `Current requirements: ${currentMust.join(' | ')}` : '',
  ].filter(Boolean).join('\n');

  const prompt = `You write terse, high-signal job descriptions for a recruiter marketplace. Senior candidates hate fluff — be specific and direct.

${context}

Return a JSON object with exactly these keys:
- "description": 2–3 paragraphs separated by \\n\\n. Cover: what the role does day-to-day, the problem the company is solving, what makes this opportunity compelling. Be concrete — reference the company/product specifically. No bullets, no headers in this field.
- "must_haves": array of 4–5 strings. Specific, verifiable requirements. Start each with a noun or skill phrase (not "you"). E.g. "5+ years building distributed systems in Go or Rust".
- "nice_to_haves": array of 3 strings. Real differentiators, not generic fillers.

Respond with ONLY valid JSON — no markdown fences, no explanation.`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(raw);
}

async function main() {
  console.log('Fetching active jobs from Supabase...');
  const IDS = process.argv[2] ? process.argv[2].split(',') : null;
  let query = sb.from('hh_jobs').select('*').eq('is_active', true);
  if (IDS) query = query.in('id', IDS);
  const { data: jobs, error } = await query;
  if (error) { console.error('Supabase error:', error); process.exit(1); }
  console.log(`Found ${jobs.length} jobs. Enriching with Haiku...\n`);

  let ok = 0, failed = 0;
  for (const job of jobs) {
    process.stdout.write(`  ${job.id} — ${job.title} @ ${job.company_name}... `);
    try {
      const enriched = await enrichJob(job);

      if (!enriched.description || !Array.isArray(enriched.must_haves)) {
        throw new Error('Unexpected response shape');
      }

      const { error: upErr } = await sb.from('hh_jobs').update({
        description: enriched.description,
        must_haves: JSON.stringify(enriched.must_haves),
        nice_to_haves: JSON.stringify(enriched.nice_to_haves || []),
      }).eq('id', job.id);

      if (upErr) throw new Error(upErr.message);
      console.log('✓');
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nDone. ${ok} enriched, ${failed} failed.`);
}

main();
