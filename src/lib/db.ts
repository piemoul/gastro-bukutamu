import { neon, neonConfig } from "@neondatabase/serverless";

/**
 * Neon serverless driver. In dev & on Vercel, DATABASE_URL points to the
 * Neon connection string. Queries return rows as plain JS objects.
 *
 * Usage:
 *   import { sql } from "@/lib/db";
 *   const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env (dev) or Vercel env vars (prod).");
}

// Optional HTTP endpoint for the isolated local Postgres test environment.
// Leave unset when using Neon; its normal HTTPS transport is unchanged.
if (process.env.NEON_FETCH_ENDPOINT) neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT;
export const sql = neon(connectionString);

// ---------- Types ----------
export type Role = "sales" | "admin";

export interface UserRow {
  id: number;
  email: string;
  name: string;
  area: string | null;
  password_hash: string | null;
  role: Role;
}

export interface EventRow {
  code: string;
  name: string;
  event_password: string;
}

export interface ClientRow {
  id: number;
  user_id: number;
  event_code: string;
  client_name: string;
  company_name: string;
  email: string;
  phone: string;
  product_interest: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined fields (optional)
  salesman_name?: string;
  salesman_area?: string;
  salesman_email?: string;
}
