const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  connectionString: `postgresql://postgres:${process.env.DB_PASSWORD || 'mhq4jENPjoD2CqhX'}@db.ytnkupxvzulgtvpdnvps.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected to Supabase');
  const sql = fs.readFileSync('./migration.sql', 'utf8');
  await client.query(sql);
  console.log('Migration complete');
  await client.end();
}

run().catch(err => { console.error(err.message); process.exit(1); });
