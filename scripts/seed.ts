/**
 * Seed script — buat schema & isi data awal ke Neon Postgres.
 * Run: npm run seed
 *
 * Idempoten: aman dijalankan ulang (CREATE ... IF NOT EXISTS, dan
 * INSERT ... ON CONFLICT untuk users/events).
 */
import { neon, neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { getEventPasswords, requirePassword } from "../src/lib/passwords";
// Konfigurasi lokal terpusat di .env; environment deployment tetap diprioritaskan.
config({ path: ".env" });
if (process.env.NEON_FETCH_ENDPOINT) neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan. Set di .env");
  process.exit(1);
}
const sql = neon(url);

// Data salesman dari Excel (No, Nama, Area, Email)
const SALES: Array<{ no: number; name: string; area: string; email: string }> = [
  { no: 1, name: "Malik", area: "Gandaria", email: "sales1@gastro.co.id" },
  { no: 2, name: "Deni", area: "Gandaria", email: "sales3@gastro.co.id" },
  { no: 3, name: "Bayu", area: "Gandaria", email: "bayu.a@gastro.co.id" },
  { no: 4, name: "Halim", area: "Gandaria", email: "halim@gastro.co.id" },
  { no: 5, name: "Yatie", area: "Gandaria", email: "yatie.n@gastro.co.id" },
  { no: 6, name: "Pipin", area: "Gandaria", email: "pipin.a@saranarefrigeratama.co.id" },
  { no: 7, name: "Helmi", area: "Gandaria", email: "j.helmi@saranarefrigeratama.co.id" },
  { no: 8, name: "Panji", area: "Gandaria", email: "sales4@gastro.co.id" },
  { no: 9, name: "Kiki", area: "Gandaria", email: "sales6@gastro.co.id" },
  { no: 10, name: "Angga", area: "Gandaria", email: "sales5@gastro.co.id" },
  { no: 11, name: "Dondy", area: "Gandaria", email: "dondy.i@gastro.co.id" },
  { no: 12, name: "Ferry", area: "Bandung", email: "a.ferry@gastro.co.id" },
  { no: 13, name: "Taufiq", area: "Bandung", email: "sales.bdg@gastro.co.id" },
  { no: 14, name: "Dedi", area: "Bandung", email: "sales1.bdg@gastro.co.id" },
  { no: 15, name: "Desi", area: "Bali", email: "dessy.a@gastro.co.id" },
  { no: 16, name: "Dion", area: "Gandaria", email: "sales2@gastro.co.id" },
  { no: 17, name: "Dean", area: "Gandaria", email: "chef@gastro.co.id" },
  { no: 18, name: "Novita", area: "Gandaria", email: "marketing@gastro.co.id" },
  { no: 19, name: "Angga", area: "Bali", email: "sales1.dps@gastro.co.id" },
  { no: 20, name: "Farida", area: "Bali", email: "sales.dps@gastro.co.id" },
];

const ADMINS: Array<{ name: string; email: string }> = [
  { name: "Admin Gastro", email: "salesco2.gastro@gmail.com" },
  { name: "Yogi", email: "yogi.k@gastro.co.id" },
  { name: "Oliver", email: "oliver.h@gastro.co.id" },
];

async function main() {
  // Validasi sebelum menulis apa pun ke database.
  const eventPasswords = getEventPasswords();
  const adminPassword = requirePassword("ADMIN_PASSWORD");
  console.log("→ Membuat schema...");
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      area TEXT,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'sales',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      event_password TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_code TEXT NOT NULL REFERENCES events(code),
      client_name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      product_interest TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_clients_event ON clients(event_code)`;

  // Migrasi: tambah kolom notes jika belum ada (idempoten)
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT`;

  console.log("→ Seed events...");
  await sql`
    INSERT INTO events (code, name, event_password) VALUES
      ('NFH', 'NFH (National Food & Hotel)', ${eventPasswords.NFH}),
      ('FHI', 'FHI (Food Hotel Indonesia)', ${eventPasswords.FHI}),
      ('BALI', 'Gastro day Bali - Morreti X-perience', ${eventPasswords.BALI})
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      event_password = EXCLUDED.event_password
  `;

  console.log("→ Seed admin...");
  const adminHash = await bcrypt.hash(adminPassword, 10);
  for (const a of ADMINS) {
    await sql`
      INSERT INTO users (email, name, area, role, password_hash)
      VALUES (${a.email}, ${a.name}, NULL, 'admin', ${adminHash})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = 'admin',
        password_hash = ${adminHash}
    `;
  }

  console.log("→ Seed salesman...");
  for (const s of SALES) {
    await sql`
      INSERT INTO users (email, name, area, role, password_hash)
      VALUES (${s.email}, ${s.name}, ${s.area}, 'sales', NULL)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        area = EXCLUDED.area,
        role = 'sales'
    `;
  }

  const counts = await sql`SELECT role, count(*)::int as n FROM users GROUP BY role`;
  console.log("✓ Selesai. Ringkasan users:", JSON.stringify(counts));
  console.log("Password admin dan acara dibaca dari environment.");
}

main().catch((e) => {
  console.error("SEED GAGAL:", e);
  process.exit(1);
});
