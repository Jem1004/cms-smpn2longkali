"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/rbac"
import { userSchema } from "@/lib/validators"
import type { ActionResult } from "@/types"

// ============================================
// Types
// ============================================

type UserWithoutPassword = {
  id: string
  name: string
  email: string
  role: "SUPER_ADMIN" | "EDITOR" | "CONTRIBUTOR"
  isActive: boolean
  createdAt: Date
}

const SALT_ROUNDS = 12

// ============================================
// Helpers
// ============================================

function generateTemporaryPassword(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// ============================================
// User Management Actions
// ============================================

/**
 * Get all users without password field, ordered by createdAt desc.
 */
export async function getUsers(): Promise<ActionResult<UserWithoutPassword[]>> {
  try {
    await requirePermission("user:manage")

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: users }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat mengambil data pengguna" }
  }
}

/**
 * Create a new user. Validates input, hashes password with bcrypt, and saves to DB.
 * Returns the created user without the password field.
 */
export async function createUser(
  data: { name: string; email: string; password: string; role: string }
): Promise<ActionResult<UserWithoutPassword>> {
  try {
    await requirePermission("user:manage")

    const validated = userSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        error: "Validasi gagal",
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const hashedPassword = await bcrypt.hash(validated.data.password, SALT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: hashedPassword,
        role: validated.data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    revalidatePath("/admin/pengguna")

    return { success: true, data: user }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return { success: false, error: "Email sudah terdaftar" }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat membuat pengguna" }
  }
}

/**
 * Deactivate a user by setting isActive=false.
 * Rejects if this is the last active SUPER_ADMIN.
 */
export async function deactivateUser(
  id: string
): Promise<ActionResult<null>> {
  try {
    await requirePermission("user:manage")

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" }
    }

    // Check if this is the last active Super Admin
    if (user.role === "SUPER_ADMIN") {
      const activeSuperAdminCount = await prisma.user.count({
        where: { role: "SUPER_ADMIN", isActive: true },
      })

      if (activeSuperAdminCount <= 1) {
        return {
          success: false,
          error: "Tidak dapat menonaktifkan akun Super Admin terakhir",
        }
      }
    }

    await prisma.user.update({ where: { id }, data: { isActive: false } })

    revalidatePath("/admin/pengguna")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat menonaktifkan pengguna" }
  }
}

/**
 * Reset a user's password. Generates a random temporary password,
 * hashes it, and saves to DB. Returns the temporary password so
 * it can be shown to the admin.
 */
export async function resetPassword(
  id: string
): Promise<ActionResult<{ temporaryPassword: string }>> {
  try {
    await requirePermission("user:manage")

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" }
    }

    const temporaryPassword = generateTemporaryPassword()
    const hashedPassword = await bcrypt.hash(temporaryPassword, SALT_ROUNDS)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    revalidatePath("/admin/pengguna")

    return { success: true, data: { temporaryPassword } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Terjadi kesalahan saat mereset password" }
  }
}

/**
 * Delete a user permanently.
 * Rejects if this is the last active SUPER_ADMIN.
 * Rejects if user has articles (must reassign first).
 */
export async function deleteUser(id: string): Promise<ActionResult<null>> {
  try {
    await requirePermission("user:manage")

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" }
    }

    // Prevent deleting last Super Admin
    if (user.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: { role: "SUPER_ADMIN" },
      })
      if (superAdminCount <= 1) {
        return { success: false, error: "Tidak dapat menghapus Super Admin terakhir" }
      }
    }

    // Check if user has articles
    const articleCount = await prisma.article.count({ where: { authorId: id } })
    if (articleCount > 0) {
      return {
        success: false,
        error: `Pengguna memiliki ${articleCount} artikel. Nonaktifkan saja atau hapus artikel terlebih dahulu.`,
      }
    }

    await prisma.user.delete({ where: { id } })

    revalidatePath("/admin/pengguna")
    return { success: true, data: null }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Terjadi kesalahan saat menghapus pengguna" }
  }
}
