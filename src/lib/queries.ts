import { prisma } from "@/lib/prisma"
import type { MenuItemWithChildren } from "@/types"

/**
 * Fetch all menu items for the public landing page (no auth required).
 * Returns a tree structure of parents with children, ordered by `order`.
 */
export async function getPublicMenuItems(): Promise<MenuItemWithChildren[]> {
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


import { unstable_cache } from "next/cache"
import type { SiteSettings, SiteIdentity, SiteContact, SiteSocial, SiteFooter } from "@/types"

// ============================================
// Default Site Settings
// ============================================

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

// ============================================
// Cached Site Settings Query
// ============================================

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
