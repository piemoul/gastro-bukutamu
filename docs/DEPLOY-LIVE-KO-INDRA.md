# Panduan Ko Indra Deploy Buku Tamu ke Live

Panduan ini memindahkan rilis dari **piemoul/gastro-bukutamu** ke proyek Vercel
**gastro-bukutamu** yang sudah melayani https://gastro-bukutamu.vercel.app.
Database tetap memakai **Neon production yang sama**. Data dari Docker lokal
tidak diimpor atau menggantikan data live.

Basis rilis fitur yang telah diuji: `9a206dfcd20b83167fe934d226ee86dfd9b031d5`.
Ambil `main` terbaru yang sudah memuat panduan ini, lalu catat SHA checkout untuk
berita deployment. Perubahan fitur mencakup event admin, whitelist per event,
tampilan WMS/Intranet, label event mobile, serta paginasi customer.

Revisi password admin terdapat pada `main` setelah rilis dasar tersebut. Ambil
HEAD terbaru, bukan checkout rilis dasar saja. Admin kini mengisi password sendiri
saat membuat event dan dapat menggantinya pada event yang sudah ada. Revisi ini
tidak menambah env atau migrasi schema. Password event lama tidak ditulis ulang
saat deployment. User event baru dengan sesi dari versi sebelumnya perlu login
ulang sekali; sesi admin dan sales event bawaan tidak terpengaruh.

**Urutan rilis:** backup dan baseline data -> siapkan env production -> migrasi
tambahan -> bandingkan data lama -> deploy tanpa mengalihkan domain -> verifikasi
-> alihkan domain live.

## 1. Siapkan akses dan titik pemulihan

