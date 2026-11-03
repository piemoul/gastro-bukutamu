import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { sql, type UserRow } from "./db";
import { resolveEventCode } from "./events";
import {
  canUseManagedEvent,
  isManagedEventCode,
  isManagedOnlyUser,
  resolveManagedEvent,
  eventPasswordFingerprint,
} from "./managed-events";

export interface AppSession {
  userId?: number;
  role?: "sales" | "admin";
  name?: string;
  email?: string;
  area?: string | null;
  eventCode?: string; // acara aktif (untuk sales). Admin tidak punya.
  eventPasswordHash?: string; // Invalidate new-event sessions after a password change.
}

const SESSION_NAME = "gastro_session";

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters. Set it in .env / Vercel env.",
    );
  }
  return {
    password,
    cookieName: SESSION_NAME,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 jam
    },
  };
}

export async function getSession(): Promise<AppSession> {
  "use server";
  const c = await cookies();
  const session = await getIronSession<AppSession>(c, sessionOptions());
  if (
    session.role === "sales" &&
    session.userId &&
    isManagedEventCode(session.eventCode) &&
    !(await canUseManagedEvent(
      session.userId,
      session.eventCode!,
      session.eventPasswordHash,
    ))
  )
    return {};
  return session;
}

export async function saveSession(session: AppSession): Promise<void> {
  "use server";
  const c = await cookies();
  const s = await getIronSession<AppSession>(c, sessionOptions());
  Object.assign(s, session);
  await s.save();
}

export async function destroySession(): Promise<void> {
  "use server";
  const c = await cookies();
  const s = await getIronSession<AppSession>(c, sessionOptions());
  s.destroy();
}

// ---------- Verifikasi login ----------
import bcrypt from "bcryptjs";

/**
 * Verifikasi kredensial login.
 * - Admin: cek password vs password_hash di DB.
 * - Sales: password harus = password acara (nfh@... / fhi@... / bali@...). Return code acara.
 *
 * Return: { ok, user, eventCode?, error? }
 */
export async function verifyLogin(
  email: string,
  password: string,
): Promise<{
  ok: boolean;
  user?: UserRow;
  eventCode?: string;
  eventPasswordHash?: string;
  error?: string;
}> {
  const rows =
    (await sql`SELECT * FROM users WHERE lower(email) = lower(${email})`) as UserRow[];
  if (rows.length === 0)
    return { ok: false, error: "Email atau password salah." };
  const user = rows[0];

  if (user.role === "admin") {
    if (!user.password_hash)
      return { ok: false, error: "Akun admin belum punya password." };
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return { ok: false, error: "Email atau password salah." };
    return { ok: true, user };
  }

  // sales: password = password acara
  const legacyCode = resolveEventCode(password);
  if (legacyCode && (await isManagedOnlyUser(user.id)))
    return { ok: false, error: "Email atau password acara salah." };
  const eventCode = legacyCode ?? (await resolveManagedEvent(email, password));
  if (!eventCode) return { ok: false, error: "Password acara salah." };
  return {
    ok: true,
    user,
    eventCode,
    eventPasswordHash: isManagedEventCode(eventCode)
      ? eventPasswordFingerprint(password)
      : undefined,
  };
}
