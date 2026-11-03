import { NextResponse } from "next/server";
import { verifyLogin, saveSession } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi." },
      { status: 400 },
    );
  }

  const result = await verifyLogin(email, password);
  if (!result.ok || !result.user) {
    return NextResponse.json(
      { error: result.error ?? "Login gagal." },
      { status: 401 },
    );
  }

  await saveSession({
    userId: result.user.id,
    role: result.user.role,
    name: result.user.name,
    email: result.user.email,
    area: result.user.area,
    eventCode: result.eventCode, // undefined untuk admin
    eventPasswordHash: result.eventPasswordHash,
  });

  return NextResponse.json({
    ok: true,
    role: result.user.role,
    redirectTo: result.user.role === "admin" ? "/admin" : "/dashboard",
  });
}
