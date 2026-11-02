/** Tambahkan event Bali ke database yang sudah ada tanpa mengubah akun atau tamu. */
import { neon, neonConfig } from "@neondatabase/serverless";
import { config } from "dotenv";
import { requirePassword } from "../src/lib/passwords";

config({ path: ".env" });
if (process.env.NEON_FETCH_ENDPOINT) neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditemukan.");
  const password = requirePassword("BALI_EVENT_PASSWORD");
  const sql = neon(url);
  const events = await sql`
    INSERT INTO events (code, name, event_password)
    VALUES ('BALI', 'Gastro day Bali - Morreti X-perience', ${password})
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      event_password = EXCLUDED.event_password
    RETURNING code, name
  `;
  console.log("Event siap:", events[0]);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
