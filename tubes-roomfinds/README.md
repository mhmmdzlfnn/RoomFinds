# RoomFinds

RoomFinds adalah aplikasi pencarian dan pengelolaan kos di Jakarta Selatan. Proyek ini dibuat sebagai MVP tugas besar PBO dengan tiga bagian utama:

- **Frontend:** Next.js App Router, React, TypeScript, dan Tailwind CSS.
- **Backend:** Java 17, Spring Boot 3, Spring JDBC, dan Maven.
- **Database:** PostgreSQL 16.

Dokumen ini menjelaskan arsitektur, cara menjalankan aplikasi melalui Docker atau NetBeans, status integrasi saat ini, skema database, API, akun demo, serta batasan MVP.

## Daftar isi

- [Arsitektur](#arsitektur)
- [Status integrasi](#status-integrasi-saat-ini)
- [Persyaratan](#persyaratan)
- [Jalankan semua layanan dengan Docker](#jalankan-semua-layanan-dengan-docker)
- [Jalankan backend Java melalui NetBeans](#jalankan-backend-java-melalui-netbeans)
- [Jalankan secara manual tanpa Docker](#jalankan-secara-manual-tanpa-docker)
- [Database dan data demo](#database-dan-data-demo)
- [Jalankan pemeriksaan](#jalankan-pemeriksaan)
- [Akun demo](#akun-demo)
- [Fitur dan endpoint API](#fitur-dan-endpoint-api)
- [Struktur proyek](#struktur-proyek)
- [Catatan implementasi PBO](#catatan-implementasi-pbo)
- [Troubleshooting](#troubleshooting)

## Arsitektur

```text
Browser
  │
  ├── Next.js + TypeScript (localhost:3000)
  │      ├── Mode demo: data contoh lokal
  │      └── Mode API: request /api/* melalui rewrite Next.js
  │
  └── Spring Boot REST API (localhost:8080)
          └── Spring JDBC → PostgreSQL (localhost:5432)
```

Di Docker Compose, frontend menghubungi backend melalui alamat internal `http://backend:8080`; backend menghubungi PostgreSQL melalui `postgres:5432`. Jika layanan dijalankan langsung di komputer, alamat default backend adalah `localhost:5432` untuk PostgreSQL dan `localhost:8080` untuk API.

## Status integrasi saat ini

**Backend dan database sudah dikonfigurasi untuk saling terhubung.** Backend memiliki driver PostgreSQL dan koneksi JDBC yang membaca `DB_URL`, `DB_USER`, serta `DB_PASSWORD`. Docker Compose juga menyiapkan PostgreSQL, menunggu health check database, lalu menjalankan backend.

Namun, **frontend saat ini secara default masih berada di mode demo/mock**. Nilai pada `frontend/.env.local` dan konfigurasi Compose adalah `NEXT_PUBLIC_USE_MOCK=true`. Artinya:

- Halaman memakai data contoh lokal dan tidak semuanya membaca/menulis ke database.
- Halaman login/daftar, pencarian kamar, dan pengajuan booking punya jalur API ketika mode mock dimatikan.
- Banyak halaman operasional lain masih berupa tampilan demo atau interaksi lokal; belum seluruh form dan tombol terhubung ke endpoint backend.
- Backend memiliki endpoint pembayaran, keluhan, verifikasi kos, dan pengelolaan kamar, tetapi layar terkait belum seluruhnya melakukan request ke endpoint tersebut.

Untuk mencoba alur API dari frontend, ubah `NEXT_PUBLIC_USE_MOCK` menjadi `false` dan mulai ulang frontend. Backend dan PostgreSQL juga harus berjalan. README ini tidak mengklaim seluruh alur aplikasi sudah terintegrasi end-to-end.

## Persyaratan

Pilih kebutuhan sesuai cara menjalankan proyek:

- **Semua dengan Docker:** Docker Engine/Desktop dan Docker Compose v2.
- **Backend melalui NetBeans:** NetBeans yang mendukung proyek Maven, JDK 17, koneksi internet saat Maven pertama kali mengunduh dependensi, dan PostgreSQL lokal atau PostgreSQL dari Docker.
- **Frontend lokal:** Node.js 18 atau lebih baru dan npm.
- **PostgreSQL lokal:** PostgreSQL 16 direkomendasikan. Versi lain yang mendukung fitur PostgreSQL pada skema juga dapat digunakan.

## Jalankan semua layanan dengan Docker

Dari direktori utama proyek:

```bash
docker compose up --build
```

Alamat layanan:

| Layanan | Alamat | Kredensial lokal |
|---|---|---|
| Frontend | http://localhost:3000 | — |
| API health | http://localhost:8080/api/health | — |
| PostgreSQL | `localhost:5432` | database/user/password: `roomfinds` |

Jika salah satu port host sudah dipakai, port publik Compose dapat diubah melalui `POSTGRES_PORT`, `API_PORT`, dan `FRONTEND_PORT`. Nilai default-nya berturut-turut `5432`, `8080`, dan `3000`.

Mode default masih mock. Untuk menggunakan frontend dengan API Spring Boot, set environment sebelum menjalankan Compose:

```bash
NEXT_PUBLIC_USE_MOCK=false docker compose up --build
```

Contoh jika port `5432` sudah dipakai PostgreSQL lokal:

```bash
POSTGRES_PORT=55432 API_PORT=18080 FRONTEND_PORT=3000 NEXT_PUBLIC_USE_MOCK=false docker compose up --build
```

Di PowerShell:

```powershell
$env:NEXT_PUBLIC_USE_MOCK = "false"
docker compose up --build
```

Hentikan layanan dengan `Ctrl+C`. Untuk menghentikan container tanpa menghapus database, jalankan:

```bash
docker compose down
```

> **Perhatian:** `docker compose down -v` menghapus volume PostgreSQL `roomfinds-data`, termasuk data yang tersimpan. Gunakan hanya jika memang ingin menghapus database lokal dan memulai ulang dari data seed.

## Jalankan backend Java melalui NetBeans

**Bisa.** Backend adalah proyek Maven Spring Boot standar dan dapat dibuka serta dijalankan dari NetBeans. Frontend Next.js tetap dijalankan terpisah dari terminal.

1. Pastikan JDK 17 sudah terpasang dan dipilih di NetBeans melalui **Tools → Java Platforms**.
2. Siapkan PostgreSQL. Untuk menghindari bentrok dengan PostgreSQL lokal yang memakai port `5432`, jalankan hanya service database RoomFinds pada port `55432` dari folder proyek:

   ```bash
   POSTGRES_PORT=55432 docker compose up -d postgres
   ```

   Di PowerShell:

   ```powershell
   $env:POSTGRES_PORT = "55432"
   docker compose up -d postgres
   ```

   Container tersebut membuka PostgreSQL di `localhost:55432` dengan database, user, dan password `roomfinds`.
3. Di NetBeans pilih **File → Open Project**, lalu pilih folder `backend` (folder yang berisi `pom.xml`). NetBeans mengenalinya sebagai proyek Maven. File `backend/nbactions.xml` mengikat aksi **Run Project** ke `spring-boot:run` dan mengatur koneksi database RoomFinds pada port `55432`.
4. Tunggu NetBeans selesai mengunduh dependency Maven. Pastikan project menggunakan JDK 17.
5. Klik kanan proyek backend lalu pilih **Run** (atau tekan F6). Untuk debug, pilih **Debug Project** (Ctrl+F5); NetBeans akan menjalankan `spring-boot:run` dan memasang debugger pada port dinamis. Gunakan aksi proyek ini supaya konfigurasi Maven berjalan konsisten. Hindari **Run File** pada class utama untuk workflow reguler.
6. Backend tersedia di `http://localhost:8080`; cek `http://localhost:8080/api/health`.

Alternatif menjalankan backend dari terminal (Maven harus tersedia):

```bash
cd backend
mvn spring-boot:run
```

Jika kamu menggunakan port PostgreSQL selain `55432`, ubah URL koneksi pada `backend/nbactions.xml` atau atur environment variables untuk proses IDE:

```text
DB_URL=jdbc:postgresql://localhost:55432/roomfinds
DB_USER=roomfinds
DB_PASSWORD=roomfinds
FRONTEND_ORIGIN=http://localhost:3000
```

Spring Boot akan mencoba menjalankan `schema.sql` dan `data.sql` saat startup. Jika PostgreSQL tidak tersedia atau kredensial salah, backend akan gagal mulai.

## Jalankan secara manual tanpa Docker

### 1. Siapkan PostgreSQL

Buat database dan role (contoh psql sebagai administrator PostgreSQL):

```sql
CREATE USER roomfinds WITH PASSWORD 'roomfinds';
CREATE DATABASE roomfinds OWNER roomfinds;
```

Konfigurasi default backend sudah cocok dengan database contoh di atas. Untuk konfigurasi lain, set `DB_URL`, `DB_USER`, dan `DB_PASSWORD` sebelum menjalankan backend. `FRONTEND_ORIGIN` default-nya `http://localhost:3000`.

### 2. Jalankan backend

Jalankan dari NetBeans seperti [petunjuk NetBeans](#jalankan-backend-java-melalui-netbeans), atau:

```bash
cd backend
mvn spring-boot:run
```

### 3. Jalankan frontend

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:3000`. File `frontend/.env.local` harus berisi:

```env
NEXT_PUBLIC_USE_MOCK=false
```

Next.js mengarahkan `/api/*` ke `http://localhost:8080` secara default. Jalankan frontend pada port `3000` agar sesuai dengan origin CORS backend default. Untuk mode Docker, alamat internal Next.js sudah ditetapkan melalui `API_INTERNAL_URL=http://backend:8080`.

Development menyimpan hasil kompilasi di `frontend/.next-dev`, sedangkan `npm run build` dan `npm run start` menggunakan `frontend/.next`. Pemisahan ini mencegah build pengujian menimpa chunk server development. Setelah memperbarui `next.config.mjs`, hentikan server lama dengan `Ctrl+C`, jalankan kembali `npm run dev`, lalu muat ulang browser. Error `Cannot find module './<nomor>.js'` dari `.next/server/webpack-runtime.js` biasanya menandakan cache kompilasi yang tidak konsisten, bukan masalah API.

### Pratinjau frontend tanpa backend

Untuk mengerjakan tampilan, gunakan `NEXT_PUBLIC_USE_MOCK=true` pada `frontend/.env.local`. Template tersedia di `frontend/.env.local.example`. Restart `npm run dev` setelah mengubah konfigurasi. Mode ini tidak memanggil API; untuk kembali ke integrasi server, ubah nilainya menjadi `false`.

Login demo memakai satu form email/password, tanpa pilihan peran. Password semua akun berikut adalah `password`:

| Peran | Email | Tujuan |
|---|---|---|
| User | `zulfan@email.com` | `/user/booking` |
| Pemilik | `fariz@email.com` | `/pemilik` |
| SuperAdmin | `dynoadmin@roomfinds.id` | `/admin` |

Ketiga alur prototipe dapat dimulai dari `/`, `/pemilik`, dan `/admin` saat mode mock aktif. Identitas demo disimpan di browser; ini bukan autentikasi server. Booking dan pengajuan penundaan User bertahan selama sesi tab, sedangkan kebanyakan aksi contoh lainnya hanya mengubah state halaman.

Layar publik dan pengelolaan adalah cuplikan prototipe: Kamar 204 tampil Kosong di pencarian/detail dan Terisi di daftar pengelolaan, mengikuti spesifikasi masing-masing layar. Antrean verifikasi menempatkan Kos Kenanga Indah (21 Oktober) sebelum Kos Dahlia (22 Oktober), memprioritaskan aturan pengajuan terlama dahulu meskipun urutan contoh kartu pada spesifikasi terbalik. Perubahan demo tidak disinkronkan antarperan. Galeri menggunakan ilustrasi SVG lokal, bukan foto asli. Font Inter di-host lokal beserta lisensinya pada `frontend/public/fonts`.

Pemeriksaan UI dengan Chrome/Edge yang terpasang (tanpa menambah dependency pengujian):

```bash
cd frontend
npm run build
node scripts/ui-smoke.mjs
```

Jalankan dengan mode mock. Skrip menjalankan server sementara pada port `3107`, membuka browser headless, memeriksa 20 layar serta interaksi utama, lalu menghentikan prosesnya. Screenshot disimpan di `.next/ui-preview/`. Jika browser tidak terdeteksi, atur `ROOMFINDS_BROWSER` ke lokasi executable Chrome/Edge. Integrasi backend tetap perlu diuji terpisah. Edit email/kampus/kontak darurat, ganti password, dan nonaktifkan akun pada layar profil hanya disimulasikan dalam mode mock karena kontrak API yang tersedia belum mendukung semuanya.

## Database dan data demo

**File definisi database sudah ada di repositori, tetapi server/database tidak ikut berupa file proyek.** Database PostgreSQL perlu dijalankan secara lokal atau dibuat oleh Docker Compose. Saat container pertama kali berjalan, Compose membuat database `roomfinds`; saat Spring Boot mulai, SQL init membuat tabel dan mengisi data awal.

File database:

- `backend/src/main/resources/schema.sql` membuat tabel jika belum ada.
- `backend/src/main/resources/data.sql` mengisi data contoh. Seed memakai pengecekan data dan `ON CONFLICT` agar dapat dijalankan saat startup tanpa menggandakan sebagian besar data contoh.
- Konfigurasi `spring.sql.init.mode: always` membuat Spring menjalankan skrip tersebut setiap startup.

Tabel inti yang dibuat:

| Tabel | Kegunaan |
|---|---|
| `pengguna` | Akun penyewa, pemilik kos, dan SuperAdmin |
| `kos` | Profil kos, aturan, denda, serta status verifikasi |
| `kamar` | Informasi, harga, fasilitas, dan status kamar |
| `paket_sewa` | Pilihan durasi dan diskon sewa |
| `booking` | Permintaan sewa, tanggal, nilai total, dan status |
| `tagihan` | Tagihan sewa, meteran, pembayaran terakumulasi, dan status |
| `item_tagihan` | Rincian komponen biaya tagihan |
| `pembayaran` | Pembayaran tunai/transfer dan status verifikasi |
| `pengajuan_penundaan` | Permintaan penundaan pembayaran |
| `keluhan` | Keluhan penyewa, tanggapan pemilik, foto lampiran (`foto_url`), dan penanda arsip (`diarsipkan`) |
| `notifikasi_baca` | Penanda notifikasi yang sudah dibaca per pengguna (isi notifikasi dihitung dari data lain) |
| `pengeluaran` | Pengeluaran operasional kos yang dicatat pemilik, dipakai untuk laba bersih |
| `pengingat_tagihan` | Pengingat pembayaran yang dikirim pemilik ke penyewa, tampil sebagai notifikasi |

Upload bukti transfer saat ini disimpan dalam bentuk data URI/base64 di kolom `pembayaran.bukti_url`, bukan di object storage. Batas upload backend adalah 2 MB per file dan 3 MB per request.

Foto kamar (`kamar.foto_url`) dan foto keluhan (`keluhan.foto_url`) memakai pola yang sama: dikirim frontend sebagai data URL PNG atau JPG dengan batas 2 MB. Aturannya dipusatkan di kelas `FotoUnggah` yang memeriksa awalan, isi berkas (bukan sekadar nama), dan ukuran.

## Jalankan pemeriksaan

Jalankan dari terminal NetBeans/Maven atau terminal biasa dengan JDK 17 dan Maven:

```bash
cd backend
mvn test
```

Test Java memeriksa masa tenggang, batas maksimum denda, denda flat, kondisi tanpa denda, validasi nilai aturan, serta perhitungan diskon dan pembulatan paket sewa. Di NetBeans, pilih **Test Project** pada proyek Maven backend.

Untuk frontend:

```bash
cd frontend
npm ci
npm run build
```

Build Next.js menjalankan pemeriksaan TypeScript dan menghasilkan seluruh route aplikasi. Pengujian integrasi API dan database memerlukan PostgreSQL aktif; lihat petunjuk health check di atas.

## Akun demo

Data seed menyediakan akun lokal berikut. Password untuk semua akun demo adalah **`password`**.

| Peran | Email |
|---|---|
| Pemilik | `fariz@email.com` |
| Pemilik | `hendra.saputra@email.com` |
| Penyewa | `zulfan@email.com` |
| Penyewa | `dimas.pratama@email.com` |
| Penyewa | `nabila.putri@email.com` |
| Penyewa | `fajar.nugroho@email.com` |
| SuperAdmin | `dynoadmin@roomfinds.id` |

Akun dan password ini hanya untuk pengembangan/demo lokal. Jangan gunakan kredensial seed untuk penerapan publik.

## Fitur dan endpoint API

Semua endpoint diawali `/api`. Endpoint yang membutuhkan login memakai session cookie HTTP-only.

| Area | Endpoint utama |
|---|---|
| Status layanan | `GET /health` |
| Autentikasi & profil | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET/PUT /profil` |
| Pencarian kamar | `GET /kamar`, `GET /kamar/{id}` |
| Booking penyewa | `POST /booking`, `GET /booking/saya`, `PATCH /booking/{id}/batal` |
| Booking pemilik | `GET /kos/{kosId}/booking`, `PATCH /booking/{id}/konfirmasi`, `PATCH /booking/{id}/tolak`, `PATCH /booking/{id}/checkout` |
| Pengelolaan kos/kamar | `GET/POST /kos`, `PUT/DELETE /kos/{id}`, `GET/POST /kos/{kosId}/kamar`, `PUT/PATCH/DELETE /kos/{kosId}/kamar/{roomId}` (POST dan PUT/PATCH menerima `foto`) |
| Paket dan aturan denda | `GET/PUT /kos/{kosId}/paket`, `PUT /kos/{id}/aturan-denda` |
| Tagihan | `GET /tagihan/saya`, `GET /kos/{kosId}/tagihan`, endpoint pencatatan meteran |
| Pembayaran | `POST /tagihan/{id}/pembayaran` (JSON atau multipart bukti transfer), `PATCH /pembayaran/{id}/verifikasi`, `GET /pembayaran/riwayat` |
| Penundaan | `POST /tagihan/{id}/penundaan`, `PATCH /penundaan/{id}` |
| Keluhan | `GET/POST /keluhan` (POST menerima `foto`), `GET /kos/{kosId}/keluhan?arsip=`, `PATCH /keluhan/{id}/status`, `PATCH /keluhan/{id}/arsip` (hanya keluhan berstatus selesai), `DELETE /keluhan/{id}` (penyewa, selama belum diproses) |
| Notifikasi | `GET /notifikasi`, `PATCH /notifikasi/baca` |
| Pengingat tagihan | `POST /kos/{kosId}/pengingat` (pemilik; satu tagihan paling sering sekali per 12 jam) |
| Pengeluaran | `GET/POST /kos/{kosId}/pengeluaran` |
| Akun sendiri | `PATCH /profil/nonaktif` (penyewa; ditolak bila masih ada sewa aktif atau tagihan belum lunas) |
| Laporan pemilik | `GET /kos/{kosId}/laporan` |
| SuperAdmin | `GET /admin/statistik`, `GET /admin/kos`, `PATCH /admin/kos/{id}/verifikasi`, `PATCH /admin/kos/{id}/nonaktif`, `GET/POST /admin/pengguna`, `PATCH /admin/pengguna/{id}/status` |

> Catatan: tabel ini merangkum endpoint yang tersedia di controller. Bentuk payload tiap endpoint dapat dilihat di method controller yang sesuai di `backend/src/main/java/id/roomfinds/api`. Sebagian endpoint belum dipakai oleh halaman frontend.

Contoh cek backend saat layanan aktif:

```bash
curl http://localhost:8080/api/health
```

Endpoint health menjalankan query `SELECT 1`, jadi status `database: connected` memastikan koneksi PostgreSQL tersedia, bukan hanya proses Spring Boot hidup.

## Struktur proyek

```text
RoomFinds/
├── backend/
│   ├── pom.xml
│   ├── nbactions.xml               # Aksi Run/Debug backend di NetBeans
│   └── src/main/
│       ├── java/id/roomfinds/api/   # Spring controllers, model dan aturan domain
│       └── resources/               # application.yml, schema.sql, data.sql
├── frontend/
│   ├── app/                         # Halaman Next.js App Router
│   ├── components/                  # Komponen UI bersama
│   ├── lib/api.ts                   # Helper request ke backend
│   ├── lib/mock.ts                  # Data contoh mode demo
│   └── .env.local                   # Pengaturan lokal frontend
├── docker-compose.yml
├── megaprompt-uiux.md
└── Proposal_Tubes_PBO_RoomFinds.pdf
```

## Catatan implementasi PBO

Backend menggunakan Spring Boot dan pemisahan tanggung jawab melalui controller serta tipe/domain Java. Contoh konsep domain yang sudah diterapkan antara lain:

- `PaketSewa` untuk menghitung total harga berdasarkan durasi dan diskon.
- `AturanDenda` sebagai sealed interface dengan implementasi aturan denda harian, flat, dan tanpa denda.
- `DendaService` untuk perhitungan denda.

Akses database menggunakan **Spring JDBC** dengan query SQL, bukan JPA/Hibernate. Ini tetap memungkinkan aturan domain dan perilaku objek ditulis dengan Java, tetapi pemetaan/operasi database dilakukan eksplisit menggunakan SQL.

Proposal dapat memuat cakupan rancangan kelas dan layanan yang lebih luas daripada MVP saat ini. Implementasi ini belum mencakup seluruh model/service yang mungkin tercantum di proposal; README ini mendokumentasikan kode yang tersedia saat ini.

## Troubleshooting

### Backend tidak bisa terhubung ke PostgreSQL

- Pastikan PostgreSQL berjalan dan port `5432` tersedia.
- Pastikan nama database/user/password cocok dengan `DB_URL`, `DB_USER`, dan `DB_PASSWORD`.
- Jika backend dijalankan dari NetBeans di komputer host, gunakan host `localhost`. Host `postgres` hanya berlaku dari container backend di jaringan Compose.
- Baca pesan startup Spring Boot; kegagalan init SQL juga dapat menghentikan backend.

### NetBeans tidak mendeteksi proyek

- Pilih folder `backend` yang berisi `pom.xml`, bukan folder induk proyek.
- Pastikan NetBeans dikonfigurasi memakai JDK 17.
- Gunakan **Reload Project** atau **Build with Dependencies** setelah Maven selesai mengunduh dependency.
- Jalankan proyek backend (F6), bukan hanya `Run File` pada class utama; binding NetBeans menjalankan goal `spring-boot:run`.

### Frontend menampilkan data demo atau API gagal

- Periksa `NEXT_PUBLIC_USE_MOCK`. Nilai `true` memakai mode demo; ubah ke `false` untuk mode API.
- Setelah mengubah environment variable, restart Next.js atau rebuild container frontend.
- Pastikan backend merespons di `http://localhost:8080/api/health`.
- Di Docker, pastikan seluruh layanan berjalan dan frontend memakai `API_INTERNAL_URL=http://backend:8080`.
- API yang memerlukan autentikasi membutuhkan session login; membuka halaman UI tidak otomatis membuat session demo.

### Port sudah digunakan

Pastikan port `3000`, `5432`, dan `8080` tidak sedang dipakai proses lain. Jika port PostgreSQL diubah, sesuaikan juga `DB_URL` backend.
