# 🚀 Portal Login - WEB PROGRAMMER CHALLENGE

Aplikasi web portal sederhana yang berfokus pada sistem autentikasi yang aman dan modern. Dibangun untuk memenuhi spesifikasi teknis pendaftaran pengguna, otentikasi sesi, dan proteksi rute menggunakan standar industri terkini.

## ✨ Fitur Utama

- **Sistem Register & Login**: Validasi input dan pengelolaan pengguna.
- **Keamanan Tingkat Tinggi**: Hashing _password_ menggunakan `bcryptjs` dan otentikasi berbasis **JWT (JSON Web Tokens)** yang disimpan secara aman di dalam **HttpOnly Cookies** (tahan terhadap serangan XSS).
- **Proteksi Rute (Middleware)**: Halaman `/dashboard` sepenuhnya diproteksi dari akses tanpa otorisasi langsung di level _Edge Server_.
- **In-Memory Rate Limiting**: Endpoint login dilindungi dari serangan _brute-force_ (Maksimal 5 percobaan per menit per IP).
- **Dark Mode Toggle**: Dukungan _light/dark theme_ yang tersimpan di _local storage_.
- **UI/UX Responsif**: Antarmuka yang bersih, profesional, dengan animasi _loading state_ saat memproses permintaan.

---

## 🛠️ Tech Stack

**Frontend & Backend (Monorepo)**

- [Next.js](https://nextjs.org/) (App Router) - _Framework React_
- [React](https://reactjs.org/) - _Library UI_
- [Tailwind CSS v4](https://tailwindcss.com/) - _Utility-first CSS Framework_

**Database & ORM**

- [MySQL](https://www.mysql.com/) - _Relational Database_
- [Prisma ORM (v6)](https://www.prisma.io/) - _Type-safe Database Client_

**Security & Utility**

- `bcryptjs` - _Password Hashing_
- `jose` - _JWT Signing & Verification di Edge/Middleware_

---

## ⚙️ Cara Menjalankan Project (Local Development)

### 1. Persiapan Kebutuhan (Prerequisites)

Pastikan sistem Anda sudah terinstal:

- **Node.js** (Disarankan versi 18.x atau terbaru)
- **MySQL Server** (Bisa menggunakan XAMPP, WAMP, atau MySQL native)

### 2. Instalasi Dependensi

Buka terminal di dalam direktori proyek ini, lalu jalankan:

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Buat sebuah file bernama `.env` di direktori _root_ proyek (sejajar dengan `package.json`), dan tambahkan variabel berikut:

```env
# Sesuaikan credential database dengan MySQL Anda (contoh di bawah menggunakan XAMPP default)
DATABASE_URL="mysql://root:@localhost:3306/db_hr_login"

# Gunakan string acak yang kuat untuk produksi
JWT_SECRET="rahasia_super_aman_untuk_hr_portal_2026"
```

_(Catatan: Pastikan Anda sudah membuat database kosong bernama `db_hr_login` di MySQL/XAMPP Anda)._

### 4. Setup Database (Migrasi & Prisma Client)

Jalankan perintah berikut untuk membuat tabel `User` di MySQL dan men-generate Prisma Client:

```bash
npx prisma db push
npx prisma generate
```

### 5. Jalankan Server Development

Karena aplikasi ini diatur untuk berjalan dari database yang kosong saat pertama kali diinstal, Anda perlu mendaftarkan akun _dummy_ terlebih dahulu sebelum dapat mencoba fitur Login di frontend.

**Langkah 1: Buat Akun via API (Register)**
Gunakan Postman, Insomnia, atau Thunder Client untuk melakukan _request_ pendaftaran akun:

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/register`
- **Headers:** `Content-Type: application/json`
- **Body JSON:**
  ```json
  {
    "email": "hrd@perusahaan.com",
    "password": "password123"
  }
  ```

**Langkah 2: Login via Browser**

```bash
npm run dev
```

Setelah akun berhasil dibuat via API, buka browser dan akses [http://localhost:3000]. Silakan gunakan kredensial berikut untuk masuk ke Dashboard:

**Email:** `hrd@perusahaan.com`
**Password:** `password123`

---

## 🏗️ Penjelasan Arsitektur

Aplikasi ini menggunakan pendekatan **Fullstack Monorepo** yang difasilitasi oleh arsitektur Next.js App Router:

1. **Frontend Layer (Client Components)**
   - Halaman UI (`page.tsx`) ditulis menggunakan React dengan direktif `"use client"` untuk mengelola _state_ form (email, password, loading) secara interaktif.
   - Menggunakan `fetch` API untuk berkomunikasi dengan rute backend internal.

2. **Backend Layer (Route Handlers)**
   - API dibangun menggunakan Next.js Route Handlers (`route.ts`) yang berjalan di lingkungan Node.js.
   - Menerapkan arsitektur **Prisma Client Singleton** (`src/lib/prisma.ts`) untuk mencegah masalah kehabisan koneksi (_connection exhaustion_) saat _hot-reloading_ di fase _development_.

3. **Authentication & Session Flow**
   - **Register**: _Password_ di-hash menggunakan `bcryptjs` sebelum disimpan ke database.
   - **Login**: Kredensial diverifikasi. Jika valid, _server_ menggunakan library `jose` untuk membuat token JWT. Token ini tidak dikembalikan ke _body JSON_, melainkan langsung disematkan ke dalam **HttpOnly Cookie** via `NextResponse`. Ini memastikan skrip _frontend_ (dan peretas XSS) tidak dapat membaca token tersebut.

4. **Security Layer (Middleware)**
   - File `middleware.ts` berjalan sebelum setiap _request_ mencapai rute tujuan.
   - Middleware bertugas mencegat akses ke rute `/dashboard`. Ia akan mengekstrak _cookie_, memverifikasi kriptografi JWT secara langsung di _edge_, dan menolak akses (redirect ke `/login`) jika sesi tidak valid, kedaluwarsa, atau tidak ditemukan.

5. **Anti-Spam / Rate Limiting**
   - Terdapat algoritma _Token Bucket_ sederhana berbasis memori (_In-Memory Map_) pada endpoint `/api/login` untuk memblokir IP yang melakukan percobaan login gagal berulang kali (maksimal 5 kali per menit).
