import { z } from "zod"

export const articleSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200, "Judul maksimal 200 karakter"),
  content: z.string().min(1, "Konten wajib diisi"),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda hubung"
    ),
  categoryId: z.string().cuid().optional(),
  thumbnailUrl: z.string().url("URL thumbnail tidak valid").optional(),
})

export const menuItemSchema = z.object({
  label: z.string().min(1, "Label wajib diisi").max(100, "Label maksimal 100 karakter"),
  url: z.string().min(1, "URL wajib diisi"),
  type: z.enum(["INTERNAL", "EXTERNAL"]),
  parentId: z.string().nullable(),
  order: z.number().int("Urutan harus bilangan bulat").min(0, "Urutan tidak boleh negatif"),
  isHighlighted: z.boolean().optional().default(false),
})

export const userSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["SUPER_ADMIN", "EDITOR", "CONTRIBUTOR"]),
})

export const staffSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  position: z.string().min(1, "Jabatan wajib diisi").max(100, "Jabatan maksimal 100 karakter"),
  photoUrl: z.string().url("URL foto tidak valid").optional(),
  order: z.number().int("Urutan harus bilangan bulat").min(0, "Urutan tidak boleh negatif"),
})

export const galleryImageSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200, "Judul maksimal 200 karakter"),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
  imageUrl: z.string().url("URL gambar tidak valid"),
  order: z.number().int("Urutan harus bilangan bulat").min(0, "Urutan tidak boleh negatif"),
})

// ============================================
// Institutional Content Schemas
// ============================================

const heroSlideSchema = z.object({
  id: z.string().min(1, "ID slide wajib diisi"),
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  imageUrl: z.string().min(1, "URL gambar wajib diisi"),
  badgeLabel: z.string().min(1, "Label badge wajib diisi"),
  ctaText: z.string().min(1, "Teks CTA wajib diisi"),
  ctaUrl: z.string().min(1, "URL CTA wajib diisi"),
})

export const heroContentSchema = z.object({
  slides: z.array(heroSlideSchema).min(1, "Minimal satu slide harus diisi").max(5, "Maksimal 5 slide"),
})

export const profileContentSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  videoUrl: z.string().min(1, "URL video wajib diisi"),
  visi: z.string().min(1, "Visi wajib diisi"),
  misi: z.string().min(1, "Misi wajib diisi"),
  sejarah: z.string().min(1, "Sejarah wajib diisi"),
})

export const principalContentSchema = z.object({
  message: z.string().min(1, "Pesan wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  title: z.string().min(1, "Jabatan wajib diisi"),
  photoUrl: z.string().min(1, "URL foto wajib diisi"),
})

const departmentItemSchema = z.object({
  id: z.string().min(1, "ID jurusan wajib diisi"),
  name: z.string().min(1, "Nama jurusan wajib diisi"),
  description: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
})

export const departmentContentSchema = z.object({
  departments: z.array(departmentItemSchema),
})

export const contentSectionSchemas = {
  HERO: heroContentSchema,
  PROFILE: profileContentSchema,
  PRINCIPAL_MESSAGE: principalContentSchema,
  DEPARTMENT: departmentContentSchema,
} as const

export const fileUploadSchema = z.object({
  filename: z.string().min(1, "Nama file wajib diisi"),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    message: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP",
  }),
  size: z
    .number()
    .max(20 * 1024 * 1024, "Ukuran file melebihi 20MB"),
})
