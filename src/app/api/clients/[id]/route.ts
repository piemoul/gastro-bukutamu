import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql, type ClientRow } from "@/lib/db";
import { isManagedEventCode } from "@/lib/managed-events";

type Ctx = { params: { id: string } };

/** PUT /api/clients/[id] — pemilik mengedit. */
export async function PUT(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId || session.role !== "sales") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
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

  const updated = (await sql`
    UPDATE clients
    SET client_name = ${client_name},
        company_name = ${company_name},
        email = ${email},
        phone = ${phone},
        product_interest = ${product_interest},
        notes = ${notes || null},
        updated_at = now()
    WHERE id = ${id} AND user_id = ${session.userId}
      AND (event_code = ${session.eventCode ?? ""} OR (${!isManagedEventCode(session.eventCode)} AND left(event_code, 4) <> 'EVT_'))
    RETURNING id, user_id, event_code, client_name, company_name, email, phone, product_interest, notes, created_at, updated_at
  `) as ClientRow[];

  if (updated.length === 0) {
    return NextResponse.json({ error: "Klien tidak ditemukan atau bukan milik Anda." }, { status: 404 });
  }
  return NextResponse.json({ client: updated[0] });
}

/** DELETE /api/clients/[id] — pemilik hapus. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session.userId || session.role !== "sales") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const deleted = (await sql`
    DELETE FROM clients WHERE id = ${id} AND user_id = ${session.userId}
      AND (event_code = ${session.eventCode ?? ""} OR (${!isManagedEventCode(session.eventCode)} AND left(event_code, 4) <> 'EVT_'))
    RETURNING id
  `) as { id: number }[];

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Klien tidak ditemukan atau bukan milik Anda." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
