# Buku Tamu Gastro — Webapp

Panduan rilis ke live untuk Ko Indra:
[Deploy dari Piemoul, konfigurasi env, migrasi tanpa mengubah data lama, dan rollback](docs/DEPLOY-LIVE-KO-INDRA.md).

Aplikasi buku tamu untuk salesman Gastro pada acara **NFH**, **FHI**, dan **Gastro day Bali - Morreti X-perience**.
Dibangun dengan Next.js 14 (App Router), Tailwind CSS, dan PostgreSQL (Neon) yang
ter-deploy di Vercel.

## Fitur

- **Login email + password** (tanpa pilih acara di form).
  - *Salesman* mengetik **password acara** yang juga menentukan acara aktifnya:
    - `NFH_EVENT_PASSWORD` → acara **NFH (National Food & Hotel)**
    - `FHI_EVENT_PASSWORD` → acara **FHI (Food Hotel Indonesia)**
    - `BALI_EVENT_PASSWORD` → acara **Gastro day Bali - Morreti X-perience** (kode `BALI`)
  - *Admin* memakai password akunnya sendiri (diatur melalui `ADMIN_PASSWORD` saat seed), lalu **memilih acara**
    di halaman admin.
- **Salesman** (`/dashboard`):
  - Isi buku tamu: Nama klien, Nama PT, Email, No HP, Barang yang diminati.
    Email & No HP **opsional**; wajib hanya Nama klien, Nama PT, dan Barang yang diminati.
  - Lihat, **edit**, dan hapus data miliknya sendiri.
  - Export data sendiri ke **XLSX** (1 tab).
- **Admin** (`/admin`):
  - Pilih acara (NFH / FHI / Gastro day Bali - Morreti X-perience / Semua) & filter per salesman.
  - Lihat semua tamu + ringkasan jumlah per salesman.
  - Export **XLSX gabungan**: 1 file, **tiap tab = 1 salesman** + tab Ringkasan.

## Kredensial

### Admin
| Email | Password |
|---|---|
| `salesco2.gastro@gmail.com` | `ADMIN_PASSWORD` |
| `yogi.k@gastro.co.id` | `ADMIN_PASSWORD` |
| `oliver.h@gastro.co.id` | `ADMIN_PASSWORD` |

### Salesman (password = password acara)
Password acara: **`NFH_EVENT_PASSWORD`** (NFH), **`FHI_EVENT_PASSWORD`** (FHI), atau **`BALI_EVENT_PASSWORD`** (Gastro day Bali - Morreti X-perience).

| Nama | Area | Email |
|---|---|---|
| Malik | Gandaria | sales1@gastro.co.id |
| Deni | Gandaria | sales3@gastro.co.id |
| Bayu | Gandaria | bayu.a@gastro.co.id |
| Halim | Gandaria | halim@gastro.co.id |
| Yatie | Gandaria | yatie.n@gastro.co.id |
| Pipin | Gandaria | pipin.a@saranarefrigeratama.co.id |
| Helmi | Gandaria | j.helmi@saranarefrigeratama.co.id |
| Panji | Gandaria | sales4@gastro.co.id |
| Kiki | Gandaria | sales6@gastro.co.id |
| Angga | Gandaria | sales5@gastro.co.id |
| Dondy | Gandaria | dondy.i@gastro.co.id |
| Ferry | Bandung | a.ferry@gastro.co.id |
| Taufiq | Bandung | sales.bdg@gastro.co.id |
| Dedi | Bandung | sales1.bdg@gastro.co.id |
| Desi | Bali | dessy.a@gastro.co.id |
| Dion | Gandaria | sales2@gastro.co.id |
| Dean | Gandaria | chef@gastro.co.id |
| Novita | Gandaria | marketing@gastro.co.id |
| Angga | Bali | sales1.dps@gastro.co.id |
| Farida | Bali | sales.dps@gastro.co.id |

## Pengembangan lokal

```bash
npm install
npm run seed     # buat schema + seed 20 salesman + 3 admin + 3 event (idempoten)
npm run dev      # http://localhost:3000
```

