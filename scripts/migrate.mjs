import { readFile } from "node:fs/promises";
import { neon, neonConfig } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env", quiet: true });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diatur.");
if (process.env.NEON_FETCH_ENDPOINT)
  neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT;
const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(
  new URL("../migrations/001-managed-events.sql", import.meta.url),
  "utf8",
);
await sql.transaction(
  migration
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => sql.query(s)),
);
console.log(
  "Migrasi event dan whitelist selesai; data event/user/tamu yang ada tidak diubah.",
);
