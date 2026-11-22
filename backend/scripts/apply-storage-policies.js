// Applies supabase/storage-policies.sql to the database in DATABASE_URL / DIRECT_URL.
// Usage (from the backend folder): node scripts/apply-storage-policies.js
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'storage-policies.sql'), 'utf8');
const statements = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL });

(async () => {
  for (const stmt of statements) await prisma.$executeRawUnsafe(stmt);
  const rows = await prisma.$queryRawUnsafe(
    `select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'avatars:%' order by policyname`
  );
  console.log('Storage policies now in place:');
  console.table(rows);
  await prisma.$disconnect();
})().catch(async (err) => {
  console.error('Failed:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
