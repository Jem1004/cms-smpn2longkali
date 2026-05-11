"use client"

import { useEffect } from "react"

/**
 * Client component that tracks article views after page render.
 * 
 * Uses a Route Handler (/api/views) instead of a Server Action because
 * cookies().set() is not allowed during Server Component rendering.
 * 
 * This component:
 * - Fires a POST request after mount (doesn't block SSR/page load)
 * - The Route Handler handles both cookie checking and setting atomically
 * - Silently fails if tracking fails (non-critical functionality)
 */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Fire-and-forget: track the view after page renders
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {
      // Silent fail - view tracking is not critical
    })
  }, [slug])

  // This component renders nothing
  return null
}
