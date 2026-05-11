/**
 * Route Handler for Article View Tracking
 * 
 * POST /api/views
 * Body: { slug: string }
 * 
 * This Route Handler is used instead of a Server Action because:
 * - cookies().set() can only be called in Route Handlers or Server Actions
 * - Server Actions must be invoked via form submissions or startTransition
 * - A Route Handler allows atomic cookie check + set in a single request
 * - Called from a client component after page render (doesn't block SSR)
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const VIEW_COOKIE_PREFIX = "article_viewed_"
const COOKIE_MAX_AGE = 24 * 60 * 60 // 24 hours in seconds

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slug } = body

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Invalid slug" },
        { status: 400 }
      )
    }

    // Check cookie to determine if this is a unique view
    const cookieStore = await cookies()
    const cookieName = `${VIEW_COOKIE_PREFIX}${slug}`
    const hasViewed = cookieStore.has(cookieName)
    const isUniqueView = !hasViewed

    // Increment view counter in database
    const article = await prisma.article.update({
      where: {
        slug,
        status: "PUBLISHED",
      },
      data: {
        viewCount: { increment: 1 },
        ...(isUniqueView && { uniqueViewCount: { increment: 1 } }),
        lastViewedAt: new Date(),
      },
      select: {
        viewCount: true,
        uniqueViewCount: true,
      },
    })

    // Set cookie to mark as viewed (if this is a new unique view)
    if (isUniqueView) {
      cookieStore.set(cookieName, "1", {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      })
    }

    return NextResponse.json({
      success: true,
      viewCount: article.viewCount,
      uniqueViewCount: article.uniqueViewCount,
      isUniqueView,
    })
  } catch (error) {
    // Don't expose internal errors - view tracking is non-critical
    console.error("[api/views] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to track view" },
      { status: 500 }
    )
  }
}
