import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { sql, type UserRow } from "@/lib/db";
import { AdminClient } from "./AdminClient";
import { getEventOptions } from "@/lib/managed-events";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const salesmen = (await sql`
    SELECT id, name, area, email FROM users WHERE role = 'sales' ORDER BY name
  `) as Pick<UserRow, "id" | "name" | "area" | "email">[];

  return <AdminClient adminName={session.name ?? "Admin"} salesmen={salesmen} events={await getEventOptions()} />;
}
