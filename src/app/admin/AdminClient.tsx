"use client";
import { useState, useEffect, useCallback } from "react";
import type { ClientRow, UserRow } from "@/lib/db";
import type { EventOption } from "@/lib/managed-events";
import { EventManager } from "./EventManager";
import { WorkspaceShell, WorkspaceIcon } from "@/components/WorkspaceShell";
import { EventName } from "@/components/EventName";
import { Pagination } from "@/components/Pagination";

interface Props {
  adminName: string;
  salesmen: Pick<UserRow, "id" | "name" | "area" | "email">[];
  events: EventOption[];
}

const EVENT_LABELS = {
  ALL: "Semua",
  NFH: "NFH",
  FHI: "FHI",
  BALI: "Gastro day Bali - Morreti X-perience",
} as const;

type EventFilter = string;

interface ApiResponse {
  event: string;
  salesmen: Pick<UserRow, "id" | "name" | "area" | "email">[];
  clients: (ClientRow & { salesman_name?: string; salesman_area?: string })[];
  summary: Record<string, number>;
  total: number;
}

export function AdminClient({ adminName, salesmen, events }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showEventManager, setShowEventManager] = useState(false);
  const eventLabels: Record<string, string> = {
    ...Object.fromEntries(events.map((item) => [item.code, item.name])),
    ...EVENT_LABELS,
  };
  const [event, setEvent] = useState<EventFilter>("ALL");
  const [salesmanId, setSalesmanId] = useState<string>("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ event, scope: "all" });
      if (salesmanId) params.set("salesman", salesmanId);
      const res = await fetch(`/api/admin/clients?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Gagal memuat data.");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, [event, salesmanId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [event, salesmanId, search, pageSize]);

  const exportHref = `/api/export?scope=all&event=${event}`;

  const matchingClients = (data?.clients ?? []).filter(
    (c) =>
      !search.trim() ||
      [
        c.client_name,
        c.company_name,
        c.email,
        c.phone,
        c.product_interest,
        c.notes,
        c.salesman_name,
      ].some((value) =>
        value?.toLowerCase().includes(search.trim().toLowerCase()),
      ),
  );
  const pages = Math.max(1, Math.ceil(matchingClients.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visibleClients = matchingClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  return (
    <WorkspaceShell
      name={adminName}
      role="admin"
      active={showEventManager ? "events" : "guests"}
      onNavigate={(view) => setShowEventManager(view === "events")}
      exportHref={exportHref}
    >
      <div className="workspace-page-heading">
        <div>
          <p className="workspace-eyebrow">GASTRO · BUKU TAMU</p>
          <h1>
            {showEventManager ? "Event & Akses User" : "Ringkasan Data Tamu"}
          </h1>
          <p>
            {showEventManager
              ? "Siapkan acara dan atur siapa yang dapat mengisi buku tamu."
              : "Pantau pengunjung dan prospek dari seluruh acara Gastro."}
          </p>
        </div>
        {!showEventManager && (
          <a href={exportHref} className="btn-primary">
            <WorkspaceIcon name="export" size={16} />
            Download XLSX Gabungan
          </a>
        )}
      </div>
      {!showEventManager && (
        <div className="workspace-metrics">
          <div className="workspace-metric">
            <div>
              <span>Total Tamu</span>
              <i className="metric-navy">
                <WorkspaceIcon name="guests" />
              </i>
            </div>
            <strong>{loading ? "—" : (data?.total ?? 0)}</strong>
            <p>Sesuai acara yang dipilih</p>
          </div>
          <div className="workspace-metric">
            <div>
              <span>Sales Aktif</span>
              <i className="metric-green">
                <WorkspaceIcon name="shield" />
              </i>
            </div>
            <strong>
              {loading ? "—" : Object.keys(data?.summary ?? {}).length}
            </strong>
            <p>Sales yang memiliki data tamu</p>
          </div>
          <div className="workspace-metric">
            <div>
              <span>Event Tersedia</span>
              <i className="metric-red">
                <WorkspaceIcon name="events" />
              </i>
            </div>
            <strong>{events.length}</strong>
            <p>Acara lama dan acara tambahan</p>
          </div>
          <div className="workspace-metric">
            <div>
              <span>User Terdaftar</span>
              <i className="metric-navy">
                <WorkspaceIcon name="guests" />
              </i>
            </div>
            <strong>{salesmen.length}</strong>
            <p>Akun sales dan user event</p>
          </div>
        </div>
      )}
      <div className="workspace-stack">
        <div hidden={!showEventManager}>
          <EventManager onCreated={(code) => setEvent(code)} />
        </div>
        <div hidden={showEventManager} className="workspace-stack">
          {/* Filter Section */}
          <section className="bg-white rounded-2xl border border-ink-100 shadow-card p-5 animate-fade-up">
            <div className="flex flex-wrap items-end gap-5">
              <div>
                <label className="label">Pilih Acara / Event</label>
                <div className="inline-flex flex-wrap rounded-xl border border-ink-200 p-1 bg-ink-50 gap-1">
                  {Object.keys(eventLabels).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setEvent(opt);
                        setPage(1);
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        event === opt
                          ? "bg-brand-700 text-white shadow-sm"
                          : "bg-transparent text-ink-500 hover:text-ink-900"
                      }`}
                    >
                      <EventName code={opt} name={eventLabels[opt]} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-w-[240px] flex-1 sm:flex-initial">
                <label className="label" htmlFor="salesman">
                  Filter per Salesman
                </label>
                <div className="relative">
                  <select
                    id="salesman"
                    className="input pr-10 appearance-none bg-no-repeat bg-right"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%235b6473' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
                      backgroundPosition: "right 12px center",
                      backgroundSize: "16px",
                    }}
                    value={salesmanId}
                    onChange={(e) => {
                      setSalesmanId(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Semua salesman</option>
                    {salesmen.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.area ?? "All Area"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Ringkasan per salesman */}
          {data && Object.keys(data.summary).length > 0 && (
            <section className="bg-white rounded-2xl border border-ink-100 shadow-card p-5 animate-fade-up">
              <h2 className="font-bold text-ink-900 mb-4 flex items-center gap-2">
                <span className="p-1 bg-brand-50 text-brand-700 rounded-md">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                  </svg>
                </span>
                <span>Rekap Perolehan Tamu per Salesman</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {Object.entries(data.summary)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => (
                    <button
                      type="button"
                      aria-label={`Lihat tamu ${name}`}
                      onClick={() => {
                        const salesman = salesmen.find(
                          (s) =>
                            s.name === name ||
                            `${s.name} (${s.area ?? s.email})` === name ||
                            `${s.name} (${s.email})` === name,
                        );
                        if (salesman) {
                          setSalesmanId(String(salesman.id));
                          setSearch("");
                          setPage(1);
                          document
                            .getElementById("customer-details")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }
                      }}
                      key={name}
                      className="text-left rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3 hover:border-brand-200 hover:bg-brand-50/10 transition-all"
                    >
                      <p
                        className="text-xs font-semibold text-ink-700 truncate"
                        title={name}
                      >
                        {name}
                      </p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-black text-brand-700 leading-none">
                          {count}
                        </span>
                        <span className="text-[10px] text-ink-300 font-bold uppercase">
                          tamu
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </section>
          )}

          {/* Tabel Utama */}
          <section
            id="customer-details"
            className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden animate-fade-up"
          >
            <div className="p-5 border-b border-ink-100">
              <h2 className="font-bold text-ink-900">
                Daftar Pengunjung Masuk
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Menampilkan {data?.clients.length ?? 0} data untuk event{" "}
                <span className="font-bold text-brand-700">
                  {event === "ALL"
                    ? "Semua Acara"
                    : (eventLabels[event] ?? event)}
                </span>
                {salesmanId ? ` yang diinput oleh Salesman terpilih` : ""}.
              </p>
            </div>

            <div className="workspace-table-toolbar">
              <label htmlFor="guest-search" className="sr-only">
                Cari pengunjung
              </label>
              <input
                id="guest-search"
                type="search"
                className="input"
                placeholder="Cari nama, perusahaan, kontak, atau produk…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <span>{matchingClients.length} tamu</span>
            </div>
            {error ? (
              <div className="p-6 text-sm text-red-600 bg-red-50">{error}</div>
            ) : loading ? (
              <div className="p-16 text-center text-sm text-ink-500 flex flex-col items-center justify-center gap-2">
                <svg
                  className="animate-spin h-6 w-6 text-brand-700"
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
                <span>Memuat data tamu…</span>
              </div>
            ) : !data || matchingClients.length === 0 ? (
              <div className="p-16 text-center text-sm text-ink-400">
                {search.trim()
                  ? "Pengunjung tidak ditemukan. Coba kata pencarian lain."
                  : "Belum ada data tamu terdaftar untuk filter ini."}
              </div>
            ) : (
              <div className="overflow-x-auto workspace-table-scroll">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-ink-500 text-[11px] font-bold uppercase tracking-wider border-b border-ink-100">
                    <tr>
                      <th className="text-left px-5 py-3.5">Salesman / Area</th>
                      <th className="text-left px-5 py-3.5">Event</th>
                      <th className="text-left px-5 py-3.5">Nama Klien</th>
                      <th className="text-left px-5 py-3.5">Perusahaan</th>
                      <th className="text-left px-5 py-3.5">Kontak</th>
                      <th className="text-left px-5 py-3.5">
                        Peminatan Produk
                      </th>
                      <th className="text-left px-5 py-3.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50">
                    {visibleClients.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-brand-50/20 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold text-ink-900 block">
                            {c.salesman_name ?? "—"}
                          </span>
                          <span className="text-[10px] text-ink-500 uppercase block font-medium tracking-wide mt-0.5">
                            {c.salesman_area ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-lg bg-brand-100 text-brand-800 text-[10px] font-bold px-2 py-0.5 border border-brand-200/50 uppercase">
                            <EventName
                              code={c.event_code}
                              name={eventLabels[c.event_code] ?? c.event_code}
                            />
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-ink-900">
                          {c.client_name}
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
                            className="inline-block bg-brand-50 border border-brand-100/50 text-brand-700 text-xs px-2.5 py-1 rounded-lg font-medium max-w-[200px] truncate"
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && (
              <Pagination
                total={matchingClients.length}
                page={currentPage}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
