import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql, type ClientRow, type UserRow } from "@/lib/db";

/** GET /api/admin/clients?event=NFH|FHI|BALI|ALL&salesman=<userId>
 *  Admin only. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const event = (searchParams.get("event") ?? "ALL").toUpperCase();
  const salesmanId = searchParams.get("salesman"); // user id, optional

  // daftar salesman (untuk dropdown filter)
  const salesmen = (await sql`
    SELECT id, name, area, email FROM users WHERE role = 'sales' ORDER BY name
  `) as Pick<UserRow, "id" | "name" | "area" | "email">[];

  // bangun query clients
  const byEvent = event !== "ALL";
  if (byEvent && !(await sql`SELECT code FROM events WHERE code = ${event}`).length) {
    return NextResponse.json({ error: "Event tidak valid." }, { status: 400 });
  }
  const bySalesman = salesmanId && Number.isInteger(Number(salesmanId));

  type AdminClient = ClientRow & { salesman_name?: string; salesman_area?: string };
  let clients: AdminClient[];
  if (byEvent && bySalesman) {
    clients = (await sql`
      SELECT c.*, u.name AS salesman_name, u.area AS salesman_area
      FROM clients c JOIN users u ON u.id = c.user_id
      WHERE c.event_code = ${event} AND c.user_id = ${Number(salesmanId)}
      ORDER BY u.name, c.created_at DESC
    `) as unknown as AdminClient[];
  } else if (byEvent) {
    clients = (await sql`
      SELECT c.*, u.name AS salesman_name, u.area AS salesman_area
      FROM clients c JOIN users u ON u.id = c.user_id
      WHERE c.event_code = ${event}
      ORDER BY u.name, c.created_at DESC
    `) as unknown as AdminClient[];
  } else if (bySalesman) {
    clients = (await sql`
      SELECT c.*, u.name AS salesman_name, u.area AS salesman_area
      FROM clients c JOIN users u ON u.id = c.user_id
      WHERE c.user_id = ${Number(salesmanId)}
      ORDER BY u.name, c.created_at DESC
    `) as unknown as AdminClient[];
  } else {
    clients = (await sql`
      SELECT c.*, u.name AS salesman_name, u.area AS salesman_area
      FROM clients c JOIN users u ON u.id = c.user_id
      ORDER BY u.name, c.created_at DESC
    `) as unknown as AdminClient[];
  }

  // ringkas per salesman
  const summaryBySalesman: Record<string, number> = {};
  for (const c of clients) {
    const salesman = salesmen.find((s) => s.id === c.user_id);
    const name = c.salesman_name ?? "—";
    const sameName = salesmen.filter((s) => s.name === name);
    const sameArea = sameName.filter((s) => s.area === salesman?.area);
    const key = sameName.length > 1 && salesman
      ? `${name} (${sameArea.length > 1 ? salesman.email : salesman.area ?? salesman.email})`
      : name;
    summaryBySalesman[key] = (summaryBySalesman[key] ?? 0) + 1;
  }

  return NextResponse.json({
    event,
    salesmen,
    clients,
    summary: summaryBySalesman,
    total: clients.length,
  });
}
