"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import type { ActionResult } from "@/types"
import type { GraduationStudent } from "@prisma/client"
import * as XLSX from "xlsx"

// ============================================
// Types
// ============================================

export interface GraduationSettings {
  tahunAjaran: string
  suratUrl: string
}

// ============================================
// Feature Toggle — Enable/Disable (sidebar visibility)
// ============================================

export async function isGraduationEnabled(): Promise<boolean> {
  const setting = await prisma.siteSettings.findUnique({ where: { key: "kelulusan.enabled" } })
  return setting ? (setting.value as { enabled: boolean }).enabled : false
}

export async function toggleGraduationEnabled(enabled: boolean): Promise<ActionResult<null>> {
  try {
    await requirePermission("menu:manage")
    await prisma.siteSettings.upsert({
      where: { key: "kelulusan.enabled" },
      update: { value: { enabled } },
      create: { key: "kelulusan.enabled", value: { enabled } },
    })
    revalidatePath("/admin")
    revalidatePath("/kelulusan")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Announcement Toggle — Open/Close (public access)
// ============================================

export async function isGraduationActive(): Promise<boolean> {
  const setting = await prisma.siteSettings.findUnique({ where: { key: "kelulusan.active" } })
  return setting ? (setting.value as { active: boolean }).active : false
}

export async function toggleGraduationActive(active: boolean): Promise<ActionResult<null>> {
  try {
    await requirePermission("content:manage")
    await prisma.siteSettings.upsert({
      where: { key: "kelulusan.active" },
      update: { value: { active } },
      create: { key: "kelulusan.active", value: { active } },
    })
    revalidatePath("/admin/kelulusan")
    revalidatePath("/kelulusan")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Graduation Settings (tahunAjaran + suratUrl)
// ============================================

export async function getGraduationSettings(): Promise<GraduationSettings> {
  const setting = await prisma.siteSettings.findUnique({ where: { key: "kelulusan.settings" } })
  if (setting) {
    const val = setting.value as GraduationSettings
    return { tahunAjaran: val.tahunAjaran || "", suratUrl: val.suratUrl || "" }
  }
  return { tahunAjaran: "", suratUrl: "" }
}

export async function updateGraduationSettings(data: GraduationSettings): Promise<ActionResult<null>> {
  try {
    await requirePermission("content:manage")
    await prisma.siteSettings.upsert({
      where: { key: "kelulusan.settings" },
      update: { value: data as any },
      create: { key: "kelulusan.settings", value: data as any },
    })
    revalidatePath("/admin/kelulusan")
    revalidatePath("/kelulusan")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Admin — Get all students
// ============================================

export async function getGraduationStudents(tahunAjaran?: string): Promise<ActionResult<GraduationStudent[]>> {
  try {
    await requirePermission("content:manage")

    const where: Record<string, unknown> = {}
    if (tahunAjaran) where.tahunAjaran = tahunAjaran

    const items = await prisma.graduationStudent.findMany({
      where,
      orderBy: [{ jurusan: "asc" }, { kelas: "asc" }, { namaLengkap: "asc" }],
    })

    return { success: true, data: items }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Admin — Import from Excel
// ============================================

interface ImportRow {
  nis: string
  nisn: string
  namaLengkap: string
  kelas: string
  jurusan: string
  status: string
}

export async function importGraduationStudents(formData: FormData): Promise<ActionResult<{ imported: number; skipped: number }>> {
  try {
    await requirePermission("content:manage")

    const file = formData.get("file") as File | null
    const tahunAjaran = formData.get("tahunAjaran") as string

    if (!file) return { success: false, error: "File Excel wajib diunggah" }
    if (!tahunAjaran?.trim()) return { success: false, error: "Tahun ajaran wajib diisi" }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return { success: false, error: "File Excel tidak memiliki sheet" }

    const sheet = workbook.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    if (rawRows.length === 0) return { success: false, error: "File Excel kosong" }

    // Map column names (case-insensitive, flexible)
    const rows: ImportRow[] = []
    let skipped = 0

    for (const raw of rawRows) {
      const keys = Object.keys(raw)
      const find = (patterns: string[]): string => {
        for (const p of patterns) {
          const key = keys.find((k) => k.toLowerCase().replace(/[\s_-]/g, "").includes(p))
          if (key && raw[key] != null) return String(raw[key]).trim()
        }
        return ""
      }

      const nis = find(["nis"])
      const nisn = find(["nisn"])
      const nama = find(["nama", "namalengkap", "namasiswa"])
      const kelas = find(["kelas"])
      const jurusan = find(["jurusan", "prodi", "program"])
      const statusRaw = find(["status", "kelulusan", "keterangan"])

      // NIS or NISN is required, plus nama
      if ((!nis && !nisn) || !nama) {
        skipped++
        continue
      }

      const status = statusRaw.toUpperCase().includes("TIDAK") ? "TIDAK_LULUS" : "LULUS"

      rows.push({ nis: nis || "-", nisn: nisn || "-", namaLengkap: nama, kelas, jurusan, status })
    }

    if (rows.length === 0) {
      return { success: false, error: `Tidak ada data valid. ${skipped} baris dilewati karena NIS/NISN atau Nama kosong.` }
    }

    // Upsert: if same NIS+tahunAjaran exists, update it
    let imported = 0
    for (const row of rows) {
      // Check existing by NIS + tahunAjaran
      const existing = await prisma.graduationStudent.findFirst({
        where: { nis: row.nis, tahunAjaran },
      })

      if (existing) {
        await prisma.graduationStudent.update({
          where: { id: existing.id },
          data: {
            nisn: row.nisn,
            namaLengkap: row.namaLengkap,
            kelas: row.kelas,
            jurusan: row.jurusan,
            status: row.status as any,
          },
        })
      } else {
        await prisma.graduationStudent.create({
          data: {
            nis: row.nis,
            nisn: row.nisn,
            namaLengkap: row.namaLengkap,
            kelas: row.kelas,
            jurusan: row.jurusan,
            status: row.status as any,
            tahunAjaran,
          },
        })
      }
      imported++
    }

    revalidatePath("/admin/kelulusan")
    return { success: true, data: { imported, skipped } }
  } catch (error) {
    console.error("[importGraduationStudents]", error)
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat mengimpor data" }
  }
}

// ============================================
// Admin — Delete single student
// ============================================

export async function deleteGraduationStudent(id: string): Promise<ActionResult<null>> {
  try {
    await requirePermission("content:manage")
    await prisma.graduationStudent.delete({ where: { id } })
    revalidatePath("/admin/kelulusan")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Admin — Clear all students for a tahunAjaran
// ============================================

export async function clearGraduationStudents(tahunAjaran: string): Promise<ActionResult<{ deleted: number }>> {
  try {
    await requirePermission("content:manage")
    const result = await prisma.graduationStudent.deleteMany({ where: { tahunAjaran } })
    revalidatePath("/admin/kelulusan")
    return { success: true, data: { deleted: result.count } }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Public — Lookup graduation status
// ============================================

export async function lookupGraduation(query: string): Promise<ActionResult<{
  namaLengkap: string
  nis: string
  nisn: string
  kelas: string
  jurusan: string
  status: string
  tahunAjaran: string
} | null>> {
  try {
    if (!query?.trim()) return { success: false, error: "NIS atau NISN wajib diisi" }

    // Check if feature is active
    const activeSetting = await prisma.siteSettings.findUnique({ where: { key: "kelulusan.active" } })
    const isActive = activeSetting ? (activeSetting.value as { active: boolean }).active : false
    if (!isActive) return { success: false, error: "Pengumuman kelulusan belum dibuka" }

    // Get active tahunAjaran
    const settingData = await prisma.siteSettings.findUnique({ where: { key: "kelulusan.settings" } })
    const settings = settingData?.value as GraduationSettings | null
    if (!settings?.tahunAjaran) return { success: false, error: "Tahun ajaran belum dikonfigurasi" }

    const trimmed = query.trim()

    // Search by NIS or NISN
    const student = await prisma.graduationStudent.findFirst({
      where: {
        tahunAjaran: settings.tahunAjaran,
        OR: [
          { nis: trimmed },
          { nisn: trimmed },
        ],
      },
    })

    if (!student) {
      return { success: true, data: null }
    }

    return {
      success: true,
      data: {
        namaLengkap: student.namaLengkap,
        nis: student.nis,
        nisn: student.nisn,
        kelas: student.kelas,
        jurusan: student.jurusan,
        status: student.status,
        tahunAjaran: student.tahunAjaran,
      },
    }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat mencari data" }
  }
}
