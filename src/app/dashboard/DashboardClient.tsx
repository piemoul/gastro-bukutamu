"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { EventName } from "@/components/EventName";
import { Pagination } from "@/components/Pagination";
import type { ClientRow } from "@/lib/db";

interface Props {
  session: {
    name: string;
    area: string | null;
    eventCode: string;
    eventName: string;
  };
  initialClients: ClientRow[];
}

type FormState = {
  client_name: string;
  company_name: string;
  email: string;
  phone: string;
  product_interest: string;
  notes: string;
};

const EMPTY: FormState = {
  client_name: "",
  company_name: "",
  email: "",
  phone: "",
  product_interest: "",
  notes: "",
};

const FIELDS: {
  key: keyof FormState;
  label: string;
  type?: string;
  placeholder?: string;
  full?: boolean;
  required?: boolean;
  textarea?: boolean;
}[] = [
  {
    key: "client_name",
    label: "Nama Klien",
    placeholder: "Nama lengkap tamu",
    required: true,
  },
  {
    key: "company_name",
    label: "Nama PT / Perusahaan",
    placeholder: "PT Contoh Jaya",
    required: true,
  },
  {
    key: "email",
    label: "Alamat Email",
    type: "email",
    placeholder: "tamu@perusahaan.com",
  },
  { key: "phone", label: "No HP", placeholder: "0812xxxxxxx" },
  {
    key: "product_interest",
    label: "Barang yang Diminati",
    placeholder: "Mis. Oven rack, Blast chiller, Warewasher",
    full: true,
    required: true,
  },
  {
    key: "notes",
    label: "Notes",
    placeholder: "Catatan tambahan (opsional)",
    full: true,
    textarea: true,
  },
];

