# Deployment Guide — Astro School CMS

Catatan konfigurasi untuk setiap deployment project ini.

---

## Repositories

| Sekolah | Repository | Domain | Vercel Project |
|---|---|---|---|
| Template / Dev | `cms-sekolah-v1` (origin) | — | — |
| SMPN 3 PPU | `cms-sekolah-v1` (origin) | `smpn3ppu.sch.id` | cms-smpn3ppu |
| SMKN 1 PPU | `cms-smkn1ppu` | `smkn1ppu.sch.id` | cms-smkn1ppu |
| SMK Mutu PPU | `cms-smkmutuppu` | `smkmutuppu.sch.id` | cms-smkmutuppu |
| SMK Muda PPU | `cms-sekolah-smkmudappu` | `smkmudappu.com` | cms-smkmudappu |

---

## File yang Wajib Diubah per Deployment

### 1. `src/lib/s3.ts`
Ubah folder prefix agar file upload tidak tercampur di S3:
```ts
// SMPN 3 PPU
const key = `cms-smpn3ppu/uploads/...`

// SMKN 1 PPU
const key = `cms-smkn1ppu/uploads/...`

// SMK Mutu PPU
const key = `cms-smkmutuppu/uploads/...`

// SMK Muda PPU
const key = `cms-smkmudappu/uploads/...`
```

### 2. Environment Variables di Vercel
Setiap project Vercel harus punya env vars sendiri:

