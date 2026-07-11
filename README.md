# 🎵 Stream Beats (MusikUzyy) - Dokumentasi Proyek & Panduan Setup Lengkap

Selamat datang di repositori resmi **Stream Beats (MusikUzyy)**. Dokumen ini dirancang sebagai panduan utama bagi pengembang (developer) maupun administrator sistem untuk memahami, menginstal, mengkonfigurasi, dan meluncurkan aplikasi ini dari awal (titik nol) hingga tahap produksi, baik untuk platform **Web** maupun **Mobile (Android)**.

---

## 📌 DAFTAR ISI
1. [Gambaran Umum Proyek](#-1-gambaran-umum-proyek)
2. [Fitur Utama Aplikasi](#-2-fitur-utama-aplikasi)
3. [Arsitektur & Teknologi](#-3-arsitektur--teknologi)
4. [Prasyarat Sistem (Prerequisites)](#-4-prasyarat-sistem-prerequisites)
5. [Panduan Setup Database (Supabase)](#-5-panduan-setup-database-supabase)
6. [Panduan Setup Google Cloud Platform (OAuth Auth)](#-6-panduan-setup-google-cloud-platform-oauth-auth)
7. [Panduan Setup Spotify API Scraper](#-7-panduan-setup-spotify-api-scraper)
8. [Panduan Setup Lokal & Environment Variables](#-8-panduan-setup-lokal--environment-variables)
9. [Kompilasi Menjadi Aplikasi Android (Capacitor)](#-9-kompilasi-menjadi-aplikasi-android-capacitor)
10. [Struktur Direktori & Kode Sumber](#-10-struktur-direktori--kode-sumber)
11. [Troubleshooting & Pemecahan Masalah](#-11-troubleshooting--pemecahan-masalah)

---

## 📖 1. GAMBARAN UMUM PROYEK

**Stream Beats** adalah aplikasi pemutar musik digital hibrida berfitur lengkap yang berjalan secara responsif di platform **Web** dan dibungkus menjadi aplikasi **Mobile (Android/iOS)** menggunakan Capacitor JS. 

Aplikasi ini menggunakan konsep **Hybrid Streaming Engine**:
- **Metadata Lagu & Playlist**: Diambil dari ekosistem **Spotify** melalui scraper internal.
- **Pemutaran Audio & Video**: Menggunakan engine **YouTube & YouTube Music** di balik layar secara dinamis tanpa memerlukan akun premium Spotify.

Selain sebagai pemutar musik, Stream Beats mengintegrasikan fitur-fitur kompleks berskala produksi seperti interaksi sosial (sistem follow/block), cerita berbatas waktu (Stories), chat grup & personal secara *real-time*, serta sistem berlangganan premium dengan integrasi verifikasi pembayaran oleh Administrator.

---

## 🌟 2. FITUR UTAMA APLIKASI

### 🎵 2.1. Modul Pemutar Musik (Playback Engine)
- **Pencarian Global**: Mencari lagu, album, playlist, atau artis secara cepat.
- **Playlist Manager**: Membuat, memperbarui, dan menyusun lagu dengan antarmuka seret-lepas (*drag-and-drop*).
- **Favorit & Sinkronisasi**: Menyimpan lagu yang disukai (*Liked Songs*), berlangganan artis (*Subscribed Artists*), dan menyimpan album.
- **Riwayat Otomatis**: Mencatat riwayat putar lagu secara otomatis untuk personalisasi.
- **Spotify Importer**: Mengimpor playlist publik Spotify ke database Stream Beats dengan satu kali klik.

### 👥 2.2. Modul Sosial & Stories
- **Sistem Hubungan**: Mengikuti (*Follow*) dan menghentikan pengikutan (*Unfollow*) antar pengguna.
- **Blokir Privasi**: Memblokir pengguna agar tidak dapat mengirim pesan atau melihat profil.
- **Music Stories (24 Jam)**: Mengunggah cerita berupa lagu pilihan dengan teks keterangan (caption) yang akan terhapus otomatis setelah 24 jam.

### 💬 2.3. Sistem Chat Realtime
- **Tipe Chat**: Ruang obrolan personal (1-on-1) dan obrolan grup.
- **Realtime Sync**: Pertukaran pesan instan menggunakan protokol WebSockets (Supabase Realtime).
- **Kaya Fitur**: Mendukung reaksi emoji (*Reactions*), membalas pesan (*Reply*), mengedit pesan, menghapus pesan, serta mengirim stiker kustom.

### 👑 2.4. Keanggotaan Premium & Transaksi
- **Paket Fleksibel**: Pilihan paket berlangganan dengan variasi durasi hari dan harga.
- **Metode QRIS**: Pengguna mengunduh kode QRIS, melakukan pembayaran, lalu mengunggah bukti transaksi berupa gambar.
- **Uji Coba Gratis**: Opsi uji coba gratis (*Free Trial*) sekali pakai untuk pengguna baru.

### 📊 2.5. Panel Admin & Leaderboard
- **Dasbor Statistik**: Memantau total pengguna, total pendapatan, total lagu diputar, dan transaksi tertunda (*pending*).
- **Manajemen Transaksi**: Menyetujui (*Approve*) atau menolak (*Reject*) transaksi berlangganan secara manual.
- **Manajemen Paket**: Membuat dan mengedit paket premium.
- **Broadcast Sistem**: Mengirim notifikasi global (pesan lonceng) ke semua pengguna sekaligus.
- **Papan Peringkat (Leaderboard)**: Klasemen pendengar teratas berdasarkan intensitas pemutaran lagu.

---

## 🛠️ 3. ARSITEKTUR & TEKNOLOGI

Aplikasi ini menggunakan pendekatan **Serverless Fullstack** yang modern, cepat, dan efisien:

| Lapisan (Layer) | Teknologi yang Digunakan |
| :--- | :--- |
| **Frontend Web** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS, Lucide React (Ikon), Motion / Framer Motion (Animasi) |
| **State Management** | Zustand (Penyimpanan global status playback, antarmuka, & data user) |
| **Database & Auth** | Supabase (PostgreSQL), Supabase Auth (Google Provider) |
| **Realtime Engine** | Supabase Realtime (WebSockets) |
| **Storage (Penyimpanan)**| Supabase Storage Buckets (Stiker, Bukti Pembayaran, QRIS) |
| **Mobile Wrapper** | Capacitor JS (Capacitor CLI, Android Core) |
| **Background Task** | `@anuradev/capacitor-background-mode` (Playback latar belakang Android) |

---

## 📋 4. PRASYARAT SISTEM (PREREQUISITES)

Sebelum memulai proses instalasi, pastikan lingkungan kerja lokal Anda memiliki software berikut:
1. **Node.js** (Versi LTS direkomendasikan, minimal v18+) & **NPM**.
2. **Git** (Untuk clone repositori).
3. **Android Studio** (Hanya diperlukan jika ingin membangun dan menguji aplikasi mobile Android).
4. **Code Editor** (Sangat direkomendasikan menggunakan Visual Studio Code).
5. **Akun Pihak Ketiga**:
   - Akun **Supabase** (Daftar di [supabase.com](https://supabase.com))
   - Akun **Google Cloud** (Daftar di [console.cloud.google.com](https://console.cloud.google.com))
   - Akun **Spotify Developer** (Daftar di [developer.spotify.com](https://developer.spotify.com))

---

## 💾 5. PANDUAN SETUP DATABASE (SUPABASE)

Supabase bertindak sebagai tulang punggung (backend) aplikasi Anda. Ikuti langkah-langkah di bawah ini secara runtut:

### Langkah 5.1. Membuat Proyek Baru
1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard).
2. Klik **New Project** dan pilih Organisasi Anda.
3. Isi informasi proyek:
   - **Name**: `Stream Beats` (atau nama pilihan Anda).
   - **Database Password**: Buat password yang kuat dan catat.
   - **Region**: Pilih region terdekat dengan pengguna Anda (misalnya `Singapore - ap-southeast-1` untuk akses tercepat dari Indonesia).
4. Klik **Create New Project** dan tunggu 2-3 menit hingga server database Anda selesai diinisialisasi.

### Langkah 5.2. Menyalin Kunci API & Proyek URL
1. Setelah proyek siap, buka menu **Settings** (ikon roda gigi di sudut kiri bawah).
2. Pilih sub-menu **API**.
3. Cari dan salin nilai berikut:
   - **Project URL**: Ini akan menjadi nilai `NEXT_PUBLIC_SUPABASE_URL`.
   - **Project API keys (anon / public)**: Ini akan menjadi nilai `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **Project API keys (service_role)**: Ini akan menjadi nilai `SUPABASE_SERVICE_ROLE_KEY` (bersifat rahasia, hanya digunakan di backend).

### Langkah 5.3. Menginisialisasi Skema Database (database.sql)
Proyek ini menyediakan file skema lengkap bernama [database.sql](file:///c:/Users/arums/Music/MUSIK/database.sql) di root direktori.
1. Buka file `database.sql` di editor teks Anda, lalu salin seluruh isi kodenya (**Ctrl + A** lalu **Ctrl + C**).
2. Kembali ke Dashboard Supabase, pilih menu **SQL Editor** pada panel kiri (ikon terminal `SQL`).
3. Klik **New query** (Buat kueri kosong baru).
4. Tempelkan (*paste*) kode yang telah disalin ke area editor SQL.
5. Klik tombol **Run** di bagian kanan bawah.
6. Pastikan proses selesai tanpa ada error. Proses ini akan membuat:
   - Seluruh tabel relasional (`profiles`, `playlists`, `messages`, `transactions`, `stories`, dll.).
   - Fungsi trigger `handle_new_user()` yang otomatis menyalin data pengguna dari auth Supabase ke tabel `profiles` saat mendaftar.
   - Indeks database untuk optimasi pencarian.
   - Kebijakan keamanan baris (RLS - Row Level Security).

### Langkah 5.4. Mengaktifkan Supabase Realtime
Agar fitur chat dan verifikasi transaksi dapat tersinkronisasi secara instan tanpa perlu memuat ulang halaman:
1. Di Dashboard Supabase, buka menu **Database** (ikon silinder database di sebelah kiri).
2. Pilih sub-menu **Replication**.
3. Di bagian **Publications**, cari publikasi bernama `supabase_realtime` lalu klik tombol **Edit**.
4. Aktifkan tabel berikut untuk dipantau secara realtime:
   - `messages`
   - `transactions`
5. Klik **Save**.

### Langkah 5.5. Mengaktifkan pg_cron untuk Menghapus Stories Otomatis
Stories dibatasi hanya bertahan selama 24 jam. Skema database menggunakan ekstensi `pg_cron` untuk mengotomasi penghapusan ini.
1. Di Dashboard Supabase, masuk ke **Database** -> **Extensions**.
2. Cari ekstensi bernama `pg_cron` dan aktifkan (klik toggle ke posisi aktif).
3. Query scheduler di bagian bawah `database.sql` akan secara otomatis dieksekusi untuk menjadwalkan pembersihan setiap jam:
   ```sql
   SELECT cron.schedule('cleanup_old_stories', '0 * * * *', $$ DELETE FROM public.stories WHERE created_at < NOW() - INTERVAL '24 hours'; $$);
   ```

### Langkah 5.6. Membuat Buckets di Supabase Storage
Aplikasi memerlukan tempat penyimpanan gambar/file statis. Buat 3 bucket dengan akses publik:
1. Di Dashboard Supabase, klik menu **Storage** (ikon gambar di panel kiri).
2. Klik tombol **New bucket**.
3. Buat bucket pertama:
   - **Name**: `stickers`
   - **Public bucket**: Aktifkan (Centang / Geser ke kanan).
   - Klik **Create bucket**.
4. Ulangi proses di atas untuk membuat bucket kedua:
   - **Name**: `payments` (Public bucket: Aktifkan).
5. Ulangi proses di atas untuk membuat bucket ketiga:
   - **Name**: `qris` (Public bucket: Aktifkan).

> [!NOTE]
> Hak akses unggah dan baca file untuk bucket di atas sudah otomatis dikonfigurasi melalui aturan kebijakan RLS di dalam file `database.sql` Anda.

---

## ☁️ 6. PANDUAN SETUP GOOGLE CLOUD PLATFORM (OAUTH AUTH)

Agar tombol **"Login dengan Google"** berfungsi di platform Web maupun Android, Anda wajib mendaftarkan kredensial di Google Cloud Console.

### Langkah 6.1. Membuat Proyek GCP & OAuth Consent Screen
1. Masuk ke [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru dengan klik dropdown proyek di pojok kiri atas -> **New Project** -> Beri nama `Stream Beats` -> **Create**.
3. Pilih proyek tersebut dari dropdown.
4. Di panel pencarian atas, cari **APIs & Services** -> **OAuth consent screen**.
5. Pilih User Type: **External** -> Klik **Create**.
6. Isi formulir informasi dasar:
   - **App name**: `Stream Beats`
   - **User support email**: Email Anda.
   - **Developer contact information**: Email Anda.
7. Klik **Save and Continue** sampai selesai (lewati bagian scopes dan test users untuk lokal).

### Langkah 6.2. Membuat Kredensial OAuth (Web Client ID)
1. Pilih menu **Credentials** di panel sebelah kiri.
2. Klik tombol **+ Create Credentials** di bagian atas -> pilih **OAuth client ID**.
3. Pilih Application Type: **Web application**.
4. Konfigurasi rute otorisasi:
   - **Authorized JavaScript origins**:
     - Tambahkan URI: `http://localhost:3000` (untuk dev lokal)
     - Tambahkan URI: `https://musickuzyy.vercel.app` (jika sudah dideploy)
   - **Authorized redirect URIs**:
     - Tambahkan URI Supabase Redirect: Anda dapat menemukannya di Dashboard Supabase Anda -> **Authentication** -> **URL Configuration** -> **Redirect URLs**. Formatnya biasanya seperti: `https://[ID-PROYEK-SUPABASE].supabase.co/auth/v1/callback`
5. Klik **Create**.
6. Simpan informasi berikut yang muncul di layar:
   - **Client ID** (Gunakan sebagai Web Client ID).
   - **Client Secret**.

### Langkah 6.3. Memasukkan Kredensial Google ke Supabase Auth
1. Kembali ke Dashboard Supabase Anda.
2. Buka menu **Authentication** -> **Providers**.
3. Cari provider **Google** dan klik untuk memperluas opsi.
4. Aktifkan sakelar **Enable Sign in with Google**.
5. Masukkan **Client ID** dan **Client Secret** yang Anda peroleh dari Google Cloud Console di Langkah 6.2.
6. Klik **Save**.

---

## 🎵 7. PANDUAN SETUP SPOTIFY API SCRAPER

Aplikasi mengimpor daftar putar Spotify menggunakan API endpoint `/api/spotify` yang memanfaatkan pustaka `spotify-url-info` untuk mengurai tautan playlist publik secara dinamis tanpa perlu autentikasi token pengembang yang rumit. 

Cara kerjanya:
1. Pengguna memasukkan tautan playlist Spotify publik (Contoh: `https://open.spotify.com/playlist/...`).
2. API backend mengurai metadata lagu (Judul, Penyanyi, Durasi, Sampul Album).
3. Aplikasi secara otomatis melakukan pencarian silang (*cross-search*) ke mesin pencarian YouTube Music untuk menemukan kecocokan video ID.
4. Video ID dan metadata disimpan ke tabel `playlists` untuk pemutaran audio di latar belakang.

---

## 💻 8. PANDUAN SETUP LOKAL & ENVIRONMENT VARIABLES

Sekarang saatnya mengunduh dependensi dan menyalakan aplikasi di lingkungan lokal Anda.

### Langkah 8.1. Menginstal Node Modules
1. Jalankan terminal Anda di direktori root proyek.
2. Ketik perintah berikut untuk menginstal seluruh dependensi:
   ```bash
   npm install
   ```

### Langkah 8.2. Membuat File Lingkungan (.env.local)
1. Buat file baru bernama tepat `.env.local` di root direktori proyek Anda (sejajar dengan `package.json`).
2. Masukkan template variabel lingkungan berikut dan sesuaikan nilainya:

```env
# ==============================================================
# ENVIRONMENT VARIABLES - STREAM BEATS (LOKAL)
# ==============================================================

# Supabase URL dan Anon Key (Dapatkan dari Settings -> API di Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://[ganti-dengan-id-proyek-anda].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Jangan diekspos ke klien, jangan gunakan awalan NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL Utama Aplikasi (Diperlukan untuk redirect auth)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> [!WARNING]
> Jangan pernah membagikan file `.env.local` Anda atau mengunggahnya ke repositori publik seperti GitHub. File ini sudah dimasukkan ke dalam `.gitignore` untuk keamanan data Anda.

### Langkah 8.3. Menjalankan Aplikasi di Mode Pengembangan
1. Di terminal Anda, jalankan perintah berikut:
   ```bash
   npm run dev
   ```
2. Buka browser Anda dan akses alamat `http://localhost:3000`.
3. Aplikasi web Stream Beats Anda kini telah aktif dan terhubung ke backend Supabase!

---

## 📱 9. KOMPILASI MENJADI APLIKASI ANDROID (CAPACITOR)

Jika Anda ingin mengompilasi proyek web Next.js ini menjadi file `.apk` asli yang dapat dipasang di smartphone Android, ikuti langkah-langkah di bawah ini.

### Langkah 9.1. Konfigurasi capacitor.config.ts
Buka file [capacitor.config.ts](file:///c:/Users/arums/Music/MUSIK/capacitor.config.ts) di VS Code. Anda akan melihat kode berikut:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.musickuzyy.app',
  appName: 'Stream Beats',
  webDir: 'public', // Direktori keluaran hasil kompilasi Next.js static
  server: {
    url: 'https://musickuzyy.vercel.app', // Alamat web produksi agar aplikasi memuat data live
    cleartext: true,
    allowNavigation: [
      '*.google.com',
      '*.supabase.co',
      '*.supabase.com',
      'accounts.google.com',
      'musickuzyy.vercel.app'
    ]
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // GANTI ini dengan OAuth Web Client ID Anda dari Google Cloud Console
      serverClientId: '193378763566-br298ob97b9th8i1liq6gcuil0e6mckm.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
```

> [!IMPORTANT]
> Pastikan Anda mengganti nilai `serverClientId` di dalam objek `GoogleAuth` dengan **Web Client ID** yang diperoleh dari Google Cloud Console (Langkah 6.2). Hal ini krusial agar modul Login Google di Android berfungsi.

### Langkah 9.2. Proses Sinkronisasi Aset & Membuka Android Studio
1. Pertama-tama, matikan server dev lokal jika masih menyala (**Ctrl + C**).
2. Lakukan build produksi Next.js untuk merangkum seluruh aset web statis:
   ```bash
   npm run build
   ```
3. Sinkronisasikan kode web statis ke folder platform Android Capacitor:
   ```bash
   npx cap sync android
   ```
4. Buka folder Android proyek Anda langsung ke dalam IDE Android Studio:
   ```bash
   npx cap open android
   ```

### Langkah 9.3. Menjalankan & Mem-build APK di Android Studio
1. Biarkan Android Studio memuat proyek dan menyelesaikan sinkronisasi sistem **Gradle** (pantau indikator proses di kanan bawah).
2. Untuk mencoba di Emulator atau Perangkat HP Fisik:
   - Hubungkan HP Android asli Anda menggunakan kabel USB dan aktifkan fitur **USB Debugging** di menu opsi pengembang HP Anda.
   - Atau buat perangkat Emulator baru via **Device Manager** di Android Studio.
   - Klik tombol **Run** (ikon segitiga hijau `Play` di bar bagian atas Android Studio).
3. Untuk membuat file **APK Rilis / Produksi**:
   - Di menu atas Android Studio, pilih **Build** -> **Generate Signed Bundle / APK...**.
   - Pilih **APK** lalu klik **Next**.
   - Buat file KeyStore baru (`.jks`) untuk sertifikat tanda tangan keamanan aplikasi Anda, simpan kata sandinya dengan baik.
   - Pilih Build Variant: `release`.
   - Selesaikan proses wizard. Android Studio akan menyimpan file `.apk` yang ditandatangani di folder output proyek Anda (biasanya di direktori `android/app/release/app-release.apk`). Anda siap mengirim file APK ini ke perangkat Android Anda!

---

## 📂 10. STRUKTUR DIREKTORI & KODE SUMBER

Berikut adalah penjelasan fungsi setiap direktori utama dalam proyek ini:

```text
├── android/                   # Kode native Android hasil generate dari Capacitor (Java, Gradle)
├── app/                       # Routing halaman Next.js (App Router)
│   ├── admin/                 # Panel kontrol admin (konfirmasi transaksi, paket, dll.)
│   ├── api/                   # API endpoint backend (Scraper Spotify, YouTube Search)
│   ├── auth/                  # Halaman otorisasi dan login Google
│   ├── library/               # Halaman perpustakaan lagu/playlist milik user
│   ├── messages/              # Halaman pesan & obrolan realtime
│   ├── premium/               # Halaman pemilihan paket berlangganan
│   ├── profile/               # Halaman profil pribadi pengguna
│   ├── layout.tsx             # Layout global aplikasi Next.js
│   └── page.tsx               # Halaman utama aplikasi (Home/Dashboard)
├── components/                # Komponen antarmuka (Reusable React Components)
│   ├── desktop/               # Layout khusus pengguna perangkat desktop (layar lebar)
│   ├── SpotifyImportModal.tsx # Dialog impor playlist Spotify
│   └── Player.tsx             # Komponen pemutar musik utama (audio engine)
├── hooks/                     # Custom React Hooks (Sinkronisasi audio, sensor, dll.)
├── lib/                       # Integrasi logika utama
│   ├── db.ts                  # Query manual & interaksi DB langsung
│   ├── store.ts               # State global Zustand (Playback state, User session)
│   └── supabase/
│       └── client.ts          # Inisialisasi client Supabase dengan Session Persistence
├── public/                    # File statis (Gambar, favicon, aset stiker awal)
├── capacitor.config.ts        # File konfigurasi Capacitor JS
├── database.sql               # Skema database lengkap (SQL Script)
└── package.json               # Daftar paket pustaka Node.js & skrip kompilasi
```

---

## 🔍 11. TROUBLESHOOTING & PEMECAHAN MASALAH

### 🔴 11.1. Login Google Gagal di Aplikasi Android
- **Penyebab**: Hash SHA-1 tanda tangan APK Anda belum didaftarkan di Google Cloud Console.
- **Solusi**:
  1. Dapatkan hash SHA-1 dari sertifikat debug Anda. Di terminal root proyek, jalankan:
     ```bash
     cd android
     ./gradlew signingReport
     ```
  2. Cari bagian `Task :app:signingReport` dan salin baris kode **SHA1** milik varian `debug` atau `release`.
  3. Buka **Google Cloud Console** -> **Credentials** -> **Create Credentials** -> **OAuth client ID**.
  4. Pilih tipe **Android**. Isi Package Name dengan `com.musickuzyy.app` (lihat `appId` di config Capacitor).
  5. Tempelkan tanda tangan sertifikat **SHA-1** Anda di kolom yang tersedia. Klik **Create**.
  6. Pastikan `serverClientId` pada `capacitor.config.ts` sudah merujuk pada **Web Client ID** yang benar.

### 🔴 11.2. Transaksi / Pesan Chat Tidak Masuk Secara Instan
- **Penyebab**: Fitur replication di Supabase belum diaktifkan untuk tabel terkait.
- **Solusi**: Ikuti langkah di [Langkah 5.4](#langkah-54-mengaktifkan-supabase-realtime). Pastikan status replication untuk tabel `messages` dan `transactions` sudah aktif.

### 🔴 11.3. Stories Tidak Terhapus Otomatis Setelah 24 Jam
- **Penyebab**: Ekstensi `pg_cron` belum aktif di database Supabase Anda.
- **Solusi**: Ikuti instruksi di [Langkah 5.5](#langkah-55-mengaktifkan-pg_cron-untuk-menghapus-stories-otomatis). Pastikan Anda telah mengaktifkan `pg_cron` di menu **Database** -> **Extensions** di dashboard Supabase.

### 🔴 11.4. Perubahan Kode Tampilan Tidak Muncul di Android Studio
- **Penyebab**: Aset Next.js belum dibangun ulang sebelum disinkronkan ke Capacitor.
- **Solusi**: Setiap kali Anda mengedit kode di React/Next.js, Anda wajib menjalankan perintah berikut secara berurutan agar perubahan masuk ke Android Studio:
  ```bash
  npm run build
  npx cap sync android
  ```

---

## 🔒 KEAMANAN & PRAKTIK TERBAIK
- **Jangan pernah melakukan commit file `.env.local` atau folder `android/app/google-services.json` (jika ada) ke GitHub.**
- Selalu pantau status log penggunaan API keys Anda di Google Cloud Console untuk menghindari penyalahgunaan oleh pihak ketiga.

---

**Selamat Berkreasi! 🚀** Jika Anda menemukan kendala teknis lebih lanjut, silakan tanyakan kepada tim pengembang utama atau buka issue baru.
