import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchClientsForExport, fetchClientsForSalesman, fetchEventName } from "@/lib/queries";
import { buildMultiSalesmanXlsx, buildSalesmanXlsx } from "@/lib/xlsx";
import type { ClientRow } from "@/lib/db";
import { sql } from "@/lib/db";

function filename(header: string): string {
  const d = new Date().toISOString().slice(0, 10);
  return `${header}-${d}.xlsx`;
}

/**
 * GET /api/export?scope=all&event=NFH       → admin: multi-tab (1 tab/salesman)
 * GET /api/export?scope=mine&event=NFH      → sales: 1 tab sendiri
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "mine";
  let event = (searchParams.get("event") ?? "").toUpperCase();

  // ---------- scope=mine (sales) ----------
  if (scope === "mine") {
    if (session.role !== "sales" || !session.eventCode) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const eventName = await fetchEventName(session.eventCode);
    const rows = await fetchClientsForSalesman(session.userId, session.eventCode);
    const buf = await buildSalesmanXlsx(session.name ?? "Salesman", eventName, rows);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename(`buku-tamu-${session.name}`)}"`,
      },
    });
  }

  // ---------- scope=all (admin) ----------
  if (scope === "all") {
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Khusus admin." }, { status: 403 });
    }
    if (event !== "ALL" && !(await sql`SELECT code FROM events WHERE code = ${event}`).length) {
      return NextResponse.json({ error: "Event tidak valid." }, { status: 400 });
    }

    const all = await fetchClientsForExport(event);
    const eventName = await fetchEventName(event);

    // Kelompokkan berdasarkan ID agar akun dengan nama sama tetap terpisah.
    // Karena satu salesman bisa ada di beberapa
    // acara saat event=ALL, tab bisa berisi campuran; tetap masuk ke 1 tab.
    const groupsMap = new Map<number, { salesmanName: string; eventName: string; rows: ClientRow[] }>();
    for (const c of all) {
      const name = c.salesman_name ?? "Tanpa Nama";
      if (!groupsMap.has(c.user_id)) {
        groupsMap.set(c.user_id, { salesmanName: name, eventName, rows: [] });
      }
      groupsMap.get(c.user_id)!.rows.push(c);
    }
    const groups = Array.from(groupsMap.values());
    const buf = await buildMultiSalesmanXlsx(groups);

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename(`buku-tamu-${event}`)}"`,
      },
    });
  }

  return NextResponse.json({ error: "Scope tidak valid." }, { status: 400 });
}