export function DashboardClient({ session, initialClients }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [clients, setClients] = useState<ClientRow[]>(initialClients);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const setField = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setError(null);
  };

  const startEdit = (c: ClientRow) => {
    setEditingId(c.id);
    setForm({
      client_name: c.client_name,
      company_name: c.company_name,
      email: c.email,
      phone: c.phone,
      product_interest: c.product_interest,
      notes: c.notes ?? "",
    });
    setError(null);
    setInfo(null);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/clients/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");
        setClients((cs) =>
          cs.map((c) => (c.id === editingId ? data.client : c)),
        );
        setInfo("Perubahan berhasil disimpan.");
        resetForm();
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");
        setClients((cs) => [data.client, ...cs]);
        setPage(1);
        setInfo("Data tamu berhasil ditambahkan.");
        resetForm();
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Hapus data tamu ini?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus.");
      setClients((cs) => cs.filter((c) => c.id !== id));
      if (editingId === id) resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(clients.length / pageSize)),
  );
  const pageClients = clients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <WorkspaceShell
      name={session.name}
      role="sales"
      active="guests"
      exportHref="/api/export?scope=mine"
    >
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">GASTRO · BUKU TAMU</p>
          <h1>Halo, {session.name}!</h1>
          <p>Catat pengunjung dan prospek untuk acara Anda.</p>
        </div>
        <div className="workspace-active-event">
          <span />{" "}
          <EventName code={session.eventCode} name={session.eventName} />
        </div>
      </div>
      <div className="workspace-stack">
        {/* Form Input Section */}
        <section className="bg-white rounded-2xl border border-ink-100 shadow-card border-l-4 border-l-accent p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-accent/10 text-accent rounded-lg">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </span>
              <h2 className="font-bold text-ink-900">
                {editingId ? "Ubah Data Tamu" : "Tambah Tamu Baru"}
              </h2>
            </div>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-xs font-semibold text-ink-500 hover:text-accent transition-colors"
              >
                Batal edit
              </button>
            )}
          </div>

          <form
            onSubmit={submit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {FIELDS.map((f) => (
              <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
                <label className="label" htmlFor={f.key}>
                  {f.label}
                  {!f.required && (
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      (opsional)
                    </span>
                  )}
                </label>
                {f.textarea ? (
                  <textarea
                    id={f.key}
                    className="input min-h-[72px] resize-y"
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                    rows={2}
                  />
                ) : (
                  <input
                    id={f.key}
                    type={f.type ?? "text"}
                    className="input"
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setField(f.key, e.target.value)}
                    required={f.required}
                  />
                )}
              </div>
            ))}
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Menyimpan…</span>
                  </>
                ) : editingId ? (
                  "Simpan Perubahan"
                ) : (
                  "Tambah Tamu"
                )}
              </button>

              {info && (
                <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl font-medium animate-fade-up">
                  {info}
                </span>
              )}
              {error && (
                <span className="text-xs bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 rounded-xl font-medium animate-fade-up">
                  {error}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Guest List Section */}
        <section className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-ink-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-ink-900">Tamu Pendaftaran Saya</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Daftar tamu yang telah Anda masukkan untuk event saat ini.
              </p>
            </div>
            <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-lg">
              {clients.length} Tamu
            </span>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-ink-50 flex items-center justify-center mx-auto mb-3 text-ink-300">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-sm font-medium text-ink-500">
                Belum ada tamu terdaftar
              </p>
              <p className="text-xs text-ink-300 mt-1">
                Masukkan data tamu pameran melalui form di atas.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-ink-500 text-[11px] font-bold uppercase tracking-wider border-b border-ink-100">
                    <tr>
                      <th className="text-left px-5 py-3.5">Nama Klien</th>
                      <th className="text-left px-5 py-3.5">Perusahaan</th>
                      <th className="text-left px-5 py-3.5">Kontak</th>
                      <th className="text-left px-5 py-3.5">
                        Peminatan Produk
                      </th>
                      <th className="text-left px-5 py-3.5">Notes</th>
                      <th className="text-right px-5 py-3.5">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50">
                    {pageClients.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-brand-50/20 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold text-ink-900 block">
                            {c.client_name}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-ink-700 font-medium">
                          {c.company_name}
                        </td>
                        <td className="px-5 py-4 text-ink-500 space-y-0.5 text-xs">
                          <span className="block text-ink-700">
                            {c.phone || "—"}
                          </span>
                          <span className="block font-mono text-[11px]">
                            {c.email || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="inline-block bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-lg font-medium max-w-[240px] truncate"
                            title={c.product_interest}
                          >
                            {c.product_interest}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-ink-600 text-xs max-w-[260px]">
                          {c.notes ? (
                            <span className="whitespace-pre-wrap line-clamp-3">
                              {c.notes}
                            </span>
                          ) : (
                            <span className="text-ink-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEdit(c)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900 mr-4 transition-colors"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polygon points="16 3 21 8 8 21 3 21 3 16 16 3" />
                            </svg>
                            <span>Ubah</span>
                          </button>
                          <button
                            onClick={() => remove(c.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            <span>Hapus</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-ink-100">
                {pageClients.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 space-y-3 hover:bg-brand-50/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-ink-900 text-base">
                          {c.client_name}
                        </h3>
                        <p className="text-xs font-semibold text-ink-700 mt-0.5">
                          {c.company_name}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(c)}
                          className="p-2 text-brand-700 hover:bg-brand-50 rounded-xl transition-all"
                          title="Edit"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="16 3 21 8 8 21 3 21 3 16 16 3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Hapus"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-ink-50/50 p-2.5 rounded-xl border border-ink-100">
                      <div>
                        <span className="text-[10px] text-ink-300 block font-semibold uppercase tracking-wider">
                          No. HP
                        </span>
                        <span className="font-semibold text-ink-700">
                          {c.phone || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-ink-300 block font-semibold uppercase tracking-wider">
                          Email
                        </span>
                        <span className="font-mono text-ink-700 text-[11px] block truncate">
                          {c.email || "—"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-ink-300 block font-semibold uppercase tracking-wider mb-1">
                        Barang Diminati
                      </span>
                      <span className="inline-block bg-brand-100/70 border border-brand-200/50 text-brand-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                        {c.product_interest}
                      </span>
                    </div>

                    {c.notes && (
                      <div>
                        <span className="text-[10px] text-ink-300 block font-semibold uppercase tracking-wider mb-1">
                          Notes
                        </span>
                        <p className="text-xs text-ink-600 whitespace-pre-wrap bg-ink-50/50 border border-ink-100 rounded-lg px-2.5 py-1.5">
                          {c.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          <Pagination
            id="my-guests"
            total={clients.length}
            page={currentPage}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </section>
      </div>
    </WorkspaceShell>
  );
}
