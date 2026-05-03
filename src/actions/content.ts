"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import { contentSectionSchemas } from "@/lib/validators"
import type { ActionResult, HeroContent, ProfileContent, PrincipalContent, DepartmentContent } from "@/types"
import type { ContentSection } from "@prisma/client"

type ContentTypeMap = {
  HERO: HeroContent
  PROFILE: ProfileContent
  PRINCIPAL_MESSAGE: PrincipalContent
  DEPARTMENT: DepartmentContent
}

/**
 * Retrieve institutional content for a given section.
 * Returns the content JSON or null if no record exists.
 */
export async function getInstitutionalContent<S extends ContentSection>(
  section: S
): Promise<ActionResult<ContentTypeMap[S] | null>> {
  try {
    await requirePermission("content:manage")

    const record = await prisma.institutionalContent.findUnique({
      where: { section },
    })

    if (!record) {
      return { success: true, data: null }
    }

    return { success: true, data: record.content as ContentTypeMap[S] }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat mengambil konten" }
  }
}

/**
 * Upsert institutional content for a given section.
 * Validates the content JSON against the section-specific Zod schema.
 */
export async function updateInstitutionalContent<S extends ContentSection>(
  section: S,
  content: ContentTypeMap[S]
): Promise<ActionResult<ContentTypeMap[S]>> {
  try {
    await requirePermission("content:manage")

    // Validate content against section-specific schema
    const schema = contentSectionSchemas[section]
    const parsed = schema.safeParse(content)

    if (!parsed.success) {
      return {
        success: false,
        error: "Validasi konten gagal",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const record = await prisma.institutionalContent.upsert({
      where: { section },
      update: { content: parsed.data as Record<string, unknown> },
      create: { section, content: parsed.data as Record<string, unknown> },
    })

    revalidatePath("/")
    revalidatePath("/admin/konten")

    // Invalidate the specific content cache
    const tagMap: Record<string, string> = {
      HERO: "content-hero",
      PROFILE: "content-profile",
      PRINCIPAL_MESSAGE: "content-principal",
    }
    if (tagMap[section]) revalidateTag(tagMap[section])

    return { success: true, data: record.content as ContentTypeMap[S] }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat menyimpan konten. Silakan coba lagi." }
  }
}
