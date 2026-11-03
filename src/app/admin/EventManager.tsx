"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TIMEZONES } from "@/lib/event-input";
import type { ManagedEvent } from "@/lib/managed-events";

export function EventManager({
  onCreated,
}: {
  onCreated: (code: string) => void;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [password, setPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [emails, setEmails] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const selected = events.find((event) => event.code === selectedCode);

  useEffect(() => {
    setPasswordDraft(selected?.access_password ?? "");
    setShowPassword(false);
  }, [selected?.code, selected?.access_password]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/events", { cache: "no-store" });
    if (!res.ok)
      throw new Error(
        "Gagal memuat event. Coba buka kembali pengelolaan event.",
      );
    const data = await res.json();
    setEvents(data.events);
    setSelectedCode((code) => code || data.events[0]?.code || "");
  }, []);

  useEffect(() => {
    load()
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          starts_at: startsAt,
          timezone,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat event.");
      setEvents((current) => [data.event, ...current]);
      setSelectedCode(data.event.code);
      setEmails("");
      setShowPassword(false);
      setName("");
      setAddress("");
      setStartsAt("");
      setPassword("");
      setShowCreatePassword(false);
      setInfo(
        "Event berhasil dibuat. Tambahkan email user ke whitelist, lalu bagikan password acara.",
      );
      onCreated(data.event.code);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal membuat event.");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/events/${selected.code}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordDraft }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? "Gagal menyimpan password acara.");
      await load();
      setShowPassword(false);
      setInfo(
        "Password acara berhasil disimpan. Jika password berubah, user perlu masuk kembali dengan password baru.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan password acara.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function changeWhitelist(removeEmail?: string) {
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const list = removeEmail
        ? [removeEmail]
        : emails.split(/[\s,;]+/).filter(Boolean);
      const res = await fetch(`/api/admin/events/${selected.code}/whitelist`, {
        method: removeEmail ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: list }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan whitelist.");
      await load();
      setEmails("");
      setInfo(
        removeEmail
          ? "Email dihapus dari whitelist. Akses event untuk user ini dihentikan."
          : "Email berhasil ditambahkan. User dapat masuk menggunakan password acara ini.",
      );
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal menyimpan whitelist.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="event-manager-title"
      className="bg-white rounded-2xl border border-ink-100 shadow-card p-5 space-y-5"
    >
      <div>
        <h2 id="event-manager-title" className="font-bold text-ink-900">
          Kelola Event &amp; Akses User
        </h2>
        <p className="text-xs text-ink-500 mt-1">
          Buat event baru, lalu tentukan email user yang boleh mengisi buku
          tamunya. Akses event NFH, FHI, dan Bali tetap seperti semula.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {info && (
        <p
          role="status"
          className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {info}
        </p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={create} className="space-y-4 min-w-0">
          <h3 className="font-semibold text-sm text-brand-800">Tambah Event</h3>
          <div>
            <label htmlFor="event-title" className="label">
              Judul Event
            </label>
            <input
              id="event-title"
              className="input"
              required
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Gastro Open House"
            />
          </div>
          <div>
            <label htmlFor="event-address" className="label">
              Alamat Event
            </label>
            <textarea
              id="event-address"
              className="input"
              required
              maxLength={500}
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Lokasi dan alamat lengkap"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-3">
            <div className="min-w-0">
              <label htmlFor="event-start" className="label">
                Tanggal &amp; Waktu
              </label>
              <input
                id="event-start"
                type="datetime-local"
                className="input min-w-0"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="event-timezone" className="label">
                Zona Waktu
              </label>
              <select
                id="event-timezone"
                className="input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {Object.entries(EVENT_TIMEZONES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="event-create-password" className="label">
              Password Akses Event
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="event-create-password"
                className="input min-w-0"
                type={showCreatePassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                disabled={busy}
                aria-describedby="event-create-password-hint"
              />
              <button
                type="button"
                className="btn-secondary text-xs shrink-0"
                onClick={() => setShowCreatePassword((value) => !value)}
              >
                {showCreatePassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <p
              id="event-create-password-hint"
              className="text-xs text-ink-500 mt-2"
            >
              Tentukan password sendiri, 8–128 karakter dan berbeda dari event
              lain. User masuk dengan email whitelist dan password ini.
            </p>
          </div>
          <button
            type="submit"
            className="btn-primary w-full sm:w-auto"
            disabled={busy}
          >
            {busy ? "Menyimpan…" : "Simpan Event"}
          </button>
        </form>

        <div className="space-y-4 min-w-0 border-t lg:border-t-0 lg:border-l border-ink-100 pt-5 lg:pt-0 lg:pl-6">
          <h3 className="font-semibold text-sm text-brand-800">
            Whitelist per Event Baru
          </h3>
          {loading ? (
            <p className="text-sm text-ink-500">Memuat event…</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-ink-500 rounded-xl bg-ink-50 p-4">
              Belum ada event baru. Isi form di samping untuk membuat event
              pertama.
            </p>
          ) : (
            <>
              <div>
                <label htmlFor="managed-event" className="label">
                  Event yang Dikelola
                </label>
                <select
                  id="managed-event"
                  className="input"
                  value={selectedCode}
                  disabled={busy}
                  onChange={(e) => {
                    setSelectedCode(e.target.value);
                    setShowPassword(false);
                    setEmails("");
                    setInfo(null);
                    setError(null);
                  }}
                >
                  {events.map((event) => (
                    <option key={event.code} value={event.code}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
              {selected && (
                <>
                  <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 space-y-2 text-sm">
                    <p className="font-semibold text-brand-800 break-words">
                      {selected.name}
                    </p>
                    <p className="text-ink-600 break-words whitespace-pre-wrap">
                      {selected.address}
                    </p>
                    <p className="text-ink-600">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "long",
                        timeStyle: "short",
                        timeZone: selected.timezone,
                      }).format(new Date(selected.starts_at))}{" "}
                      {
                        EVENT_TIMEZONES[
                          selected.timezone as keyof typeof EVENT_TIMEZONES
                        ]?.label
                      }
                    </p>
                    <form
                      onSubmit={savePassword}
                      className="border-t border-brand-100 pt-3 space-y-2"
                    >
                      <label htmlFor="event-access-password" className="label">
                        Password Acara
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="event-access-password"
                          className="input font-mono min-w-0"
                          type={showPassword ? "text" : "password"}
                          value={passwordDraft}
                          onChange={(e) => setPasswordDraft(e.target.value)}
                          required
                          minLength={8}
                          maxLength={128}
                          disabled={busy}
                          autoComplete="new-password"
                          aria-describedby="event-password-hint"
                        />
                        <button
                          type="button"
                          className="btn-secondary text-xs shrink-0"
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? "Sembunyikan" : "Tampilkan"}
                        </button>
                      </div>
                      <p
                        id="event-password-hint"
                        className="text-xs text-ink-500"
                      >
                        Ubah password lalu simpan. Gunakan 8–128 karakter,
                        berbeda dari event lain. User perlu masuk kembali jika
                        password berubah. Whitelist dan data tamu tetap
                        tersimpan.
                      </p>
                      <button
                        type="submit"
                        className="btn-brand w-full sm:w-auto"
                        disabled={
                          busy || passwordDraft === selected.access_password
                        }
                      >
                        {busy ? "Menyimpan…" : "Simpan Password"}
                      </button>
                    </form>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void changeWhitelist();
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label htmlFor="whitelist-emails" className="label">
                        Email User
                      </label>
                      <textarea
                        id="whitelist-emails"
                        className="input"
                        rows={3}
                        required
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                        placeholder="user@gastro.co.id"
                      />
                      <p className="text-xs text-ink-500 mt-1">
                        Satu email per baris atau pisahkan dengan koma. Maksimal
                        100 email sekali simpan.
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="btn-brand w-full sm:w-auto"
                      disabled={busy}
                    >
                      Tambahkan ke Whitelist
                    </button>
                  </form>
                  <div>
                    <p className="text-xs font-semibold text-ink-700 mb-2">
                      User yang Diizinkan ({selected.whitelist.length})
                    </p>
                    {selected.whitelist.length === 0 ? (
                      <p className="text-xs text-ink-500">
                        Belum ada email. User belum dapat masuk ke event ini.
                      </p>
                    ) : (
                      <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {selected.whitelist.map((email) => (
                          <li
                            key={email}
                            className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 p-2.5"
                          >
                            <span className="text-xs text-ink-700 break-all">
                              {email}
                            </span>
                            <button
                              type="button"
                              disabled={busy}
                              className="text-xs font-semibold text-red-600 hover:underline shrink-0 disabled:opacity-50"
                              aria-label={`Hapus ${email} dari whitelist`}
                              onClick={() => void changeWhitelist(email)}
                            >
                              Hapus
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
