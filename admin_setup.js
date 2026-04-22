#!/usr/bin/env node
// admin_setup.js — creates Supabase admin auth user + runs admin RLS migration
require('dotenv').config({ override: true });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createAdminUser() {
  console.log('Creating admin user...');
  const { data, error } = await sb.auth.admin.createUser({
    email: 'nicolas@hypertalent.me',
    password: '+HyperTalent7555n+',
    email_confirm: true,
  });
  if (error) {
    if (error.message?.includes('already been registered') || error.message?.includes('already exists')) {
      console.log('  Admin user already exists — skipping.');
    } else {
      throw new Error('Auth user creation failed: ' + error.message);
    }
  } else {
    console.log('  Created:', data.user.email);
  }
}

async function runMigration() {
  console.log('Running admin migration...');
  const pg = new Client({
    connectionString: `postgresql://postgres:mhq4jENPjoD2CqhX@db.ytnkupxvzulgtvpdnvps.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();
  const sql = fs.readFileSync('./admin_migration.sql', 'utf8');
  // Run each statement separately to handle IF NOT EXISTS gracefully
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await pg.query(stmt);
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  Policy already exists — skipping.');
      } else {
        console.error('  SQL error:', e.message);
      }
    }
  }
  await pg.end();
  console.log('  Migration done.');
}

async function main() {
  await createAdminUser();
  await runMigration();
  console.log('\n✓ Admin setup complete.');
  console.log('  URL: /admin.html');
  console.log('  Email: nicolas@hypertalent.me');
}

main().catch(e => { console.error(e.message); process.exit(1); });