| Key | Keterangan |
|---|---|
| `DATABASE_URL` | URL Neon PostgreSQL masing-masing sekolah |
| `DIRECT_URL` | Sama dengan DATABASE_URL |
| `NEXTAUTH_SECRET` | Generate baru: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Domain production sekolah (https://...) |
| `AWS_ACCESS_KEY_ID` | Sama untuk semua |
| `AWS_SECRET_ACCESS_KEY` | Sama untuk semua |
| `AWS_REGION` | `ap-southeast-1` |
| `AWS_S3_BUCKET` | `freelance-store` |

---

## Database Neon per Sekolah

| Sekolah | DATABASE_URL |
|---|---|
| SMPN 3 PPU | `postgresql://neondb_owner:npg_ziGYFybSQ6s4@ep-summer-glitter-ao3w4m1i.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| SMKN 1 PPU | `postgresql://neondb_owner:npg_Vb7vZrHDJ8gK@ep-winter-morning-a1px0ua5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| SMK Mutu PPU | `postgresql://neondb_owner:npg_ndcU5G2SAIzT@ep-snowy-unit-aomufodx-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| SMK Muda PPU | `postgresql://neondb_owner:npg_x19jsFJKqcgh@ep-odd-tooth-aof63si2-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |

---

## Git Remotes

```bash
git remote -v
# origin      https://github.com/Jem1004/cms-sekolah-v1.git         (SMPN 3 PPU)
# smkn1ppu    https://github.com/Jem1004/cms-smkn1ppu.git           (SMKN 1 PPU)
# smkmutuppu  https://github.com/Jem1004/cms-smkmutuppu.git         (SMK Mutu PPU)
# smkmudappu  https://github.com/Jem1004/cms-sekolah-smkmudappu.git (SMK Muda PPU)
```

Push ke semua sekaligus:
```bash
git push origin main
git push smkn1ppu main
git push smkmutuppu main
git push smkmudappu main
```

---

## Prosedur Deploy Sekolah Baru

1. Buat database Neon baru (akun baru di neon.tech)
2. Buat repository baru di GitHub `Jem1004`
3. Ubah `src/lib/s3.ts` → folder prefix baru
4. Commit + push ke repository baru
5. Import repository di Vercel → isi env vars
6. Sementara ganti `.env` lokal ke database baru
7. Jalankan `npx prisma migrate deploy && npx prisma db seed`
8. Kembalikan `.env` lokal ke SMKN 1 PPU (development)
9. Konfigurasi domain di Vercel + DNS di Niagahoster/Hostinger

---

## NEXTAUTH_SECRET per Sekolah

| Sekolah | NEXTAUTH_SECRET |
|---|---|
| SMPN 3 PPU | `cTpjJ/4ZdZzF++OrK0MeGI2EkMK9sYIIPeLcKHoHRlDs=` |
| SMKN 1 PPU | `cEv1KDXjhJI5qbBfebzLNNggcbClBiezhHK8x17i+4+A=` |
| SMK Mutu PPU | `cEv1KDXjhJI5qbBfebzLNNggcbClBiezhHK8x17i+4+A=` |
| SMK Muda PPU | `IcP4xww079mUbL8n7jp3TcP6fVJMn3Q/FYMEqBuJM+w=` |

---

## AWS S3 Folder Structure

Semua sekolah menggunakan bucket yang sama (`freelance-store`) dengan folder terpisah:

```
freelance-store/
├── cms-smpn3ppu/uploads/
├── cms-smkn1ppu/uploads/
├── cms-smkmutuppu/uploads/
└── cms-smkmudappu/uploads/
```

---

## Vercel Project URLs

| Sekolah | Production URL | Vercel Dashboard |
|---|---|---|
| SMPN 3 PPU | https://smpn3ppu.sch.id | https://vercel.com/jem1004s-projects/cms-smpn3ppu |
| SMKN 1 PPU | https://smkn1ppu.sch.id | https://vercel.com/jem1004s-projects/cms-smkn1ppu |
| SMK Mutu PPU | https://smkmutuppu.sch.id | https://vercel.com/jem1004s-projects/cms-smkmutuppu |
| SMK Muda PPU | https://smkmudappu.com | https://vercel.com/jem1004s-projects/cms-smkmudappu |

---

## Deployment History

| Tanggal | Sekolah | Status | Commit Hash |
|---|---|---|---|
| 2026-04-18 | SMPN 3 PPU | ✅ Live | Initial deployment |
| 2026-04-19 | SMKN 1 PPU | ✅ Live | Initial deployment |
| 2026-04-20 | SMK Mutu PPU | ✅ Live | Initial deployment |
| 2026-05-04 | SMK Muda PPU | ✅ Live | `a827762c` |

---

## Login Default (semua sekolah)

- **Email:** `admin@astrodigiso-cms.com`
- **Password:** `Admin123!`

> ⚠️ Ganti password setelah login pertama kali.

---

## `.env` Lokal (Development)

`.env` lokal saat ini terhubung ke database **SMK Mutu PPU** sebagai environment development utama.
Jangan push file `.env` ke GitHub.

---

## Catatan Teknis

### Image Optimization
- Vercel Image Optimization: **DISABLED** (`unoptimized: true`)
- Client-side WebP compression: **ENABLED** (Canvas API)
- Target size: Max 1920×1080, quality 82%
- Quota usage: 0/5,000 transformations/month

### Database Caching
- Cache strategy: `unstable_cache` (Next.js)
- Revalidate time: 3600s (1h) untuk konten statis, 300s (5min) untuk konten dinamis
- Cache invalidation: Otomatis via `revalidateTag()` saat admin update data
- Performance gain: ~95% faster response time (450-700ms → 15-30ms)

### Features Available
- ✅ Content Management (Articles, Pages, Announcements, Events)
- ✅ Gallery Management
- ✅ Staff Directory
- ✅ Department Pages
- ✅ Student Registration System
- ✅ Graduation Announcement System (Excel import + public lookup)
- ✅ Dynamic Menu Builder
- ✅ SEO Optimization (meta tags, Open Graph)
- ✅ Role-Based Access Control (SUPER_ADMIN, ADMIN, EDITOR)

### Database Schema
- 13 migrations applied
- Last migration: `20260503122149_add_graduation_student`
- Tables: User, Article, Page, Announcement, Event, Gallery, Staff, Department, Registration, GraduationStudent, Category, Menu, SiteSettings
