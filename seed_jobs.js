#!/usr/bin/env node
// seed_jobs.js — Fetches Status="High Priority" jobs from Notion and upserts into hh_jobs
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB_ID = '1546784772fd4c8d817f035968242434';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // service role key

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Deterministic 2-letter logo from company name
function companyLogo(name) {
  const cleaned = name.replace(/[^a-zA-Z\s]/g, '').trim();
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

// Deterministic oklch tint from company name
function companyTint(name) {
  const hues = [145, 250, 60, 25, 200, 40, 290, 80, 330, 170, 310, 100, 220, 350, 130];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  const hue = hues[Math.abs(hash) % hues.length];
  return `oklch(0.85 0.06 ${hue})`;
}

// Derive remote_type from location string
function remoteType(loc) {
  if (!loc) return 'Remote';
  const l = loc.toLowerCase();
  if (l.includes('remote')) return 'Remote';
  if (l.includes('only') || l.includes('in-office') || l.includes('in office') || l.includes('5 days')) return 'On-site';
  return 'Hybrid';
}

// Derive function area from title
function functionArea(title) {
  const t = title.toLowerCase();
  if (/(engineer|developer|dev|swe|cto|infra|backend|frontend|fullstack|full stack|platform|ml|ai|research|scientist|technical lead|tech lead|architect|devops|devrel|solidity|blockchain|rust|zkp|protocol)/.test(t)) return 'Engineering';
  if (/(growth|marketing|content|community|seo|social|brand|cmo)/.test(t)) return 'Marketing';
  if (/(sales|account executive|bd|business dev|revenue)/.test(t)) return 'Sales';
  if (/(product manager|pm\b|head of product|staff product)/.test(t)) return 'Product';
  if (/(designer|design|ux|ui)/.test(t)) return 'Design';
  if (/(chief of staff|head of people|operations|ops|finance|cfo)/.test(t)) return 'Operations';
  return 'Other';
}

// Derive seniority from title
function seniority(title) {
  const t = title.toLowerCase();
  if (/(founding|chief|cto|cfo|cmo|coo|director|head of|vp )/.test(t)) return 'Lead';
  if (/(staff|principal|lead )/.test(t)) return 'Staff';
  if (/(senior|sr\.|sr )/.test(t)) return 'Senior';
  if (/(junior|jr\.)/.test(t)) return 'Junior';
  return 'Mid';
}

// Must-haves by function
function mustHaves(fn, title) {
  const base = {
    Engineering: ['3+ years shipping production code', 'Strong systems fundamentals', 'Comfortable in ambiguous, early-stage environments'],
    Marketing: ['Proven track record building pipeline', 'Strong written communication', 'Data-literate'],
    Sales: ['3+ years closing experience', 'Track record at early-stage startups', 'Comfortable with full-cycle sales'],
    Product: ['Shipped 0→1 products at a startup', 'Strong written communication', 'Technical enough to partner with engineering'],
    Design: ['Portfolio of shipped product work', 'Strong systems thinking', 'Figma proficiency'],
    Operations: ['Previous ops or chief-of-staff experience', 'High agency, low ego', 'Comfortable with ambiguity'],
  };
  return JSON.stringify(base[fn] || ['3+ years relevant experience', 'Startup experience preferred', 'US work authorization']);
}

// Fetch all Notion page blocks as text
async function fetchBlocks(pageId) {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' },
  });
  const data = await res.json();
  const texts = [];
  for (const block of (data.results || [])) {
    const bt = block[block.type] || {};
    const rich = bt.rich_text || [];
    const text = rich.map(t => t.plain_text).join('').trim();
    if (text) texts.push(text);
  }
  return texts.join('\n');
}

