"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import { menuItemSchema } from "@/lib/validators"
import type { ActionResult, MenuItemForm, MenuItemWithChildren } from "@/types"

function mapItem(item: {
  id: string; label: string; url: string; type: string
  parentId: string | null; order: number; isHighlighted: boolean
  createdAt: Date; updatedAt: Date
}, children: MenuItemWithChildren[] = []): MenuItemWithChildren {
  return {
    id: item.id,
    label: item.label,
    url: item.url,
    type: item.type as "INTERNAL" | "EXTERNAL",
    parentId: item.parentId,
    order: item.order,
    isHighlighted: item.isHighlighted,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    children,
  }
}

export async function getPublicMenuItems(): Promise<MenuItemWithChildren[]> {
  const items = await prisma.menuItem.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  })
  return items.map((item) => mapItem(item, item.children.map((c) => mapItem(c))))
}

export async function getMenuItems(): Promise<ActionResult<MenuItemWithChildren[]>> {
  try {
    await requirePermission("menu:manage")
    const items = await prisma.menuItem.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    })
    return { success: true, data: items.map((item) => mapItem(item, item.children.map((c) => mapItem(c)))) }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat mengambil data menu" }
  }
}

export async function saveMenuItems(items: MenuItemForm[]): Promise<ActionResult<MenuItemWithChildren[]>> {
  try {
    await requirePermission("menu:manage")

    for (const item of items) {
      const result = menuItemSchema.safeParse(item)
      if (!result.success) {
        return { success: false, error: "Validasi gagal", fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
      }
    }

    const parents = items.filter((i) => i.parentId === null)
    const children = items.filter((i) => i.parentId !== null)

    const result = await prisma.$transaction(async (tx) => {
      await tx.menuItem.deleteMany({})

      const indexToNewId = new Map<number, string>()

      for (const parent of parents) {
        const created = await tx.menuItem.create({
          data: {
            label: parent.label,
            url: parent.url,
            type: parent.type,
            order: parent.order,
            isHighlighted: parent.isHighlighted ?? false,
            parentId: null,
          },
        })
        indexToNewId.set(parent.order, created.id)
      }

      for (const child of children) {
        const parentRef = child.parentId!
        const parentIdx = parseInt(parentRef.replace("__idx__", ""), 10)
        const newParentId = indexToNewId.get(parentIdx)
        if (!newParentId) throw new Error(`Gagal memetakan parent untuk item "${child.label}"`)
        await tx.menuItem.create({
          data: {
            label: child.label,
            url: child.url,
            type: child.type,
            order: child.order,
            isHighlighted: child.isHighlighted ?? false,
            parentId: newParentId,
          },
        })
      }

      const created = await tx.menuItem.findMany({
        where: { parentId: null },
        include: { children: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      })

      return {
        success: true as const,
        data: created.map((item) => mapItem(item, item.children.map((c) => mapItem(c)))) as MenuItemWithChildren[],
      }
    })

    if (!result.success) return result
    revalidatePath("/admin/menu")
    revalidatePath("/")
    return { success: true, data: result.data }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat menyimpan menu" }
  }
}

export async function deleteMenuItem(id: string): Promise<ActionResult<null>> {
  try {
    await requirePermission("menu:manage")
    await prisma.menuItem.delete({ where: { id } })
    revalidatePath("/admin/menu")
    revalidatePath("/")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat menghapus menu item" }
  }
}
