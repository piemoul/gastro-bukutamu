export const EVENT_TIMEZONES = {
  "Asia/Jakarta": { label: "WIB", offset: "+07:00" },
  "Asia/Makassar": { label: "WITA", offset: "+08:00" },
  "Asia/Jayapura": { label: "WIT", offset: "+09:00" },
} as const;

export class EventInputError extends Error {}

export function parseEventInput(body: unknown) {
  if (!body || typeof body !== "object")
    throw new EventInputError("Form event tidak valid.");
  const data = body as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const address = typeof data.address === "string" ? data.address.trim() : "";
  const startsAt = typeof data.starts_at === "string" ? data.starts_at : "";
  const timezone = typeof data.timezone === "string" ? data.timezone : "";
  if (!name || name.length > 160)
    throw new EventInputError(
      "Judul event wajib diisi, maksimal 160 karakter.",
    );
  if (!address || address.length > 500)
    throw new EventInputError(
      "Alamat event wajib diisi, maksimal 500 karakter.",
    );
  if (!Object.hasOwn(EVENT_TIMEZONES, timezone))
    throw new EventInputError("Pilih zona waktu WIB, WITA, atau WIT.");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt))
    throw new EventInputError("Tanggal dan waktu event tidak valid.");
  const local = new Date(startsAt + ":00Z");
  if (
    !Number.isFinite(local.getTime()) ||
    local.toISOString().slice(0, 16) !== startsAt
  ) {
    throw new EventInputError("Tanggal dan waktu event tidak valid.");
  }
  const offset =
    EVENT_TIMEZONES[timezone as keyof typeof EVENT_TIMEZONES].offset;
  return {
    name,
    address,
    startsAt: new Date(startsAt + ":00" + offset).toISOString(),
    timezone,
  };
}

export function parseWhitelistEmails(body: unknown): string[] {
  if (!body || typeof body !== "object")
    throw new EventInputError("Daftar email tidak valid.");
  const emails = (body as Record<string, unknown>).emails;
  if (!Array.isArray(emails) || !emails.length || emails.length > 100) {
    throw new EventInputError("Isi 1 hingga 100 email user.");
  }
  const normalized = emails.map((email) =>
    typeof email === "string" ? email.trim().toLowerCase() : "",
  );
  if (
    normalized.some(
      (email) =>
        email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    )
  ) {
    throw new EventInputError(
      "Ada alamat email yang tidak valid. Periksa kembali daftar email.",
    );
  }
  return [...new Set(normalized)];
}
