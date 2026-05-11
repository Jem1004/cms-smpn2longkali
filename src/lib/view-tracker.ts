/**
 * View Tracker - Cookie-based unique visitor tracking
 * 
 * Tracks article views using httpOnly cookies to identify unique visitors
 * within a 24-hour window. This prevents the same user from inflating
 * view counts by refreshing the page multiple times.
 */

import { cookies } from "next/headers"

const VIEW_COOKIE_PREFIX = "article_viewed_"
const COOKIE_MAX_AGE = 24 * 60 * 60 // 24 hours in seconds

/**
 * Check if the current visitor has already viewed this article
 * within the last 24 hours.
 * 
 * @param slug - Article slug identifier
 * @returns Promise<boolean> - true if already viewed, false otherwise
 */
export async function hasViewedArticle(slug: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const cookieName = `${VIEW_COOKIE_PREFIX}${slug}`
    return cookieStore.has(cookieName)
  } catch (error) {
    // If cookie check fails, assume not viewed (fail open)
    console.error("[hasViewedArticle] Error:", error)
    return false
  }
}

/**
 * Mark an article as viewed by setting a cookie that expires in 24 hours.
 * This cookie is httpOnly for security and uses sameSite=lax for CSRF protection.
 * 
 * @param slug - Article slug identifier
 */
export async function markArticleAsViewed(slug: string): Promise<void> {
  try {
    const cookieStore = await cookies()
    const cookieName = `${VIEW_COOKIE_PREFIX}${slug}`
    
    cookieStore.set(cookieName, "1", {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/", // Available across entire site
    })
  } catch (error) {
    // Silent fail - don't break page if cookie setting fails
    console.error("[markArticleAsViewed] Error:", error)
  }
}