Salin `.env.example` ke `.env` dan isi nilainya (**jangan dikomit**).
Semua kredensial lokal disatukan dalam `.env`: koneksi database, rahasia sesi,
password admin, dan password ketiga acara. Jangan menduplikasinya di `.env.local`.
Environment yang disediakan Vercel tetap diprioritaskan pada deployment:

```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
SESSION_SECRET=<minimal 32 karakter acak>
ADMIN_PASSWORD=<password admin>
NFH_EVENT_PASSWORD=<password acara NFH>
FHI_EVENT_PASSWORD=<password acara FHI>
BALI_EVENT_PASSWORD=<password acara Bali>
```

Password dikonfigurasi melalui `.env` lokal dan environment Vercel. Nilainya tidak
dicantumkan dalam kode atau halaman login. Gunakan nilai yang berbeda untuk setiap acara. Di Vercel,
isi variabel yang sama pada environment Production lalu deploy ulang.
Login salesman langsung membaca password acara dari environment. `ADMIN_PASSWORD`
dipakai saat seed untuk membuat hash bcrypt; login admin tetap memverifikasi hash
di database. Mengubah `ADMIN_PASSWORD` saja tidak mengganti password akun yang
sudah ada sampai hash akun diperbarui.

## Menambahkan event Bali pada database yang sudah berjalan

Jalankan `npx tsx scripts/add-bali-event.ts` dengan `DATABASE_URL` database tujuan
sebelum deploy. Script ini hanya menambahkan atau memperbarui event `BALI`;
akun, event lain, dan data tamu tidak diubah. Aman dijalankan ulang.

## Catatan teknis

- **Database**: PostgreSQL di Neon (serverless, cocok untuk Vercel).
  Driver: `@neondatabase/serverless`.
- **Sesi**: iron-session (cookie HttpOnly, 12 jam).
- **Password admin** di-hash dengan bcryptjs. Password acara untuk login dibaca dari environment.
  Kolom `events.event_password` tetap diisi oleh script seed untuk kompatibilitas data lama.
- **Keamanan**: setiap API route memvalidasi sesi; salesman hanya bisa
  mengakses data `WHERE user_id = session.userId`. Export gabungan hanya untuk admin.

## Event dan whitelist dari admin

Pada sidebar admin, buka **Event & Akses User**:

1. Isi judul, alamat, tanggal/jam, zona waktu (WIB/WITA/WIT), dan password akses yang ditentukan admin, lalu simpan.
2. Gunakan password 8–128 karakter, tanpa spasi di awal/akhir, dan berbeda dari event lain (termasuk NFH/FHI/BALI). Tombol **Tampilkan** membantu memeriksa password sebelum dibagikan.
3. Pilih event dan tambahkan email user; beberapa email dapat dipisahkan dengan baris baru atau koma.
4. User masuk melalui halaman login yang sama dengan email dan password acara.

Event baru hanya dapat digunakan oleh email dalam whitelist event tersebut. Email baru
otomatis mendapat akun user event; akun sales yang sudah ada dipakai kembali tanpa
mengubah nama, area, peran, atau passwordnya. Akun admin tidak dikonversi menjadi sales.
User yang dibuat lewat whitelist hanya dapat memakai event barunya, tidak otomatis
mendapat akses NFH/FHI/BALI. Penghapusan email dari whitelist langsung menghentikan
akses event, termasuk sesi yang masih terbuka.

Untuk mengganti password, pilih event pada **Event yang Dikelola**, edit kolom
**Password Acara**, lalu klik **Simpan Password**. Password baru baru berlaku
setelah berhasil disimpan. Perubahan memperbarui password dan sidik aksesnya
dalam satu transaksi; password lama dan sesi event yang memakai password lama
tidak berlaku lagi. Whitelist serta data tamu tetap tersimpan.

