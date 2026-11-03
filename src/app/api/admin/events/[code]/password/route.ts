import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  hasManagedEvent,
  updateManagedEventPassword,
} from "@/lib/managed-events";
import { EventInputError } from "@/lib/event-input";

export async function PATCH(
  req: Request,
  { params }: { params: { code: string } },
) {
  const session = await getSession();
  if (!session.userId || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!(await hasManagedEvent(params.code))) {
    return NextResponse.json(
      { error: "Event tidak ditemukan." },
      { status: 404 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }
  try {
    if (!(await updateManagedEventPassword(params.code, body))) {
      return NextResponse.json(
        { error: "Event tidak ditemukan." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof EventInputError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    throw error;
  }
}
