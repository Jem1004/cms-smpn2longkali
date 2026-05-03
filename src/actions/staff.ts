"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import { staffSchema } from "@/lib/validators"
import { deleteS3Object } from "@/lib/s3"
import type { ActionResult } from "@/types"
import type { Staff } from "@prisma/client"

export async function getStaffList(): Promise<ActionResult<Staff[]>> {
  try {
    await requirePermission("staff:manage")
    const staff = await prisma.staff.findMany({ orderBy: { order: "asc" } })
    return { success: true, data: staff }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat mengambil data guru" }
  }
}

export async function createStaff(data: { name: string; position: string; photoUrl?: string }): Promise<ActionResult<Staff>> {
  try {
    await requirePermission("staff:manage")
    const maxOrderResult = await prisma.staff.aggregate({ _max: { order: true } })
    const nextOrder = (maxOrderResult._max.order ?? -1) + 1
    const validated = staffSchema.safeParse({ name: data.name, position: data.position, photoUrl: data.photoUrl, order: nextOrder })

    if (!validated.success) {
      return { success: false, error: "Validasi gagal", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const staff = await prisma.staff.create({
      data: { name: validated.data.name, position: validated.data.position, photoUrl: validated.data.photoUrl ?? null, order: validated.data.order },
    })

    revalidatePath("/admin/guru")
    revalidatePath("/")
    revalidateTag("staff")
    return { success: true, data: staff }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat menambahkan data guru" }
  }
}

export async function updateStaff(id: string, data: { name: string; position: string; photoUrl?: string; order?: number }): Promise<ActionResult<Staff>> {
  try {
    await requirePermission("staff:manage")
    const existing = await prisma.staff.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Data guru tidak ditemukan" }

    const validated = staffSchema.safeParse({ name: data.name, position: data.position, photoUrl: data.photoUrl, order: data.order ?? existing.order })
    if (!validated.success) {
      return { success: false, error: "Validasi gagal", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: { name: validated.data.name, position: validated.data.position, photoUrl: validated.data.photoUrl ?? null, order: validated.data.order },
    })

    revalidatePath("/admin/guru")
    revalidatePath("/")
    revalidateTag("staff")
    return { success: true, data: staff }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat memperbarui data guru" }
  }
}

export async function deleteStaff(id: string): Promise<ActionResult<null>> {
  try {
    await requirePermission("staff:manage")
    const staff = await prisma.staff.findUnique({ where: { id } })
    if (!staff) return { success: false, error: "Data guru tidak ditemukan" }

    if (staff.photoUrl) {
      try {
        const url = new URL(staff.photoUrl)
        await deleteS3Object(url.pathname.slice(1))
      } catch {
        console.error("Gagal menghapus foto dari S3")
      }
    }

    await prisma.staff.delete({ where: { id } })
    revalidatePath("/admin/guru")
    revalidatePath("/")
    revalidateTag("staff")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat menghapus data guru" }
  }
}
