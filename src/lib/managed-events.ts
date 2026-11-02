import { createHash, randomBytes } from "node:crypto";
import { sql } from "./db";
import {
  parseEventInput,
  parseWhitelistEmails,
  EventInputError,
} from "./event-input";

export interface EventOption {
  code: string;
  name: string;
}
export interface ManagedEvent extends EventOption {
  address: string;
  starts_at: string;
  timezone: string;
  access_password: string;
  whitelist: string[];
}

export function isManagedEventCode(code?: string) {
  return code?.startsWith("EVT_") ?? false;
}
const digest = (password: string) =>
  createHash("sha256").update(password).digest("hex");

export async function getEventOptions(): Promise<EventOption[]> {
  return (await sql`SELECT code, name FROM events ORDER BY code`) as EventOption[];
}

/** Admin-only callers: includes the password needed to distribute event access. */
export async function listManagedEvents(): Promise<ManagedEvent[]> {
  return (await sql`
    SELECT e.code, e.name, e.event_password AS access_password, m.address,
           m.starts_at, m.timezone,
           COALESCE((SELECT json_agg(w.email ORDER BY w.email) FROM event_whitelist w
                     WHERE w.event_code = e.code), '[]'::json) AS whitelist
    FROM events e JOIN managed_events m ON m.event_code = e.code
    ORDER BY m.created_at DESC, e.code
  `) as ManagedEvent[];
}

export async function createManagedEvent(body: unknown, adminId: number) {
  const input = parseEventInput(body);
  const code = "EVT_" + randomBytes(12).toString("hex").toUpperCase();
  const password = "GT-" + randomBytes(12).toString("base64url");
  await sql.transaction([
    sql`INSERT INTO events (code, name, event_password) VALUES (${code}, ${input.name}, ${password})`,
    sql`INSERT INTO managed_events (event_code, address, starts_at, timezone, password_hash, created_by)
        VALUES (${code}, ${input.address}, ${input.startsAt}, ${input.timezone}, ${digest(password)}, ${adminId})`,
  ]);
  return {
    code,
    name: input.name,
    address: input.address,
    starts_at: input.startsAt,
    timezone: input.timezone,
    access_password: password,
    whitelist: [],
  } satisfies ManagedEvent;
}

export async function hasManagedEvent(code: string) {
  return (
    (
      await sql`SELECT event_code FROM managed_events WHERE event_code = ${code}`
    ).length > 0
  );
}

export async function addWhitelist(code: string, body: unknown) {
  const emails = parseWhitelistEmails(body);
  const admins =
    await sql`SELECT id FROM users WHERE lower(email) = ANY(${emails}) AND role = 'admin'`;
  if (admins.length)
    throw new EventInputError(
      "Email akun admin tidak dapat ditambahkan sebagai user event.",
    );
  const queries = emails.flatMap((email) => [
    sql`WITH added AS (INSERT INTO users (email, name, area, role, password_hash)
        SELECT ${email}, ${email.split("@")[0]}, NULL, 'sales', NULL
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = ${email})
        ON CONFLICT (email) DO NOTHING RETURNING id)
        INSERT INTO managed_event_users (user_id) SELECT id FROM added ON CONFLICT DO NOTHING`,
    sql`INSERT INTO event_whitelist (event_code, email) VALUES (${code}, ${email}) ON CONFLICT DO NOTHING`,
  ]);
  await sql.transaction(queries);
}

export async function removeWhitelist(code: string, body: unknown) {
  const emails = parseWhitelistEmails(body);
  await sql`DELETE FROM event_whitelist WHERE event_code = ${code} AND email = ANY(${emails})`;
}

export async function resolveManagedEvent(
  email: string,
  password: string,
): Promise<string | null> {
  const rows = await sql`
    SELECT m.event_code FROM managed_events m JOIN event_whitelist w ON w.event_code = m.event_code
    WHERE m.password_hash = ${digest(password)} AND w.email = ${email.trim().toLowerCase()}
  `;
  return (rows[0]?.event_code as string | undefined) ?? null;
}

export async function canUseManagedEvent(userId: number, code: string) {
  const rows = await sql`
    SELECT 1 FROM event_whitelist w JOIN users u ON lower(u.email) = w.email
    WHERE u.id = ${userId} AND w.event_code = ${code} AND u.role = 'sales'
  `;
  return rows.length > 0;
}

export async function isManagedOnlyUser(userId: number) {
  return (
    (
      await sql`SELECT user_id FROM managed_event_users WHERE user_id = ${userId}`
    ).length > 0
  );
}
