/** Tambahkan dua akun sales Bali tanpa menjalankan ulang seed akun lain. */
import { neon, neonConfig } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env" });
if (process.env.NEON_FETCH_ENDPOINT) neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditemukan.");
  const sql = neon(url);
  const users = await sql`
    INSERT INTO users (email, name, area, role, password_hash)
    VALUES
      ('sales1.dps@gastro.co.id', 'Angga', 'Bali', 'sales', NULL),
      ('sales.dps@gastro.co.id', 'Farida', 'Bali', 'sales', NULL)
    ON CONFLICT (email) DO NOTHING
    RETURNING name, area, email, role
  `;
  console.log("Akun ditambahkan:", users);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
