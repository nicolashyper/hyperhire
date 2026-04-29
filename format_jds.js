#!/usr/bin/env node
// format_jds.js — Uses Claude to reformat all job descriptions into a consistent structure
const fs = require('fs');
const path = require('path');

// Parse .env manually to avoid environment injection conflicts
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
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

const SYSTEM = `You are a recruiting copywriter. Reformat a raw job description into a clean, consistent structure.

Output exactly this format (plain text, no markdown headers with #, use ALL CAPS section labels):

THE ROLE
2–3 sentences describing what this person will do and why it matters. Be specific and compelling.

WHAT YOU'LL DO
• Responsibility one
• Responsibility two
• Responsibility three
• (4–6 bullets total)

WHAT WE'RE LOOKING FOR
• Requirement one
• Requirement two
• Requirement three
• (4–6 bullets total)

NICE TO HAVE
• Optional thing one
• Optional thing two
• (2–3 bullets, skip section entirely if nothing relevant)

Rules:
- Use "•" for bullets, not "-" or "*"
- No markdown, no hashtags, no bold/italic
- Keep it tight: max ~300 words total
- Infer missing details from job title, company name, and comp range — don't leave generic placeholders
- Do not include company description, compensation, or location (shown separately in UI)
- If raw input is very thin, write a compelling description based on title + company context`;

async function formatJD(job) {
  const input = [
    `Job Title: ${job.title}`,
    `Company: ${job.company_name}`,
    `Location: ${job.location}`,
    `Comp: ${job.comp_range}`,
    `Function: ${job.function_area}`,
    `Seniority: ${job.seniority}`,
    `Raw JD:\n${job.description || '(none)'}`,
  ].join('\n');

  const msg = await claude.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    system: SYSTEM,
    messages: [{ role: 'user', content: input }],
  });

  return msg.content[0].text.trim();
}

async function main() {
  const { data: jobs, error } = await sb
    .from('hh_jobs')
    .select('id, title, company_name, location, comp_range, function_area, seniority, description')
    .eq('is_active', true);

  if (error) { console.error('Fetch error:', error); process.exit(1); }
  console.log(`Formatting ${jobs.length} job descriptions with Claude...\n`);

  let done = 0;
  for (const job of jobs) {
    try {
      const formatted = await formatJD(job);
      const { error: upErr } = await sb
        .from('hh_jobs')
        .update({ description: formatted })
        .eq('id', job.id);

      if (upErr) {
        console.error(`✗ ${job.id} update failed:`, upErr.message);
      } else {
        done++;
        console.log(`✓ [${done}/${jobs.length}] ${job.id} — ${job.title} @ ${job.company_name}`);
      }
    } catch (e) {
      console.error(`✗ ${job.id} error:`, e.message);
    }
  }

  console.log(`\nDone. Formatted ${done}/${jobs.length} JDs.`);
}

main();
