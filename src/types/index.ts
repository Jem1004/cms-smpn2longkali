import type { Session } from "next-auth"

// ============================================
// Auth Types
// ============================================

export interface SessionWithRole extends Session {
  user: {
    id: string
    name: string
    email: string
    role: "SUPER_ADMIN" | "EDITOR" | "CONTRIBUTOR"
    isActive: boolean
  }
}

// ============================================
// Server Action Response
// ============================================

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ============================================
// Menu Types
// ============================================

export interface MenuItemForm {
  label: string
  url: string
  type: "INTERNAL" | "EXTERNAL"
  parentId: string | null
  order: number
  isHighlighted: boolean
}

export interface MenuItemWithChildren extends MenuItemForm {
  id: string
  children: MenuItemWithChildren[]
  createdAt: Date
  updatedAt: Date
}
// ============================================
// Article Types
// ============================================

export interface ArticleFilter {
  search?: string
  categoryId?: string
  status?: "DRAFT" | "PUBLISHED"
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================
// Institutional Content Types
// ============================================

export interface HeroSlide {
  id: string
  title: string
  description: string
  imageUrl: string
  badgeLabel: string
  ctaText: string
  ctaUrl: string
}

export interface HeroContent {
  slides: HeroSlide[]
}

export interface ProfileContent {
  description: string
  videoUrl: string
  visi: string
  misi: string
  sejarah: string
}

export interface PrincipalContent {
  message: string
  name: string
  title: string
  photoUrl: string
}

export interface DepartmentContent {
  departments: Array<{
    id: string
    name: string
    description: string
    imageUrl: string
  }>
}

// ============================================
// S3 Upload Types
// ============================================

export interface PresignResult {
  uploadUrl: string
  fileUrl: string
  key: string
}


// ============================================
// Site Settings Types
// ============================================

export interface SiteIdentity {
  name: string
  shortName: string
  tagline: string
  description: string
  logoUrl: string
  faviconUrl: string
}

export interface SiteContact {
  address: string
  phone: string
  email: string
  mapsEmbedUrl: string
  whatsapp: string
}

export interface SiteSocial {
  facebook: string
  instagram: string
  youtube: string
  tiktok: string
}

export interface SiteFooterLink {
  id: string
  label: string
  url: string
}

export interface SiteFooter {
  links: SiteFooterLink[]
}

export interface SiteSettings {
  identity: SiteIdentity
  contact: SiteContact
  social: SiteSocial
  footer: SiteFooter
}
