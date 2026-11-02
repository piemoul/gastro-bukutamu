// One-time read-only source copy into an empty local Docker database.
import { readFile } from "node:fs/promises";
import { parse } from "dotenv";
import { neon } from "@neondatabase/serverless";
import pg from "pg";

const target = new URL(process.env.DATABASE_URL);
if (target.hostname !== "bukutamu-db")
  throw new Error("Target harus database Docker lokal.");
const source = parse(await readFile("/source.env"));
const sql = neon(source.DATABASE_URL);
const client = new pg.Client({ connectionString: target.toString() });
await client.connect();
try {
  const exists = await client.query(
    "SELECT to_regclass('public.users') AS existing",
  );
  if (exists.rows[0].existing)
    throw new Error("Target sudah berisi data; penyalinan dibatalkan.");
  const [users, events, clients] = await sql.transaction(
    [
      sql`SELECT * FROM users ORDER BY id`,
      sql`SELECT * FROM events ORDER BY code`,
      sql`SELECT * FROM clients ORDER BY id`,
    ],
    { readOnly: true, isolationLevel: "RepeatableRead" },
  );
  await client.query("BEGIN");
  await client.query(`
    CREATE TABLE users (id SERIAL PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,area TEXT,password_hash TEXT,role TEXT NOT NULL DEFAULT 'sales',created_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE TABLE events (code TEXT PRIMARY KEY,name TEXT NOT NULL,event_password TEXT NOT NULL);
    CREATE TABLE clients (id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,event_code TEXT NOT NULL REFERENCES events(code),client_name TEXT NOT NULL,company_name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,product_interest TEXT NOT NULL,notes TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE INDEX idx_clients_user ON clients(user_id);
    CREATE INDEX idx_clients_event ON clients(event_code);
  `);
  for (const [table, rows] of [
    ["users", users],
    ["events", events],
    ["clients", clients],
  ]) {
    if (!rows.length) continue;
    const columns = Object.keys(rows[0]);
    const statement = `INSERT INTO ${table} (${columns.map((c) => '"' + c.replaceAll('"', '""') + '"').join(",")}) VALUES (${columns.map((_, i) => "$" + (i + 1)).join(",")})`;
    for (const row of rows)
      await client.query(
        statement,
        columns.map((column) => row[column]),
      );
  }
  for (const table of ["users", "clients"])
    await client.query(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT max(id) FROM ${table}), 1), EXISTS(SELECT 1 FROM ${table}))`,
    );
  await client.query("COMMIT");
  console.log(
    JSON.stringify({
      copied_to_local: true,
      users: users.length,
      events: events.length,
      clients: clients.length,
      source_writes: 0,
    }),
  );
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(
    error.message?.includes("Target")
      ? error.message
      : "Penyalinan gagal; target lokal di-rollback.",
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