Event yang sebelumnya mendapat password otomatis tetap memakai password lamanya
sampai admin menyimpan penggantian. Revisi pengaturan password ini tidak memerlukan
variabel env atau migrasi schema tambahan. User event baru yang sesinya dibuat
sebelum revisi ini perlu login ulang sekali; sesi admin dan sales NFH/FHI/BALI
tetap memakai alur yang ada.

Akses NFH/FHI/BALI untuk akun sales lama tetap memakai konfigurasi password acara
yang sudah ada. Filter admin dan ekspor XLSX mendukung event lama maupun event baru.
Tampilan mengikuti pola Gastro WMS/Intranet: sidebar putih, navy, latar abu terang,
ringkasan, pencarian/paginasi tabel, dan menu ponsel. Pencarian/paginasi tampilan
tidak membatasi isi ekspor XLSX.

Pada ponsel, label event diringkas (NFH/FHI/Bali atau singkatan event baru),
sementara nama lengkap tetap tersedia untuk aksesibilitas. Kartu perolehan
salesman dapat diklik untuk membuka daftar customer miliknya. Daftar admin dan
sales memiliki pilihan 10/25/50 tamu per halaman, nomor halaman, serta tombol
sebelumnya/berikutnya. Pergantian filter atau ukuran halaman kembali ke halaman
pertama; halaman terakhir menyesuaikan jumlah data yang tersisa.

## Migrasi untuk lingkungan Neon/Vercel

Sebelum mengaktifkan kode baru pada database yang sudah berjalan:

```bash
npm ci
npm run migrate
npm run build
```

Migrasi hanya membuat tabel `managed_events`, `event_whitelist`, dan
`managed_event_users` jika belum ada. Migrasi dapat dijalankan ulang dan tidak
mengubah akun, password, event, atau tamu yang sudah ada. **Jangan menjalankan seed
ke database yang sudah berisi data** karena seed dapat memperbarui password admin.

Environment Neon/Vercel tetap memakai enam variabel pada contoh utama di atas.
Biarkan `NEON_FETCH_ENDPOINT` dan `LOCAL_POSTGRES_PASSWORD` tidak disetel pada Vercel;
keduanya hanya untuk database Docker lokal. Password event baru disimpan melalui
admin, sehingga tidak perlu menambahkan environment variable untuk setiap event.
File `.env` dan konfigurasi cadangan tidak boleh dikomit atau diunggah ke GitHub.

## Docker lokal yang terpisah dari live

Konfigurasi lokal disimpan pada `.env`. Gunakan password lokal acak dan sesuaikan:

```dotenv
DATABASE_URL=postgresql://bukutamu:<password-lokal>@bukutamu-db:5432/bukutamu
LOCAL_POSTGRES_PASSWORD=<password-lokal-yang-sama>
NEON_FETCH_ENDPOINT=http://bukutamu-proxy:8080/sql
```

Enam variabel aplikasi tetap diperlukan (lihat `.env.example`). Docker menjalankan
PostgreSQL dan adapter HTTP lokal di jaringan internal tanpa membuka port database.
Driver Neon produksi tetap memakai HTTPS bawaannya saat endpoint lokal tidak diatur.

```bash
docker compose build
docker compose up -d bukutamu-db bukutamu-proxy
# Hanya untuk database lokal yang masih kosong:
docker compose run --rm --no-deps app npm run seed
docker compose up -d app
```

Aplikasi tersedia di http://localhost:3047. Pada mesin kerja ini, data awal sudah
disalin secara read-only dari Neon ke volume lokal; jangan menjalankan seed lagi.
Salinan tersebut tidak melakukan sinkronisasi otomatis dengan live. Perubahan lewat
localhost hanya tersimpan di database Docker lokal. Volume data dipertahankan saat
container dibuat ulang; jangan memakai `docker compose down -v` jika ingin menyimpan data.

Pemeriksaan integrasi dilakukan dengan `scripts/local/verify.mjs` di image tools
dengan jaringan Compose dan environment lokal. Script menolak target selain
`bukutamu-db`, menguji API dan ekspor terhadap database asli lokal, membersihkan
data uji, dan membandingkan kembali seluruh baris awal.
