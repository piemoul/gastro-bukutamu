import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { sql, type ClientRow } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  if (!session.eventCode) redirect("/login");

  const eventName = (
    await sql`SELECT name FROM events WHERE code = ${session.eventCode}`
  )[0]?.name ?? session.eventCode;

  const clients = (await sql`
    SELECT id, user_id, event_code, client_name, company_name, email, phone,
           product_interest, notes, created_at, updated_at
    FROM clients
    WHERE user_id = ${session.userId} AND event_code = ${session.eventCode}
    ORDER BY created_at DESC
  `) as ClientRow[];

  return (
    <DashboardClient
      session={{
        name: session.name ?? "",
        area: session.area ?? null,
        eventCode: session.eventCode!,
        eventName,
      }}
      initialClients={clients}
    />
  );
}
