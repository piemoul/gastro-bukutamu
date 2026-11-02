# Deployment lokal Buku Tamu

Aplikasi: http://localhost:3047

Tampilan mengikuti Gastro WMS dan Intranet. Admin memiliki menu **Event & Akses User**
untuk membuat event dan menambahkan email whitelist. Login, pencatatan/edit/hapus
tamu, filter, dan ekspor event lama tetap tersedia.

## Database dan environment

Lokal memakai PostgreSQL Docker terpisah dengan salinan awal 23 akun, 3 event,
dan 685 tamu. Salinan dibuat melalui transaksi read-only dari sumber Neon.
Perubahan lewat localhost tidak menulis ke live dan tidak disinkronkan otomatis.
Database produksi tidak dimigrasikan oleh pengujian lokal ini.

`.env` berisi konfigurasi lokal dan rahasia yang tidak dikomit. Konfigurasi awal
Neon disimpan pada `.env.live-backup` yang juga diabaikan Git. `.env.example`
berisi nama variabel dan petunjuk tanpa nilai rahasia.

## Menjalankan

```powershell
docker compose up -d --build
docker compose ps
docker compose logs --tail 50 app
```

Container aplikasi hanya membuka `127.0.0.1:3047`, menjalankan user non-root,
dan memakai restart policy `unless-stopped`. PostgreSQL dan adapter HTTP tidak
membuka port host. Data disimpan dalam volume `bukutamu_local_data`.

Jangan menjalankan seed pada database yang sudah berisi data. Migrasi tabel
event/whitelist dijalankan otomatis sebelum aplikasi Docker dimulai. Untuk
Neon/Vercel, ikuti perintah `npm run migrate` pada README sebelum deployment.

## Verifikasi

Build produksi dan TypeScript lulus. Sebanyak 50 pemeriksaan integrasi mencakup
login lama, event baru, validasi form, whitelist, isolasi event/user, pencabutan
akses sesi, filter dinamis, ekspor XLSX, dan regresi CRUD tamu. Setelah pembersihan,
seluruh baris awal serta kredensial dibandingkan dan tetap sama.

Browser membuktikan simpan event dan whitelist lalu reload, tambah/edit tamu
lalu reload, pencarian, paginasi, serta tampilan desktop dan ponsel 320/390px.
Bukti screenshot lokal disimpan pada `.local-deployment/` dan tidak dipublikasikan.
