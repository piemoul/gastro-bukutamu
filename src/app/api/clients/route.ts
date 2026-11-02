import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql, type ClientRow } from "@/lib/db";

/** GET /api/clients — sales: daftar klien sendiri untuk acara aktif. */
export async function GET() {
  const session = await getSession();
  if (!session.userId || session.role !== "sales" || !session.eventCode) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const rows = (await sql`
    SELECT id, user_id, event_code, client_name, company_name, email, phone,
           product_interest, notes, created_at, updated_at
    FROM clients
    WHERE user_id = ${session.userId} AND event_code = ${session.eventCode}
    ORDER BY created_at DESC
  `) as ClientRow[];
  return NextResponse.json({ clients: rows });
}

/** POST /api/clients — sales: tambah klien. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId || session.role !== "sales" || !session.eventCode) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const client_name = (body.client_name ?? "").trim();
  const company_name = (body.company_name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const product_interest = (body.product_interest ?? "").trim();
  const notes = (body.notes ?? "").trim();

  if (!client_name || !company_name || !product_interest) {
    return NextResponse.json(
      { error: "Nama klien, nama PT, dan barang yang diminati wajib diisi." },
      { status: 400 }
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Format alamat email tidak valid." }, { status: 400 });
  }

  const inserted = (await sql`
    INSERT INTO clients (user_id, event_code, client_name, company_name, email, phone, product_interest, notes)
    VALUES (${session.userId}, ${session.eventCode}, ${client_name}, ${company_name}, ${email}, ${phone}, ${product_interest}, ${notes || null})
    RETURNING id, user_id, event_code, client_name, company_name, email, phone, product_interest, notes, created_at, updated_at
  `) as ClientRow[];

  return NextResponse.json({ client: inserted[0] }, { status: 201 });
}