- Akses baca repo [Piemoul](https://github.com/piemoul/gastro-bukutamu), akses deploy
  ke proyek Vercel yang sudah ada, dan akses ke database/branch Neon production.
- Gunakan Node.js **22.x**, sesuai lingkungan build lokal yang telah diuji.
  Siapkan Git, npm, dan Vercel CLI resmi.
- Catat URL/ID deployment production terakhir yang sehat. URL ini diperlukan
  untuk rollback aplikasi; jangan hanya mencatat URL domain utama.
- Buat backup PostgreSQL lengkap ke penyimpanan privat **di luar repo** dan
  pastikan prosedur pemulihannya tersedia. Ekspor XLSX dapat menjadi pemeriksaan
  tambahan, tetapi tidak menggantikan backup database beserta akun dan schema.
- Sepakati jeda sementara untuk input/edit/hapus tamu selama pengambilan baseline
  dan migrasi. SQL pembanding hanya membuktikan data tetap sama bila tidak ada
  penulisan bersamaan oleh pengguna atau aplikasi lain.

Hasil uji lokal sebelumnya adalah 23 akun, 3 event, dan 685 tamu. **Angka ini
bukan patokan jumlah production saat deploy.** Gunakan baseline live terbaru.

## 2. Ambil source di folder baru

Repo Piemoul memakai riwayat awal tersendiri. Jangan menggabungkannya dengan
checkout lama Ko Indra menggunakan merge riwayat yang tidak berhubungan.

```bash
git clone https://github.com/piemoul/gastro-bukutamu.git gastro-bukutamu-release
cd gastro-bukutamu-release
git pull --ff-only origin main
git rev-parse HEAD
git status --short
npm ci
```

Simpan SHA yang tercetak. Working tree harus bersih sebelum konfigurasi lokal
ditambahkan. Tidak ada script seed yang perlu dijalankan untuk database live.

## 3. Hubungkan ke proyek Vercel yang sudah ada

```bash
npm install -g vercel
vercel login
vercel link --scope koindras-projects --project gastro-bukutamu
```

Pilih scope/proyek yang sudah memiliki domain **gastro-bukutamu.vercel.app**;
jangan membuat proyek atau database pengganti. Periksa identitas proyek hasil
link dan daftar Domains di dashboard sebelum melanjutkan. Sesuaikan scope hanya
jika kepemilikan proyek memang sudah dipindahkan.

Pada pengaturan build proyek, gunakan preset **Next.js**, root repo, install
command `npm ci`, dan build command `npm run build`. Biarkan output directory
mengikuti bawaan Next.js dan gunakan Node.js 22.x. Jalankan migrasi sebagai langkah
tersendiri, bukan sebagai script seed atau perintah yang ikut berjalan pada semua
Preview build. [Dokumentasi Vercel Link](https://vercel.com/docs/cli/link).

## 4. Periksa environment Production

Di proyek Vercel, buka **Settings -> Environment Variables** dan periksa cakupan
**Production**. Pertahankan nilai yang sudah dipakai live.

| Variabel | Konfigurasi untuk rilis ini |
| --- | --- |
| `DATABASE_URL` | Wajib. Koneksi Neon untuk branch/database production yang sudah berisi tamu lama; pertahankan pengaturan SSL koneksi. Jangan memakai host Docker `bukutamu-db`. |
| `SESSION_SECRET` | Wajib, minimal 32 karakter. Pakai nilai production yang sama agar sesi lama tidak sengaja terputus. |
| `NFH_EVENT_PASSWORD` | Wajib. Pertahankan password acara NFH lama. |
| `FHI_EVENT_PASSWORD` | Wajib. Pertahankan password acara FHI lama. |
| `BALI_EVENT_PASSWORD` | Wajib. Pertahankan password acara Bali lama. Ketiga password acara harus berbeda. |
| `ADMIN_PASSWORD` | Dipakai oleh seed untuk membuat/mengganti hash admin. Tidak dipakai migrasi ini atau verifikasi login admin yang sudah ada. Pertahankan jika sudah tersimpan, tetapi jangan menjalankan seed. |

`NEON_FETCH_ENDPOINT` dan `LOCAL_POSTGRES_PASSWORD` **tidak digunakan di Vercel**.
Pastikan tidak ada nilai proxy Docker lokal dalam environment production atau
shell yang akan menjalankan migrasi. Password untuk event baru dibuat melalui
admin dan tidak memerlukan env baru per event.

Di checkout baru yang belum mempunyai `.env`, tarik env production untuk migrasi:

```bash
vercel env pull .env --environment=production --scope koindras-projects
git check-ignore .env
git ls-files -- .env .env.local
```

Perintah terakhir harus tidak menampilkan file rahasia yang terlacak Git.
Periksa kelengkapan env secara privat; jika ada nilai yang tidak dapat diekspor,
lengkapi dari penyimpanan kredensial production yang berwenang. Jangan menampilkan
isi `.env` ke log atau chat. Gunakan shell baru agar env yang pernah diekspor untuk
Docker/staging tidak menimpa `.env`; `dotenv` mendahulukan env proses yang sudah ada.

`vercel env pull` dapat mempertahankan key lokal yang tidak ada di environment
tujuan. Itulah alasan penggunaan folder baru; jangan memakai `.env` dari mesin
demo sebagai env production. Perubahan env di dashboard berlaku pada deployment
baru. Repo menyertakan `.vercelignore` untuk mengecualikan file env, backup,
Graphify, dan artefak uji dari unggahan CLI.
[Dokumentasi Vercel Env](https://vercel.com/docs/cli/env),
[aturan pengecualian unggahan](https://vercel.com/docs/deployments/vercel-ignore).

## 5. Simpan baseline data production

Pastikan dahulu bahwa host/branch Neon pada `DATABASE_URL` sesuai dengan sumber
production yang dipakai live. Jalankan isi
[`deployment/check-existing-data.sql`](deployment/check-existing-data.sql)
melalui SQL editor/client yang terhubung ke database tersebut.

Simpan hasil privat dengan label **sebelum migrasi**. Script hanya membaca:

- nama database dan schema;
- jumlah baris `users`, `events`, dan `clients`;
- sidik MD5 seluruh isi baris setiap tabel, dengan urutan kunci yang tetap.

Sidik data mendeteksi perubahan isi baris yang tidak terlihat dari jumlah saja.
Script tidak menampilkan nama tamu, kontak, atau nilai password. MD5 di sini adalah
pembanding perubahan data, bukan mekanisme penyimpanan password atau bukti backup.

## 6. Jalankan migrasi tambahan

Tinjau [`001-managed-events.sql`](../migrations/001-managed-events.sql) dan
[`scripts/migrate.mjs`](../scripts/migrate.mjs), lalu jalankan dari checkout rilis
dengan env production yang sudah diperiksa:

```bash
npm run migrate
```

Output yang diharapkan:

```text
Migrasi event dan whitelist selesai; data event/user/tamu yang ada tidak diubah.
```

Migrasi menjalankan tiga `CREATE TABLE IF NOT EXISTS` **dalam satu transaksi**:

| Tabel tambahan | Kegunaan |
| --- | --- |
| `managed_events` | Alamat, waktu/zona waktu, hash password akses, dan pembuat event baru. |
| `event_whitelist` | Daftar email yang diizinkan per event baru. |
| `managed_event_users` | Penanda akun yang dibuat khusus untuk event baru. |

Migrasi tidak berisi `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, atau `DROP` pada
tabel lama. Tabel `users`, `events`, dan `clients` harus sudah ada. Bila salah satu
tabel tambahan sudah ada dengan schema yang berbeda, berhenti untuk meninjau
ketidakcocokannya; `IF NOT EXISTS` tidak memperbaiki schema yang salah.

**Jangan jalankan `npm run seed`, script `add-bali-*`, pemulihan dump lokal, atau
script uji integrasi terhadap production untuk rilis ini.** Seed dapat mengganti
hash password admin dan konfigurasi acara lama.

## 7. Bandingkan data sebelum melanjutkan

Jalankan lagi SQL pada langkah 5 di database dan schema yang sama. Ketiga jumlah
baris dan ketiga `rows_fingerprint` harus sama dengan baseline. Jika berbeda saat
penulisan memang sudah dijeda, hentikan rilis dan telusuri penyebabnya sebelum
mengalihkan domain.

Periksa keberadaan tiga tabel baru dengan query read-only:

```sql
SELECT to_regclass('public.managed_events') AS managed_events,
       to_regclass('public.event_whitelist') AS event_whitelist,
       to_regclass('public.managed_event_users') AS managed_event_users;
```

Ketiganya harus terisi nama tabel. Periksa pula kolom/FK sesuai file migrasi.
Untuk migrasi pertama, tabel tambahan masih kosong sampai ada pemakaian fitur
event baru. Jika migrasi diulang pada instalasi yang sudah memakai fitur baru,
data tambahan yang sudah ada tidak boleh direset.

## 8. Deploy tanpa langsung mengalihkan domain live

Periksa build dari checkout yang sama:

```bash
npm run build
vercel deploy --prod --skip-domain --scope koindras-projects
```

Simpan URL deployment unik yang diberikan. `--prod --skip-domain` memakai
konfigurasi Production tetapi menunda pengalihan domain, sehingga rilis dapat
diperiksa sebelum menjadi live. Jangan memakai deployment Preview yang kebetulan
terhubung ke database lain sebagai pengganti pemeriksaan ini.
[Dokumentasi Vercel Deploy](https://vercel.com/docs/cli/deploy#skip-domain).

Pada URL deployment unik tersebut, periksa tanpa menambah data dummy production:

- halaman login dan login admin yang sudah ada;
- jumlah tamu sesuai baseline serta filter NFH/FHI/Bali dan per salesman;
- tampilan salah satu data lama beserta notes/kontaknya;
- ekspor XLSX pribadi/gabungan dan pemisahan tab salesman;
- login sales lama memakai password acara yang sama;
- menu **Event & Akses User**, form judul/alamat/waktu, tampilan mobile, dan paginasi.

Pada staging/database terpisah, periksa pula pembuatan event dengan password
pilihan admin dan pergantian **Password Acara -> Simpan Password**. Pastikan
password lama tidak bisa dipakai, sesi lama diminta login ulang, password baru
berfungsi bagi email whitelist, dan data tamu serta whitelist tidak berubah.

Uji penambahan event/whitelist dan CRUD dengan data dummy dilakukan di staging
dengan database terpisah. Deployment unik Production di atas tetap membaca
database production; jangan menjalankan pengujian tulis massal di sana.

## 9. Alihkan domain setelah verifikasi lulus

Ganti placeholder berikut dengan URL unik dari langkah 8:

```bash
vercel promote <URL_DEPLOYMENT_BARU> --scope koindras-projects
```

Periksa kembali https://gastro-bukutamu.vercel.app/login dan `/admin`, lalu catat
SHA repo, URL deployment baru, waktu migrasi, hasil pembanding data, dan operator
rilis. Pastikan domain production menunjuk deployment yang baru dipromosikan dan
tidak ada error database pada runtime logs. Setelah itu, aktivitas input normal
dapat dilanjutkan. [Dokumentasi Vercel Promote](https://vercel.com/docs/cli/promote).

Prosedur CLI ini tidak memindahkan integrasi Git proyek. Jika auto-deploy masih
mengikuti repo Ko Indra lama, koordinasikan sumber rilis berikutnya agar push pada
repo lama tidak menerbitkan ulang kode yang tertinggal. Jangan mengubah integrasi
Git/domain/database bersamaan tanpa memastikan dampaknya.

## 10. Rollback aplikasi tanpa menghapus data

Jika pemeriksaan gagal sebelum promotion, biarkan domain tetap pada deployment
lama. Tiga tabel tambahan dapat dibiarkan; tidak perlu membatalkan schema.

Jika sudah dipromosikan dan perlu kembali ke deployment sehat sebelumnya:

```bash
vercel rollback <URL_DEPLOYMENT_LAMA> --scope koindras-projects
```

Rollback ini mengembalikan deployment aplikasi, bukan memulihkan isi Neon.
Jangan menghapus tabel tambahan atau merestore backup lama sebagai rollback
aplikasi rutin karena hal itu dapat menghilangkan data yang masuk setelah backup.
Vercel memakai build/config deployment lama saat rollback; perubahan env terbaru
di dashboard tidak otomatis dimasukkan ke build lama.
[Dokumentasi Instant Rollback](https://vercel.com/docs/instant-rollback).

Versi sebelum fitur event baru belum menerapkan pemeriksaan whitelist tersebut.
Jika akun/event baru sudah dipakai setelah rilis, hentikan dahulu pemakaian event
baru dan tinjau pembatasan akses sebelum membuka kembali versi lama. Utamakan
perbaikan ke depan bila rollback akan melemahkan aturan akses. Data tamu dan
event baru tetap disimpan di database.

## Checklist serah terima

- [ ] Checkout berasal dari Piemoul `main`; SHA dicatat.
- [ ] Proyek/domain Vercel dan branch/database Neon benar.
- [ ] Backup privat tersedia dan prosedur pemulihannya dapat dijalankan.
- [ ] Env production lama dipertahankan; variabel proxy lokal tidak digunakan.
- [ ] Migrasi selesai; schema tiga tabel tambahan sesuai.
- [ ] Jumlah dan sidik seluruh baris tabel lama sama sebelum/sesudah migrasi.
- [ ] Build dan pemeriksaan deployment unik lulus.
- [ ] Domain baru dialihkan setelah verifikasi; URL rollback dicatat.
- [ ] Tidak ada seed, impor database demo, atau data uji tulis di production.

Panduan dan query ini disiapkan untuk dijalankan Ko Indra. Penulisan panduan
tidak menjalankan migrasi atau deployment pada layanan live.
