import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import type { MenuItemWithChildren } from "@/types"
import type { SiteSettings, SiteIdentity, SiteContact, SiteSocial, SiteFooter } from "@/types"

// ============================================
// Cached Public Queries
// ============================================
// All public-facing data is cached with unstable_cache to:
// 1. Avoid hitting Neon DB on every request (saves compute)
// 2. Eliminate cold-start delays when Neon auto-suspends
// 3. Serve pages from Vercel's edge cache instantly
//
// Each cache entry has a tag so it can be invalidated
// when admin updates data via server actions.
// ============================================

// ─── Menu Items ──────────────────────────────────────────────

async function fetchPublicMenuItems(): Promise<MenuItemWithChildren[]> {
  const items = await prisma.menuItem.findMany({
    where: { parentId: null },
    include: {
      children: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  return items.map((item) => ({
    id: item.id,
    label: item.label,
    url: item.url,
    type: item.type,
    parentId: item.parentId,
    order: item.order,
    isHighlighted: item.isHighlighted,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    children: item.children.map((child) => ({
      id: child.id,
      label: child.label,
      url: child.url,
      type: child.type,
      parentId: child.parentId,
      order: child.order,
      isHighlighted: child.isHighlighted,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
      children: [],
    })),
  }))
}

export const getPublicMenuItems = unstable_cache(
  fetchPublicMenuItems,
  ["public-menu-items"],
  { tags: ["menu-items"], revalidate: 3600 }
)

// ─── Site Settings ───────────────────────────────────────────

const DEFAULT_IDENTITY: SiteIdentity = {
  name: "SMKN 1 Surabaya",
  shortName: "SMKN 1",
  tagline: "Surabaya",
  description: "SMK Negeri 1 Surabaya adalah sekolah menengah kejuruan unggulan yang berkomitmen mencetak lulusan berkompeten dan siap kerja.",
  logoUrl: "",
  faviconUrl: "",
}

const DEFAULT_CONTACT: SiteContact = {
  address: "Jl. SMKN 1 Surabaya, Kota Surabaya, Jawa Timur",
  phone: "(031) 1234567",
  email: "info@smkn1surabaya.sch.id",
  mapsEmbedUrl: "",
  whatsapp: "",
}

const DEFAULT_SOCIAL: SiteSocial = {
  facebook: "",
  instagram: "",
  youtube: "",
  tiktok: "",
}

const DEFAULT_FOOTER: SiteFooter = {
  links: [],
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  const records = await prisma.siteSettings.findMany({
    where: {
      key: {
        in: ["site.identity", "site.contact", "site.social", "site.footer"]
      }
    }
  })

  const settingsMap = new Map<string, unknown>()
  for (const record of records) {
    settingsMap.set(record.key, record.value)
  }

  return {
    identity: (settingsMap.get("site.identity") as SiteIdentity) ?? DEFAULT_IDENTITY,
    contact: (settingsMap.get("site.contact") as SiteContact) ?? DEFAULT_CONTACT,
    social: (settingsMap.get("site.social") as SiteSocial) ?? DEFAULT_SOCIAL,
    footer: (settingsMap.get("site.footer") as SiteFooter) ?? DEFAULT_FOOTER,
  }
}

/**
 * Get site settings with Next.js caching.
 * Cache is revalidated when settings are updated via admin.
 */
export const getSiteSettings = unstable_cache(
  fetchSiteSettings,
  ["site-settings"],
  { tags: ["site-settings"], revalidate: 3600 }
)

// ─── Hero Content ────────────────────────────────────────────

async function fetchHeroContent() {
  return prisma.institutionalContent.findUnique({
    where: { section: "HERO" },
  })
}

export const getHeroContent = unstable_cache(
  fetchHeroContent,
  ["hero-content"],
  { tags: ["content-hero"], revalidate: 3600 }
)

// ─── Profile Content ─────────────────────────────────────────

async function fetchProfileContent() {
  return prisma.institutionalContent.findUnique({
    where: { section: "PROFILE" },
  })
}

export const getProfileContent = unstable_cache(
  fetchProfileContent,
  ["profile-content"],
  { tags: ["content-profile"], revalidate: 3600 }
)

// ─── Principal Message ──────────────────────────────────────

async function fetchPrincipalContent() {
  return prisma.institutionalContent.findUnique({
    where: { section: "PRINCIPAL_MESSAGE" },
  })
}

export const getPrincipalContent = unstable_cache(
  fetchPrincipalContent,
  ["principal-content"],
  { tags: ["content-principal"], revalidate: 3600 }
)

// ─── Staff List ──────────────────────────────────────────────

async function fetchPublicStaff() {
  const staff = await prisma.staff.findMany({
    orderBy: { order: "asc" },
  })
  return staff.map((s) => ({
    id: s.id,
    name: s.name,
    position: s.position,
    photoUrl: s.photoUrl,
  }))
}

export const getPublicStaff = unstable_cache(
  fetchPublicStaff,
  ["public-staff"],
  { tags: ["staff"], revalidate: 3600 }
)

// ─── Gallery Images ─────────────────────────────────────────

async function fetchPublicGallery() {
  return prisma.galleryImage.findMany({
    orderBy: { order: "asc" },
    take: 8,
  })
}

export const getPublicGallery = unstable_cache(
  fetchPublicGallery,
  ["public-gallery"],
  { tags: ["gallery"], revalidate: 3600 }
)

// ─── Latest Articles ────────────────────────────────────────

async function fetchLatestArticles() {
  return prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnailUrl: true,
      publishedAt: true,
      category: { select: { name: true } },
    },
  })
}

export const getLatestArticles = unstable_cache(
  fetchLatestArticles,
  ["latest-articles"],
  { tags: ["articles"], revalidate: 3600 }
)

// ─── Active Announcements ───────────────────────────────────

async function fetchActiveAnnouncements() {
  const now = new Date()
  return prisma.announcement.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  })
}

export const getActiveAnnouncementsCached = unstable_cache(
  fetchActiveAnnouncements,
  ["active-announcements"],
  { tags: ["announcements"], revalidate: 300 } // 5 min — announcements change more often
)

// ─── Upcoming Events ────────────────────────────────────────

async function fetchUpcomingEvents() {
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

export const getUpcomingEventsCached = unstable_cache(
  fetchUpcomingEvents,
  ["upcoming-events"],
  { tags: ["events"], revalidate: 300 } // 5 min — events have time sensitivity
)

