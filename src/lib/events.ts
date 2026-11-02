import { sql, type EventRow } from "./db";
import { getEventPasswords } from "./passwords";

/**
 * Acara (events). Password yang diketik salesman saat login menentukan acara.
 * Mapping password -> event_code dilakukan di sini, data event sendiri di DB.
 */

/** Cek apakah password yang diketik adalah password acara. Return code atau null. */
export function resolveEventCode(password: string): string | null {
  return Object.entries(getEventPasswords()).find(([, value]) => value === password)?.[0] ?? null;
}

/** Ambil nama tampil event dari DB. */
export async function getEventName(code: string): Promise<string> {
  const rows = await sql`SELECT name FROM events WHERE code = ${code}`;
  if (rows.length === 0) return code;
  return (rows[0] as { name: string }).name;
}

/** Ambil semua event (untuk dropdown admin). */
export async function getAllEvents(): Promise<EventRow[]> {
  return (await sql`SELECT code, name, event_password FROM events ORDER BY code`) as EventRow[];
}