// Fetch one page of Notion results
async function fetchNotion(cursor) {
  const body = {
    filter: { property: 'Status', select: { equals: 'High Priority' } },
    page_size: 100,
  };
  if (cursor) body.start_cursor = cursor;

  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Map a Notion result to hh_jobs row
async function mapJob(r) {
  const p = r.properties;
  const jobNum = p.ID?.unique_id?.number;
  if (!jobNum) return null;
  const id = `OJ-${jobNum}`;

  const title = p.Title?.title?.map(t => t.plain_text).join('').trim() || '';
  const company = p.Company?.select?.name || '';
  const location = p.Location?.select?.name || '';
  const salary = p.Salary?.rich_text?.map(t => t.plain_text).join('') || '';
  const jdUrl = p['Job Desc']?.url || '';

  let description = p['JD Text']?.rich_text?.map(t => t.plain_text).join('') || '';
  let companyPitch = p['Company Pitch']?.rich_text?.map(t => t.plain_text).join('') || '';
  let companyCtx = p['Company Context']?.rich_text?.map(t => t.plain_text).join('') || '';

  // Fall back to page blocks when JD Text is empty
  if (!description) {
    description = await fetchBlocks(r.id);
  }

  const fn = functionArea(title);
  const logo = companyLogo(company);
  const tint = companyTint(company);
  const remote = remoteType(location);
  const sen = seniority(title);

  // Days open: approximate from created_at
  const createdAt = new Date(r.created_time);
  const daysOpen = Math.floor((Date.now() - createdAt) / 86400000);

  return {
    id,
    title: title.replace(/\s+/g, ' ').trim(),
    company_name: company,
    company_logo: logo,
    company_tint: tint,
    company_industry: fn === 'Engineering' ? 'Tech' : fn,
    company_size: '11–200',
    company_stage: 'Seed–Series B',
    location,
    remote_type: remote,
    comp_range: salary || 'Competitive',
    seniority: sen,
    function_area: fn,
    fee: 10000,
    description: description.slice(0, 2000),
    must_haves: mustHaves(fn, title),
    nice_to_haves: JSON.stringify(['Previous startup experience', 'US work authorization', 'Strong written communication']),
    hiring_manager_name: '',
    hiring_manager_title: '',
    about_company: companyPitch || companyCtx || `${company} is an early-stage company hiring a ${title}.`,
    jd_url: jdUrl,
    is_urgent: false,
    is_active: true,
    days_open: daysOpen,
  };
}

async function main() {
  console.log('Fetching High Priority jobs from Notion...');
  let cursor = null;
  let allJobs = [];

  do {
    const data = await fetchNotion(cursor);
    if (data.error) { console.error('Notion error:', data); process.exit(1); }
    const jobs = await Promise.all(data.results.map(mapJob));
    allJobs.push(...jobs.filter(Boolean));
    cursor = data.has_more ? data.next_cursor : null;
    process.stdout.write(`  fetched ${allJobs.length} jobs...\r`);
  } while (cursor);

  console.log(`\nFetched ${allJobs.length} jobs. Upserting to Supabase...`);

  // Upsert current High Priority jobs
  const { error } = await sb.from('hh_jobs').upsert(allJobs, { onConflict: 'id' });
  if (error) { console.error('Supabase error:', error); process.exit(1); }

  // Deactivate jobs no longer in High Priority
  const activeIds = allJobs.map(j => j.id);
  const { data: existing } = await sb.from('hh_jobs').select('id').eq('is_active', true);
  const toDeactivate = (existing || []).map(r => r.id).filter(id => !activeIds.includes(id));
  if (toDeactivate.length > 0) {
    const { error: deErr } = await sb.from('hh_jobs').update({ is_active: false }).in('id', toDeactivate);
    if (deErr) console.error('Deactivate error:', deErr);
    else console.log(`✓ Deactivated ${toDeactivate.length} removed jobs: ${toDeactivate.join(', ')}`);
  } else {
    console.log('✓ No jobs to deactivate');
  }

  console.log(`✓ Synced ${allJobs.length} active jobs into hh_jobs`);
  allJobs.forEach(j => console.log(`  ${j.id} — ${j.title} @ ${j.company_name}`));
}

main();
