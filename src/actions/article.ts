"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import { articleSchema } from "@/lib/validators"
import type { ActionResult, ArticleFilter, PaginatedResult } from "@/types"
import type { Article } from "@prisma/client"

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

export async function getArticles(
  params: ArticleFilter = {}
): Promise<ActionResult<PaginatedResult<Article>>> {
  try {
    await requirePermission("article:create")
    const { search, categoryId, status, page = 1, pageSize = 10 } = params
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId
    if (search) where.title = { contains: search, mode: "insensitive" }

    const [data, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: { select: { id: true, name: true } }, category: true },
      }),
      prisma.article.count({ where }),
    ])

    return {
      success: true,
      data: { data: data as Article[], total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat mengambil artikel" }
  }
}

export async function getArticleById(id: string): Promise<ActionResult<Article | null>> {
  try {
    await requirePermission("article:create")
    const article = await prisma.article.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true } }, category: true },
    })
    return { success: true, data: article as Article | null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat mengambil artikel" }
  }
}

export async function createArticle(data: {
  title: string
  content: string
  slug?: string
  categoryId?: string
  thumbnailUrl?: string
  metaTitle?: string
  metaDesc?: string
  status?: "DRAFT" | "PUBLISHED"
}): Promise<ActionResult<Article>> {
  try {
    const session = await requirePermission("article:create")
    const slug = data.slug || generateSlug(data.title)
    const validated = articleSchema.safeParse({ title: data.title, content: data.content, slug, categoryId: data.categoryId, thumbnailUrl: data.thumbnailUrl })

    if (!validated.success) {
      return { success: false, error: "Validasi gagal", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const articleStatus = session.user.role === "CONTRIBUTOR" ? "DRAFT" : (data.status ?? "DRAFT")
    const article = await prisma.article.create({
      data: {
        title: validated.data.title,
        content: validated.data.content,
        slug: validated.data.slug,
        thumbnailUrl: validated.data.thumbnailUrl ?? null,
        metaTitle: data.metaTitle || null,
        metaDesc: data.metaDesc || null,
        status: articleStatus,
        authorId: session.user.id,
        categoryId: validated.data.categoryId ?? null,
        publishedAt: articleStatus === "PUBLISHED" ? new Date() : null,
      },
    })

    revalidatePath("/admin/berita")
    revalidatePath("/")
    return { success: true, data: article }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) return { success: false, error: "Slug artikel sudah digunakan" }
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat membuat artikel" }
  }
}

export async function updateArticle(id: string, data: {
  title: string
  content: string
  slug?: string
  categoryId?: string
  thumbnailUrl?: string
  metaTitle?: string
  metaDesc?: string
}): Promise<ActionResult<Article>> {
  try {
    await requirePermission("article:edit")
    const slug = data.slug || generateSlug(data.title)
    const validated = articleSchema.safeParse({ title: data.title, content: data.content, slug, categoryId: data.categoryId, thumbnailUrl: data.thumbnailUrl })

    if (!validated.success) {
      return { success: false, error: "Validasi gagal", fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: validated.data.title,
        content: validated.data.content,
        slug: validated.data.slug,
        thumbnailUrl: validated.data.thumbnailUrl ?? null,
        metaTitle: data.metaTitle || null,
        metaDesc: data.metaDesc || null,
        categoryId: validated.data.categoryId ?? null,
      },
    })

    revalidatePath("/admin/berita")
    revalidatePath("/")
    return { success: true, data: article }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) return { success: false, error: "Slug artikel sudah digunakan" }
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat memperbarui artikel" }
  }
}

export async function publishArticle(id: string): Promise<ActionResult<Article>> {
  try {
    await requirePermission("article:publish")
    const article = await prisma.article.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    })
    revalidatePath("/admin/berita")
    revalidatePath("/")
    return { success: true, data: article }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat mempublikasikan artikel" }
  }
}

export async function deleteArticle(id: string): Promise<ActionResult<null>> {
  try {
    await requirePermission("article:delete")
    await prisma.article.delete({ where: { id } })
    revalidatePath("/admin/berita")
    revalidatePath("/")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat menghapus artikel" }
  }
}

export async function getCategories(): Promise<ActionResult<{ id: string; name: string; slug: string }[]>> {
  try {
    await requirePermission("article:create")
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })
    return { success: true, data: categories }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat mengambil kategori" }
  }
}
