#!/usr/bin/env node
// fix_locations.js — Uses Claude to infer location for jobs with empty location field
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const env = { ...process.env };
  try {
    const lines = fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([^=]+)=(.*)$/);
      if (m && !env[m[1].trim()]) env[m[1].trim()] = m[2].trim();
    }
  } catch { /* no .env file in CI - use process.env */ }
  return env;
}
const env = loadEnv();

const { createClient } = require('@supabase/supabase-js');
const { default: Anthropic } = require('@anthropic-ai/sdk');

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const claude = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const SYSTEM = `You are filling in missing location data for a job listing.

Given a job title, company name, and job description, infer the most likely office location.

Return ONLY valid JSON in this exact shape:
{
  "location": "string",
  "remote_type": "Remote" | "Hybrid" | "On-site"
}

Rules:
- "location" should be a concise city/region like "SF", "NYC", "LA", "Remote", "NYC and SF", "Remote / US"
- If the JD mentions "remote", "fully distributed", "anywhere", use location "Remote" and remote_type "Remote"
- If the JD mentions on-site / in office / X days a week, use remote_type "On-site"
- If hybrid or unspecified, use remote_type "Hybrid"
- For known SF Bay Area companies (Bland.ai, AthenaHQ, Eigen, CellType, etc.), default to "SF" if no other signal
- For NYC companies (FortunaHealth, Dataland, etc.), default to "NYC"
- If you really can't tell, use "SF" as the safest default for AI/tech startups`;

async function inferLocation(job) {
  const input = [
    `Title: ${job.title}`,
    `Company: ${job.company_name}`,
    `About: ${job.about_company || ''}`,
    `Description (excerpt):\n${(job.description || '').slice(0, 800)}`,
  ].join('\n');

  const msg = await claude.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    system: SYSTEM,
    messages: [{ role: 'user', content: input }],
  });

  const text = msg.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON: ${text}`);
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  const { data: jobs, error } = await sb
    .from('hh_jobs')
    .select('id, title, company_name, location, about_company, description')
    .eq('is_active', true)
    .or('location.is.null,location.eq.');

  if (error) { console.error('Fetch error:', error); process.exit(1); }
  console.log(`Inferring location for ${jobs.length} jobs...\n`);

  for (const job of jobs) {
    try {
      const { location, remote_type } = await inferLocation(job);
      const { error: upErr } = await sb.from('hh_jobs')
        .update({ location, remote_type })
        .eq('id', job.id);
      if (upErr) console.error(`✗ ${job.id}:`, upErr.message);
      else console.log(`✓ ${job.id} ${job.company_name}: ${location} (${remote_type})`);
    } catch (e) {
      console.error(`✗ ${job.id} error:`, e.message);
    }
  }
}

main();
