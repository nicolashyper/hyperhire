#!/usr/bin/env node
// format_requirements.js — Rewrites must-haves & nice-to-haves per job using Claude
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}
const env = loadEnv();

const { createClient } = require('@supabase/supabase-js');
const { default: Anthropic } = require('@anthropic-ai/sdk');

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const claude = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a head of talent at a top-tier VC firm. Your job is to write must-haves and nice-to-haves for a recruiter sourcing candidates — not generic HR requirements, but sharp, specific, recruiter-actionable criteria.

Return ONLY valid JSON in this exact shape:
{
  "must_haves": ["string", "string", "string", "string", "string"],
  "nice_to_haves": ["string", "string", "string"]
}

Rules for must_haves (5 items):
- Be specific to the role, company stage, and tech stack
- Include at least one item about WHERE to source from (e.g. "Ex-Stripe, Cloudflare, Datadog, or similar infra-heavy companies")
- Include one item about startup/stage fit (e.g. "Has worked at a <50 person company, ideally pre-Series B")
- Include concrete technical or functional requirements, not vague traits
- No boilerplate like "strong communication skills" or "team player"

Rules for nice_to_haves (3 items):
- Genuine differentiators, not filler
- Can include domain expertise, specific tools, open source, or background signals
- One item can be about signal indicators (e.g. "Has shipped a side project or open source tool", "Previously founded a company")

Be terse and direct. Write like a smart recruiter briefing, not a job posting.`;

async function formatRequirements(job) {
  const input = [
    `Job Title: ${job.title}`,
    `Company: ${job.company_name}`,
    `Location: ${job.location}`,
    `Comp: ${job.comp_range}`,
    `Function: ${job.function_area}`,
    `Seniority: ${job.seniority}`,
    `About company: ${job.about_company}`,
    `JD summary: ${(job.description || '').slice(0, 500)}`,
  ].join('\n');

  const msg = await claude.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    system: SYSTEM,
    messages: [{ role: 'user', content: input }],
  });

  const text = msg.content[0].text.trim();
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON in response: ${text}`);
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  const { data: jobs, error } = await sb
    .from('hh_jobs')
    .select('id, title, company_name, location, comp_range, function_area, seniority, about_company, description')
    .eq('is_active', true);

  if (error) { console.error('Fetch error:', error); process.exit(1); }
  console.log(`Rewriting requirements for ${jobs.length} jobs...\n`);

  let done = 0;
  for (const job of jobs) {
    try {
      const { must_haves, nice_to_haves } = await formatRequirements(job);
      const { error: upErr } = await sb
        .from('hh_jobs')
        .update({
          must_haves: JSON.stringify(must_haves),
          nice_to_haves: JSON.stringify(nice_to_haves),
        })
        .eq('id', job.id);

      if (upErr) {
        console.error(`✗ ${job.id} update failed:`, upErr.message);
      } else {
        done++;
        console.log(`✓ [${done}/${jobs.length}] ${job.id} — ${job.title} @ ${job.company_name}`);
        console.log(`   MH: ${must_haves[0]}`);
        console.log(`   NH: ${nice_to_haves[0]}`);
      }
    } catch (e) {
      console.error(`✗ ${job.id} error:`, e.message);
    }
  }

  console.log(`\nDone. Updated ${done}/${jobs.length} jobs.`);
}

main();
