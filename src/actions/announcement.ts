"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import type { ActionResult } from "@/types"
import type { Announcement } from "@prisma/client"

const announcementSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  content: z.string().optional(),
  type: z.enum(["INFO", "WARNING", "SUCCESS"]).default("INFO"),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
})

export async function getAnnouncements(): Promise<ActionResult<Announcement[]>> {
  try {
    await requirePermission("content:manage")
    const items = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    })
    return { success: true, data: items }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const now = new Date()
  return prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAllPublicAnnouncements(): Promise<Announcement[]> {
  const now = new Date()
  return prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function createAnnouncement(data: {
  title: string
  content?: string
  type?: "INFO" | "WARNING" | "SUCCESS"
  isActive?: boolean
  expiresAt?: string | null
}): Promise<ActionResult<Announcement>> {
  try {
    await requirePermission("content:manage")
    const validated = announcementSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Validasi gagal", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }
    const item = await prisma.announcement.create({
      data: {
        title: validated.data.title,
        content: validated.data.content,
        type: validated.data.type,
        isActive: validated.data.isActive,
        expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : null,
      },
    })
    revalidatePath("/admin/pengumuman")
    revalidatePath("/")
    revalidatePath("/pengumuman")
    revalidateTag("announcements")
    return { success: true, data: item }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

export async function updateAnnouncement(
  id: string,
  data: { title: string; content?: string; type?: "INFO" | "WARNING" | "SUCCESS"; isActive?: boolean; expiresAt?: string | null }
): Promise<ActionResult<Announcement>> {
  try {
    await requirePermission("content:manage")
    const validated = announcementSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Validasi gagal", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }
    const item = await prisma.announcement.update({
      where: { id },
      data: {
        title: validated.data.title,
        content: validated.data.content,
        type: validated.data.type,
        isActive: validated.data.isActive,
        expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : null,
      },
    })
    revalidatePath("/admin/pengumuman")
    revalidatePath("/")
    revalidatePath("/pengumuman")
    revalidateTag("announcements")
    return { success: true, data: item }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

export async function deleteAnnouncement(id: string): Promise<ActionResult<null>> {
  try {
    await requirePermission("content:manage")
    await prisma.announcement.delete({ where: { id } })
    revalidatePath("/admin/pengumuman")
    revalidatePath("/")
    revalidatePath("/pengumuman")
    revalidateTag("announcements")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

export async function toggleAnnouncement(id: string, isActive: boolean): Promise<ActionResult<Announcement>> {
  try {
    await requirePermission("content:manage")
    const item = await prisma.announcement.update({ where: { id }, data: { isActive } })
    revalidatePath("/admin/pengumuman")
    revalidatePath("/")
    revalidatePath("/pengumuman")
    revalidateTag("announcements")
    return { success: true, data: item }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}
