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

---

## Git Remotes

```bash
git remote -v
# origin    https://github.com/Jem1004/cms-sekolah-v1.git  (SMPN 3 PPU)
# smkn1ppu  https://github.com/Jem1004/cms-smkn1ppu.git    (SMKN 1 PPU)
# smkmutuppu https://github.com/Jem1004/cms-smkmutuppu.git  (SMK Mutu PPU)
```

Push ke semua sekaligus:
```bash
git push origin main
git push smkn1ppu main
git push smkmutuppu main
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

## Login Default (semua sekolah)

- **Email:** `admin@astrodigiso-cms.com`
- **Password:** `Admin123!`

> ⚠️ Ganti password setelah login pertama kali.

---

## `.env` Lokal (Development)

`.env` lokal saat ini terhubung ke database **SMKN 1 PPU** untuk development.
Jangan push file `.env` ke GitHub.
