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
//
// IMPORTANT: unstable_cache uses JSON.stringify internally.
// Date objects become strings after serialization. All fetch
// functions MUST convert Dates to ISO strings before returning,
// so data types are consistent on both cache-miss and cache-hit.
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
  try {
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
  } catch (error) {
    console.error("[fetchSiteSettings] Error:", error)
    return {
      identity: DEFAULT_IDENTITY,
      contact: DEFAULT_CONTACT,
      social: DEFAULT_SOCIAL,
      footer: DEFAULT_FOOTER,
    }
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
  try {
    const record = await prisma.institutionalContent.findUnique({
      where: { section: "HERO" },
    })
    if (!record) return null
    // Convert Date to string for safe serialization
    return {
      ...record,
      updatedAt: record.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error("[fetchHeroContent] Error:", error)
    return null
  }
}

export const getHeroContent = unstable_cache(
  fetchHeroContent,
  ["hero-content"],
  { tags: ["content-hero"], revalidate: 3600 }
)

// ─── Profile Content ─────────────────────────────────────────

async function fetchProfileContent() {
  try {
    const record = await prisma.institutionalContent.findUnique({
      where: { section: "PROFILE" },
    })
    if (!record) return null
    // Convert Date to string for safe serialization
    return {
      ...record,
      updatedAt: record.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error("[fetchProfileContent] Error:", error)
    return null
  }
}

export const getProfileContent = unstable_cache(
  fetchProfileContent,
  ["profile-content"],
  { tags: ["content-profile"], revalidate: 3600 }
)

// ─── Principal Message ──────────────────────────────────────

async function fetchPrincipalContent() {
  try {
    const record = await prisma.institutionalContent.findUnique({
      where: { section: "PRINCIPAL_MESSAGE" },
    })
    if (!record) return null
    // Convert Date to string for safe serialization
    return {
      ...record,
      updatedAt: record.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error("[fetchPrincipalContent] Error:", error)
    return null
  }
}

export const getPrincipalContent = unstable_cache(
  fetchPrincipalContent,
  ["principal-content"],
  { tags: ["content-principal"], revalidate: 3600 }
)

// ─── Staff List ──────────────────────────────────────────────

async function fetchPublicStaff() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { order: "asc" },
    })
    return staff.map((s) => ({
      id: s.id,
      name: s.name,
      position: s.position,
      photoUrl: s.photoUrl,
    }))
  } catch (error) {
    console.error("[fetchPublicStaff] Error:", error)
    return []
  }
}

export const getPublicStaff = unstable_cache(
  fetchPublicStaff,
  ["public-staff"],
  { tags: ["staff"], revalidate: 3600 }
)

// ─── Gallery Images ─────────────────────────────────────────

async function fetchPublicGallery() {
  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { order: "asc" },
      take: 8,
    })
    // Convert Date fields to strings for safe serialization
    return images.map((img) => ({
      id: img.id,
      title: img.title,
      description: img.description,
      imageUrl: img.imageUrl,
      order: img.order,
      createdAt: img.createdAt.toISOString(),
      updatedAt: img.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error("[fetchPublicGallery] Error:", error)
    return []
  }
}

export const getPublicGallery = unstable_cache(
  fetchPublicGallery,
  ["public-gallery"],
  { tags: ["gallery"], revalidate: 3600 }
)

// ─── Latest Articles ────────────────────────────────────────

async function fetchLatestArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        publishedAt: true,
        content: true,
        metaDesc: true,
        category: { select: { name: true } },
      },
    })
    // Convert Date fields to strings for safe serialization
    return articles.map((a) => ({
      ...a,
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    }))
  } catch (error) {
    console.error("[fetchLatestArticles] Error:", error)
    return []
  }
}

export const getLatestArticles = unstable_cache(
  fetchLatestArticles,
  ["latest-articles"],
  { tags: ["articles"], revalidate: 3600 }
)

// ─── Active Announcements ───────────────────────────────────

async function fetchActiveAnnouncements() {
  try {
    const now = new Date()
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    })
    // Convert Date fields to strings for safe serialization
    return announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      isActive: a.isActive,
      expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error("[fetchActiveAnnouncements] Error:", error)
    return []
  }
}

export const getActiveAnnouncementsCached = unstable_cache(
  fetchActiveAnnouncements,
  ["active-announcements"],
  { tags: ["announcements"], revalidate: 300 } // 5 min — announcements change more often
)

// ─── Upcoming Events ────────────────────────────────────────

async function fetchUpcomingEvents() {
  try {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const events = await prisma.schoolEvent.findMany({
      where: {
        OR: [
          { startDate: { gte: now } },
          { endDate: { gte: now } },
        ],
      },
      orderBy: { startDate: "asc" },
      take: 5,
    })
    // Convert Date fields to strings for safe serialization
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate ? e.endDate.toISOString() : null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error("[fetchUpcomingEvents] Error:", error)
    return []
  }
}

export const getUpcomingEventsCached = unstable_cache(
  fetchUpcomingEvents,
  ["upcoming-events"],
  { tags: ["events"], revalidate: 300 } // 5 min — events have time sensitivity
)
