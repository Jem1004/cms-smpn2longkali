import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

/**
 * Route-to-allowed-roles mapping based on RBAC permission matrix.
 */
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin/menu": ["SUPER_ADMIN"],
  "/admin/pengguna": ["SUPER_ADMIN"],
  "/admin/pengaturan": ["SUPER_ADMIN"],
  "/admin/konten": ["SUPER_ADMIN", "EDITOR"],
  "/admin/galeri": ["SUPER_ADMIN", "EDITOR"],
  "/admin/guru": ["SUPER_ADMIN", "EDITOR"],
  "/admin/halaman": ["SUPER_ADMIN", "EDITOR"],
  "/admin/pengumuman": ["SUPER_ADMIN", "EDITOR"],
  "/admin/jurusan": ["SUPER_ADMIN", "EDITOR"],
  "/admin/berita": ["SUPER_ADMIN", "EDITOR", "CONTRIBUTOR"],
}

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth

  // Redirect unauthenticated users to login
  if (!session?.user) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = (session.user as { role?: string }).role
  const pathname = nextUrl.pathname

  // Check role-based route permissions
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route) && (!role || !allowedRoles.includes(role))) {
      return NextResponse.rewrite(new URL("/403", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*"],
}
