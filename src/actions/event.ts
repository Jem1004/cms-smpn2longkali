"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import type { ActionResult } from "@/types"
import type { SchoolEvent } from "@prisma/client"

const eventSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().optional().nullable(),
})

export async function getEvents(): Promise<ActionResult<SchoolEvent[]>> {
  try {
    await requirePermission("content:manage")
    const items = await prisma.schoolEvent.findMany({
      orderBy: { startDate: "asc" },
    })
    return { success: true, data: items }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

export async function getUpcomingEvents(): Promise<SchoolEvent[]> {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return prisma.schoolEvent.findMany({
    where: {
      OR: [
        { startDate: { gte: now } },
        { endDate: { gte: now } },
      ],
    },
    orderBy: { startDate: "asc" },
    take: 5,
  })
}

export async function getAllPublicEvents(): Promise<SchoolEvent[]> {
  return prisma.schoolEvent.findMany({
    orderBy: { startDate: "asc" },
  })
}

export async function createEvent(data: {
  title: string
  description?: string
  location?: string
  startDate: string
  endDate?: string | null
}): Promise<ActionResult<SchoolEvent>> {
  try {
    await requirePermission("content:manage")
    const validated = eventSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Validasi gagal", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }
    const item = await prisma.schoolEvent.create({
      data: {
        title: validated.data.title,
        description: validated.data.description,
        location: validated.data.location,
        startDate: new Date(validated.data.startDate),
        endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
      },
    })
    revalidatePath("/admin/agenda")
    revalidatePath("/")
    revalidateTag("events")
    return { success: true, data: item }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

export async function updateEvent(
  id: string,
  data: { title: string; description?: string; location?: string; startDate: string; endDate?: string | null }
): Promise<ActionResult<SchoolEvent>> {
  try {
    await requirePermission("content:manage")
    const validated = eventSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Validasi gagal", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }
    const item = await prisma.schoolEvent.update({
      where: { id },
      data: {
        title: validated.data.title,
        description: validated.data.description,
        location: validated.data.location,
        startDate: new Date(validated.data.startDate),
        endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
      },
    })
    revalidatePath("/admin/agenda")
    revalidatePath("/")
    revalidateTag("events")
    return { success: true, data: item }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}

export async function deleteEvent(id: string): Promise<ActionResult<null>> {
  try {
    await requirePermission("content:manage")
    await prisma.schoolEvent.delete({ where: { id } })
    revalidatePath("/admin/agenda")
    revalidatePath("/")
    revalidateTag("events")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan" }
  }
}
