# 🏡 SI KKN — Sistem Informasi Data Warga Desa

Sistem informasi berbasis web untuk mengelola data kependudukan desa secara digital, real-time, dan aman. Dibangun dalam rangka kegiatan Kuliah Kerja Nyata (KKN).

![Tech Stack](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![Prisma](https://img.shields.io/badge/Prisma-6-blue?logo=prisma) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green?logo=postgresql) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)

---

## ✨ Fitur Utama

- 📊 **Dashboard Interaktif** — Statistik warga dengan grafik gender, umur, agama, pendidikan, dan status penduduk secara real-time.
- 👥 **Manajemen Data Warga** — CRUD lengkap dengan filter, pencarian, dan import via Excel.
- 🏠 **Kartu Keluarga (KK)** — Pengelompokan data warga per keluarga dengan hubungan keluarga yang terstruktur.
- 📁 **Import Excel** — Upload data massal dari template Excel dengan auto-link ke Kartu Keluarga.
- 🔐 **Autentikasi & Otorisasi** — Sistem login berbasis JWT dengan Role-Based Access Control (RBAC).
- 📋 **Audit Log** — Setiap perubahan data tercatat lengkap (siapa, kapan, apa yang diubah).
- 🛡️ **Keamanan** — Proteksi rute halaman dan API endpoint dari akses tanpa izin.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 15 (App Router), React, TailwindCSS |
| **Backend** | Next.js API Routes (Route Handlers) |
| **Database** | PostgreSQL (via Neon) |
| **ORM** | Prisma 6 |
| **Auth** | JWT (jsonwebtoken), Cookie-based session |
| **Charts** | Recharts |
| **Animation** | Framer Motion |
| **Excel** | SheetJS (xlsx) |

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Clone Repository

```bash
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME
```

### 2. Install Dependencies

```bash
npm install
# atau
pnpm install
```

### 3. Setup Environment

```bash
# Salin file template .env
cp .env.example .env
```

Lalu buka file `.env` dan isi dengan nilai yang benar:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
JWT_SECRET="string-rahasia-panjang-dan-acak-minimal-32-karakter"
NODE_ENV="development"
```

### 4. Setup Database

```bash
# Sinkronisasi skema database
npx prisma db push

# (Opsional) Jalankan Prisma Studio untuk melihat data
npx prisma studio
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🌐 Deploy ke Hosting (Vercel)

1. Push repository ke GitHub.
2. Buka [vercel.com](https://vercel.com) dan import repository.
3. Di bagian **Environment Variables**, tambahkan:
   - `DATABASE_URL` — URL koneksi database Neon/PostgreSQL
   - `JWT_SECRET` — String rahasia yang panjang dan acak
   - `NODE_ENV` — `production`
4. Klik **Deploy**.

---

## 📁 Struktur Project

```
/
├── app/
│   ├── api/              # Backend API Routes
│   │   ├── warga/        # CRUD Data Warga
│   │   ├── kartu-keluarga/ # CRUD Kartu Keluarga
│   │   ├── login/        # Autentikasi
│   │   └── audit-logs/   # Riwayat aktivitas
│   ├── dashboard/        # Halaman Dashboard
│   ├── warga/            # Halaman Data Warga
│   ├── kartu-keluarga/   # Halaman Kartu Keluarga
│   ├── audit-log/        # Halaman Audit Log
│   └── components/       # Komponen UI (Sidebar, dll)
├── lib/                  # Helper (auth, db, audit)
├── prisma/
│   └── schema.prisma     # Skema Database
├── public/               # Aset publik (favicon, template Excel)
├── .env.example          # Template variabel lingkungan
└── middleware.js         # Proteksi rute halaman
```

---

## 👥 Kontributor

- Tim KKN — Universitas [NAMA UNIVERSITAS]

---

## 📄 Lisensi

Project ini dibuat untuk keperluan akademis (KKN). Bebas digunakan dan dikembangkan lebih lanjut.
