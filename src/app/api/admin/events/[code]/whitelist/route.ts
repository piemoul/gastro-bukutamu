import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addWhitelist,
  removeWhitelist,
  hasManagedEvent,
} from "@/lib/managed-events";
import { EventInputError } from "@/lib/event-input";

type Context = { params: { code: string } };
async function change(req: Request, { params }: Context, remove: boolean) {
  const session = await getSession();
  if (!session.userId || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!(await hasManagedEvent(params.code)))
    return NextResponse.json(
      { error: "Event tidak ditemukan." },
      { status: 404 },
    );
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }
  try {
    if (remove) await removeWhitelist(params.code, body);
    else await addWhitelist(params.code, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EventInputError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
export async function POST(req: Request, context: Context) {
  return change(req, context, false);
}
export async function DELETE(req: Request, context: Context) {
  return change(req, context, true);
}
