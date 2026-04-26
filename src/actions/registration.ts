"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import type { ActionResult } from "@/types"
import type { Registration } from "@prisma/client"

const registrationSchema = z.object({
  namaLengkap: z.string().min(1, "Nama lengkap wajib diisi").max(200),
  ttl: z.string().min(1, "Tempat/tanggal lahir wajib diisi").max(200),
  alamat: z.string().min(1, "Alamat wajib diisi").max(500),
  asalSekolah: z.string().min(1, "Asal sekolah wajib diisi").max(200),
  noHp: z.string().min(8, "Nomor HP minimal 8 digit").max(20),
  departmentId: z.string().min(1, "Pilih jurusan"),
})

// ============================================
// Public — Submit Registration
// ============================================

export async function submitRegistration(data: {
  namaLengkap: string
  ttl: string
  alamat: string
  asalSekolah: string
  noHp: string
  departmentId: string
}): Promise<ActionResult<Registration>> {
  try {
    // Check if registration is open
    const spmbSetting = await prisma.siteSettings.findUnique({ where: { key: "spmb.isOpen" } })
    const isOpen = spmbSetting ? (spmbSetting.value as { isOpen: boolean }).isOpen : false
    if (!isOpen) {
      return { success: false, error: "Pendaftaran sedang ditutup" }
    }

    // Check if department is open for registration
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } })
    if (!dept || !dept.isOpenForRegistration) {
      return { success: false, error: "Jurusan yang dipilih tidak tersedia untuk pendaftaran" }
    }

    const validated = registrationSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Validasi gagal", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const registration = await prisma.registration.create({
      data: validated.data,
    })

    revalidatePath("/admin/pendaftaran")
    return { success: true, data: registration }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat mendaftar" }
  }
}

// ============================================
// Public — Get open departments for form
// ============================================

export async function getOpenDepartments(): Promise<{ id: string; name: string }[]> {
  return prisma.department.findMany({
    where: { isOpenForRegistration: true },
    select: { id: true, name: true },
    orderBy: { order: "asc" },
  })
}

// ============================================
// Public — Check if registration is open
// ============================================

export async function isRegistrationOpen(): Promise<boolean> {
  const setting = await prisma.siteSettings.findUnique({ where: { key: "spmb.isOpen" } })
  return setting ? (setting.value as { isOpen: boolean }).isOpen : false
}

// ============================================
// Admin — Get all registrations
// ============================================

export async function getRegistrations(params?: {
  status?: string
  departmentId?: string
}): Promise<ActionResult<(Registration & { department: { name: string } })[]>> {
  try {
    await requirePermission("content:manage")

    const where: Record<string, unknown> = {}
    if (params?.status) where.status = params.status
    if (params?.departmentId) where.departmentId = params.departmentId

    const items = await prisma.registration.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: items }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Admin — Update status
// ============================================

export async function updateRegistrationStatus(
  id: string,
  status: "PENDING" | "DITERIMA" | "DITOLAK"
): Promise<ActionResult<Registration>> {
  try {
    await requirePermission("content:manage")
    const item = await prisma.registration.update({
      where: { id },
      data: { status },
    })
    revalidatePath("/admin/pendaftaran")
    return { success: true, data: item }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Admin — Delete registration
// ============================================

export async function deleteRegistration(id: string): Promise<ActionResult<null>> {
  try {
    await requirePermission("content:manage")
    await prisma.registration.delete({ where: { id } })
    revalidatePath("/admin/pendaftaran")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Admin — Toggle SPMB open/close
// ============================================

export async function toggleSpmb(isOpen: boolean): Promise<ActionResult<null>> {
  try {
    await requirePermission("content:manage")
    await prisma.siteSettings.upsert({
      where: { key: "spmb.isOpen" },
      update: { value: { isOpen } },
      create: { key: "spmb.isOpen", value: { isOpen } },
    })
    revalidatePath("/admin/pendaftaran")
    revalidatePath("/daftar")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Admin — Toggle department registration
// ============================================

export async function toggleDepartmentRegistration(
  id: string,
  isOpen: boolean
): Promise<ActionResult<null>> {
  try {
    await requirePermission("content:manage")
    await prisma.department.update({
      where: { id },
      data: { isOpenForRegistration: isOpen },
    })
    revalidatePath("/admin/pendaftaran")
    revalidatePath("/daftar")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

// ============================================
// Admin — Toggle SPMB feature enabled/disabled
// ============================================

export async function isSpmbEnabled(): Promise<boolean> {
  const setting = await prisma.siteSettings.findUnique({ where: { key: "spmb.enabled" } })
  return setting ? (setting.value as { enabled: boolean }).enabled : false
}

export async function toggleSpmbEnabled(enabled: boolean): Promise<ActionResult<null>> {
  try {
    await requirePermission("menu:manage")
    await prisma.siteSettings.upsert({
      where: { key: "spmb.enabled" },
      update: { value: { enabled } },
      create: { key: "spmb.enabled", value: { enabled } },
    })
    revalidatePath("/admin")
    revalidatePath("/daftar")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}
