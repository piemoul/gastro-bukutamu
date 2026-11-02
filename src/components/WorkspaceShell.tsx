"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function WorkspaceIcon({
  name,
  size = 18,
}: {
  name: "guests" | "events" | "export" | "menu" | "close" | "logout" | "shield";
  size?: number;
}) {
  const paths = {
    guests: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
    events: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2" />
      </>
    ),
    export: (
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M12 3v12m-5-5 5 5 5-5" />
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    logout: (
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    ),
    shield: (
      <>
        <path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z" />
        <path d="m8 12 3 3 5-5" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function WorkspaceShell({
  name,
  role,
  active,
  onNavigate,
  exportHref,
  children,
}: {
  name: string;
  role: "admin" | "sales";
  active: "guests" | "events";
  onNavigate?: (view: "guests" | "events") => void;
  exportHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const label =
    active === "events"
      ? "Event & Akses User"
      : role === "admin"
        ? "Ringkasan Data Tamu"
        : "Buku Tamu Saya";
  useEffect(() => {
    if (!drawer) {
      dialog.current?.close();
      return;
    }
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [drawer]);
  async function logout() {
    setLeaving(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout gagal");
      router.push("/login");
      router.refresh();
    } catch {
      setLeaving(false);
    }
  }
  const navigation = (
    <>
      <div className="workspace-company">
        <span className="workspace-eyebrow">RUANG KERJA</span>
        <div>
          <span className="company-mark">GG</span>
          <p>
            <strong>PT Gastro Gizi Sarana</strong>
            <small>Portal Buku Tamu</small>
          </p>
        </div>
      </div>
      <p className="workspace-nav-heading">BUKU TAMU</p>
      <nav aria-label="Navigasi buku tamu" className="workspace-nav">
        <button
          type="button"
          className={active === "guests" ? "is-active" : ""}
          aria-current={active === "guests" ? "page" : undefined}
          onClick={() => {
            onNavigate?.("guests");
            setDrawer(false);
          }}
        >
          <WorkspaceIcon name="guests" />
          <span>{role === "admin" ? "Data Pengunjung" : "Buku Tamu Saya"}</span>
        </button>
        {role === "admin" && (
          <button
            type="button"
            className={active === "events" ? "is-active" : ""}
            aria-current={active === "events" ? "page" : undefined}
            onClick={() => {
              onNavigate?.("events");
              setDrawer(false);
            }}
          >
            <WorkspaceIcon name="events" />
            <span>Event &amp; Akses User</span>
          </button>
        )}
        <a href={exportHref} onClick={() => setDrawer(false)}>
          <WorkspaceIcon name="export" />
          <span>
            {role === "admin" ? "Ekspor Data Gabungan" : "Ekspor Data Saya"}
          </span>
        </a>
      </nav>
    </>
  );
  const profile = (
    <div className="workspace-profile">
      <span className="workspace-avatar">
        {name.trim().slice(0, 2).toUpperCase()}
      </span>
      <div>
        <strong>{name}</strong>
        <small>{role === "admin" ? "Administrator" : "Salesman"}</small>
      </div>
      <button
        type="button"
        onClick={logout}
        disabled={leaving}
        aria-label="Keluar"
        title="Keluar"
      >
        <WorkspaceIcon name="logout" />
      </button>
    </div>
  );
  const brand = (
    <div className="workspace-brand">
      <img src="/gastro-logo.webp" alt="GASTRO" />
      <span />
      <p>
        Buku<span>Tamu</span>
        <small>GASTRO WORKSPACE</small>
      </p>
    </div>
  );
  return (
    <div className="workspace-app">
      <a className="workspace-skip" href="#workspace-main">
        Lewati ke konten
      </a>
      <aside className="workspace-sidebar" aria-label="Menu utama">
        {brand}
        <div className="workspace-sidebar-scroll">{navigation}</div>
        <div className="workspace-security">
          <WorkspaceIcon name="shield" size={17} />
          <p>
            Akses sesuai peran
            <small>
              {role === "admin"
                ? "Pengelolaan event dan data pengunjung"
                : "Pencatatan tamu untuk acara aktif"}
            </small>
          </p>
        </div>
        {profile}
      </aside>
      <header className="workspace-topbar">
        <div className="workspace-breadcrumb">
          <button
            className="workspace-menu"
            type="button"
            aria-label="Buka menu"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <WorkspaceIcon name="menu" />
          </button>
          <span>Buku Tamu</span>
          <span className="breadcrumb-separator">/</span>
          <strong>{label}</strong>
        </div>
        <span className="workspace-role">
          <span />
          {role === "admin" ? "Admin" : "Sales"}
        </span>
      </header>
      <dialog
        className="workspace-drawer"
        ref={dialog}
        onCancel={() => setDrawer(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDrawer(false);
        }}
        aria-label="Menu buku tamu"
      >
        <div className="workspace-drawer-body">
          <div className="workspace-drawer-heading">
            {brand}
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setDrawer(false)}
            >
              <WorkspaceIcon name="close" />
            </button>
          </div>
          <div className="workspace-sidebar-scroll">{navigation}</div>
          {profile}
        </div>
      </dialog>
      <main id="workspace-main" className="workspace-content" tabIndex={-1}>
        {children}
        <footer className="workspace-footer">
          PT Gastro Gizi Sarana <span>·</span> Buku Tamu
        </footer>
      </main>
    </div>
  );
}
