#!/usr/bin/env node
/**
 * apply-db-functions.mjs
 *
 * Applies (or re-applies) all PL/pgSQL functions defined in
 * prisma/functions.sql to the connected database.
 *
 * Usage:
 *   node scripts/apply-db-functions.mjs
 *
 * Requires DATABASE_URL to be set in .env (loaded automatically).
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load .env
try {
  const dotenv = require("dotenv");
  dotenv.config({ path: join(__dirname, "../.env") });
  dotenv.config({ path: join(__dirname, "../.env.local") });
} catch {
  // dotenv is optional – DATABASE_URL may already be set
}

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const sqlPath = join(__dirname, "../prisma/functions.sql");

async function main() {
  console.log("📦 Reading functions.sql ...");
  const sql = readFileSync(sqlPath, "utf8");

  console.log("⚙️  Applying PL/pgSQL functions to database ...");
  // Send the entire file as one query — dollar-quoted function bodies contain
  // semicolons so splitting on ';' would corrupt them.
  try {
    await pool.query(sql);
    const matches = [...sql.matchAll(/CREATE OR REPLACE FUNCTION\s+(\w+)/gi)];
    for (const m of matches) console.log(`   ✅ ${m[1]}`);
  } catch (err) {
    console.error("   ❌ Error applying functions.sql:", err.message);
    throw err;
  }

  console.log("\n✅ All database functions applied successfully.");
  console.log(
    "   Functions available: fn_resumen_dashboard, fn_saldo_caja,\n" +
      "   fn_cajas_con_saldos, fn_saldo_filiales, fn_resumen_filiales",
  );
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e.message);
    process.exit(1);
  })
  .finally(() => pool.end());
