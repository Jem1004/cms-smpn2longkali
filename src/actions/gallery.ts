"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import { galleryImageSchema } from "@/lib/validators"
import { deleteS3Object } from "@/lib/s3"
import type { ActionResult } from "@/types"
import type { GalleryImage } from "@prisma/client"

// ============================================
// Gallery CRUD
// ============================================

/**
 * Get all gallery images ordered by their display order.
 */
export async function getGalleryImages(): Promise<ActionResult<GalleryImage[]>> {
  try {
    await requirePermission("gallery:manage")

    const images = await prisma.galleryImage.findMany({
      orderBy: { order: "asc" },
    })

    return { success: true, data: images }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat mengambil galeri" }
  }
}

/**
 * Add multiple gallery images in a single batch operation.
 * Each image is validated against galleryImageSchema.
 * Order is assigned based on current max order + index.
 */
export async function addGalleryImages(
  images: { title: string; description?: string; imageUrl: string }[]
): Promise<ActionResult<GalleryImage[]>> {
  try {
    await requirePermission("gallery:manage")

    if (!images || images.length === 0) {
      return { success: false, error: "Minimal satu gambar harus diunggah" }
    }

    // Get current max order
    const maxOrderResult = await prisma.galleryImage.aggregate({
      _max: { order: true },
    })
    const currentMaxOrder = maxOrderResult._max.order ?? -1

    // Validate each image
    const validatedImages = []
    for (let i = 0; i < images.length; i++) {
      const order = currentMaxOrder + 1 + i
      const validated = galleryImageSchema.safeParse({
        title: images[i].title,
        description: images[i].description,
        imageUrl: images[i].imageUrl,
        order,
      })

      if (!validated.success) {
        return {
          success: false,
          error: `Validasi gagal untuk gambar ke-${i + 1}`,
          fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
        }
      }

      validatedImages.push(validated.data)
    }

    // Batch insert
    const created = await prisma.$transaction(
      validatedImages.map((img) =>
        prisma.galleryImage.create({
          data: {
            title: img.title,
            description: img.description ?? null,
            imageUrl: img.imageUrl,
            order: img.order,
          },
        })
      )
    )

    revalidatePath("/admin/galeri")
    revalidatePath("/")
    revalidateTag("gallery")

    return { success: true, data: created }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat menambahkan gambar" }
  }
}

/**
 * Reorder gallery images by updating each item's order to its index in the array.
 * Uses a transaction to ensure atomicity.
 */
export async function reorderGalleryImages(
  orderedIds: string[]
): Promise<ActionResult<null>> {
  try {
    await requirePermission("gallery:manage")

    if (!orderedIds || orderedIds.length === 0) {
      return { success: false, error: "Daftar ID tidak boleh kosong" }
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.galleryImage.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    revalidatePath("/admin/galeri")
    revalidatePath("/")
    revalidateTag("gallery")

    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat mengatur ulang urutan" }
  }
}

/**
 * Delete a gallery image. Removes metadata from DB and file from S3.
 * Extracts the S3 key from the imageUrl (everything after the bucket domain).
 */
export async function deleteGalleryImage(id: string): Promise<ActionResult<null>> {
  try {
    await requirePermission("gallery:manage")

    const image = await prisma.galleryImage.findUnique({ where: { id } })
    if (!image) return { success: false, error: "Gambar tidak ditemukan" }

    try {
      const url = new URL(image.imageUrl)
      await deleteS3Object(url.pathname.slice(1))
    } catch {
      console.error("Gagal menghapus file dari S3")
    }

    await prisma.galleryImage.delete({ where: { id } })
    revalidatePath("/admin/galeri")
    revalidatePath("/")
    revalidateTag("gallery")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat menghapus gambar" }
  }
}
