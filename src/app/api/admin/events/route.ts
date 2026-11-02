import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createManagedEvent, listManagedEvents } from "@/lib/managed-events";
import { EventInputError } from "@/lib/event-input";

export async function GET() {
  const session = await getSession();
  if (!session.userId || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json(
    { events: await listManagedEvents() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }
  try {
    return NextResponse.json(
      { event: await createManagedEvent(body, session.userId) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof EventInputError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
