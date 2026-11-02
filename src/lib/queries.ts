import { sql, type ClientRow } from "./db";

/**
 * Ambil semua klien untuk event tertentu, beserta nama salesman.
 * Jika event = "ALL", ambil semua acara.
 */
export async function fetchClientsForExport(
  event: string
): Promise<ClientRow[]> {
  if (event === "ALL") {
    return (await sql`
      SELECT c.*, u.name AS salesman_name, u.area AS salesman_area, u.email AS salesman_email
      FROM clients c JOIN users u ON u.id = c.user_id
      ORDER BY u.name, c.event_code, c.created_at DESC
    `) as unknown as ClientRow[];
  }
  return (await sql`
    SELECT c.*, u.name AS salesman_name, u.area AS salesman_area, u.email AS salesman_email
    FROM clients c JOIN users u ON u.id = c.user_id
    WHERE c.event_code = ${event}
    ORDER BY u.name, c.created_at DESC
  `) as unknown as ClientRow[];
}

/** Nama tampil acara (dari code). */
export async function fetchEventName(code: string): Promise<string> {
  if (code === "ALL") return "Semua Acara";
  const rows = await sql`SELECT name FROM events WHERE code = ${code}`;
  return rows.length ? (rows[0] as { name: string }).name : code;
}

/** Ambil klien milik satu salesman untuk satu event. */
export async function fetchClientsForSalesman(
  userId: number,
  event: string
): Promise<ClientRow[]> {
  return (await sql`
    SELECT * FROM clients
    WHERE user_id = ${userId} AND event_code = ${event}
    ORDER BY created_at DESC
  `) as unknown as ClientRow[];
}

// Catatan: fetchClientsForExport memakai SELECT c.* sehingga notes otomatis
// terbawa setelah kolom ditambahkan ke tabel.
