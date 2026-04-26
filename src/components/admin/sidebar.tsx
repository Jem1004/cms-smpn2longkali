"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Menu,
  FileText,
  Newspaper,
  Image,
  GraduationCap,
  Users,
  LogOut,
  PanelLeft,
  BookOpen,
  Settings,
  Megaphone,
  CalendarDays,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { Permission } from "@/lib/rbac"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  permission?: Permission
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Umum",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Konten Website",
    items: [
      { label: "Konten Halaman", href: "/admin/konten", icon: FileText, permission: "content:manage" },
      { label: "Halaman Kustom", href: "/admin/halaman", icon: BookOpen, permission: "page:manage" },
      { label: "Berita", href: "/admin/berita", icon: Newspaper, permission: "article:create" },
      { label: "Jurusan", href: "/admin/jurusan", icon: GraduationCap, permission: "content:manage" },
      { label: "Galeri", href: "/admin/galeri", icon: Image, permission: "gallery:manage" },
      { label: "Guru & Tendik", href: "/admin/guru", icon: Users, permission: "staff:manage" },    ],
  },
  {
    label: "Informasi Publik",
    items: [
      { label: "Pengumuman & Agenda", href: "/admin/pengumuman", icon: Megaphone, permission: "content:manage" },
      { label: "Pendaftaran Siswa", href: "/admin/pendaftaran-siswa", icon: CalendarDays, permission: "content:manage" },
    ],
  },
  {
    label: "Navigasi",
    items: [
      { label: "Menu Navigasi", href: "/admin/menu", icon: Menu, permission: "menu:manage" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { label: "Pengguna", href: "/admin/pengguna", icon: Users, permission: "user:manage" },
      { label: "Pengaturan", href: "/admin/pengaturan", icon: Settings, permission: "menu:manage" },
    ],
  },
]

// Flat list untuk keperluan permission check
const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    "menu:manage", "content:manage", "article:create", "article:edit",
    "article:publish", "article:delete", "gallery:manage", "staff:manage", "user:manage", "page:manage",
  ],
  EDITOR: [
    "content:manage", "article:create", "article:edit",
    "article:publish", "article:delete", "gallery:manage", "staff:manage", "page:manage",
  ],
  CONTRIBUTOR: ["article:create", "article:edit"],
}

interface AdminSidebarProps {
  user: {
    name: string
    email: string
    role: string
  }
  spmbEnabled?: boolean
  children?: React.ReactNode
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getVisibleItems(role: string) {
  const perms = ROLE_PERMISSIONS[role] ?? []
  return NAV_ITEMS.filter((item) => !item.permission || perms.includes(item.permission))
}

function getVisibleGroups(role: string): NavGroup[] {
  const perms = ROLE_PERMISSIONS[role] ?? []
  return NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || perms.includes(item.permission)),
    }))
    .filter((group) => group.items.length > 0)
}

function NavLinks({ items, onNavigate, isMinimized }: { items: NavItem[]; onNavigate?: () => void; isMinimized?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={isMinimized ? item.label : undefined}
            className={cn(
              "flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
              isMinimized ? "justify-center px-0 w-10 mx-auto" : "gap-3.5 px-3.5",
              isActive
                ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                : "text-blue-100/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-300", isActive ? "scale-110" : "scale-100 opacity-80")} />
            {!isMinimized && <span className="truncate tracking-wide">{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

function NavGroupLinks({ groups, onNavigate, isMinimized }: { groups: NavGroup[]; onNavigate?: () => void; isMinimized?: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5">
      {groups.map((group, gi) => (
        <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
          {!isMinimized && (
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-300/40 px-3.5 mb-1.5">
              {group.label}
            </p>
          )}
          {isMinimized && gi > 0 && (
            <div className="w-6 h-px bg-white/10 mx-auto mb-3" />
          )}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={isMinimized ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
                    isMinimized ? "justify-center px-0 w-10 mx-auto" : "gap-3.5 px-3.5",
                    isActive
                      ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                      : "text-blue-100/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-300", isActive ? "scale-110" : "scale-100 opacity-80")} />
                  {!isMinimized && <span className="truncate tracking-wide">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function AdminSidebar({ user, spmbEnabled = false, children }: AdminSidebarProps) {
  const [open, setOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Filter out SPMB menu if feature is disabled
  const filteredGroups = getVisibleGroups(user.role).map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.href === "/admin/pendaftaran-siswa") return spmbEnabled
      return true
    }),
  })).filter((group) => group.items.length > 0)

  const visibleItems = getVisibleItems(user.role).filter((item) => {
    if (item.href === "/admin/pendaftaran-siswa") return spmbEnabled
    return true
  })

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    EDITOR: "Editor",
    CONTRIBUTOR: "Kontributor",
  }

  return (
    <>
      {/* Desktop sidebar - Deep Navy Institutional Branding */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-[#001b36] border-r border-[#001122] z-50 shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out relative group/sidebar before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none",
          isMinimized ? "w-[80px]" : "w-[260px]"
        )}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="absolute -right-3.5 top-20 bg-[#002244] border border-blue-800/40 text-blue-300 hover:bg-blue-600 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] flex items-center justify-center rounded-full w-7 h-7 z-50 opacity-0 group-hover/sidebar:opacity-100 transition-all hover:scale-110"
        >
          {isMinimized ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13 17 5-5-5-5" /><path d="m6 17 5-5-5-5" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" /></svg>
          )}
        </button>

        <div className={cn("flex h-16 items-center border-b border-white/5 transition-all relative z-10", isMinimized ? "justify-center px-4" : "gap-3 px-6")}>
          <img src="/astro-logo.png" alt="Astro School" className="w-8 h-8 object-contain brightness-0 invert shrink-0" />
          {!isMinimized && (
            <div className="leading-none mt-0.5 overflow-hidden">
              <span className="font-extrabold text-sm text-white block tracking-tight whitespace-nowrap drop-shadow-sm">ASTRO SCHOOL</span>
              <span className="text-[9px] text-blue-300/80 uppercase tracking-[0.2em] font-bold mt-1 block">Portal Admin</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-6 overflow-x-hidden relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <NavGroupLinks groups={filteredGroups} isMinimized={isMinimized} />
        </div>

        <div className={cn("border-t border-white/5 transition-all relative z-10", isMinimized ? "p-3" : "p-4")}>
          <div className={cn("flex items-center rounded-xl bg-black/20 hover:bg-blue-900/40 transition-colors cursor-pointer group border border-white/5 hover:border-blue-500/30", isMinimized ? "justify-center p-1.5" : "gap-3 p-2.5")}>
            <Avatar className="h-9 w-9 rounded-lg border border-white/10 shadow-sm transition-transform group-hover:scale-105 shrink-0 bg-[#001122]">
              <AvatarFallback className="bg-transparent text-yellow-500 text-xs font-bold rounded-lg group-hover:text-white transition-colors">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {!isMinimized && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-bold text-white truncate group-hover:text-blue-100 transition-colors">{user.name}</p>
                <p className="text-[10px] text-yellow-500/90 font-bold tracking-widest uppercase mt-0.5 truncate">{roleLabel[user.role] ?? user.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Header (mobile + desktop) */}
      <header
        className={cn(
          "sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200/40 bg-white/60 backdrop-blur-2xl px-4 transition-all duration-300 ease-in-out shadow-[0_1px_2px_rgba(0,0,0,0.01)]",
          isMinimized ? "lg:pl-[96px]" : "lg:pl-[276px]"
        )}
      >
        {/* Mobile menu trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0 hover:bg-slate-100 h-8 w-8 rounded-full">
              <PanelLeft className="h-4 w-4 text-slate-700" />
              <span className="sr-only">Buka menu</span>
            </Button>
          </SheetTrigger>
          {/* Mobile Sheet Panel with Navy Theme */}
          <SheetContent side="left" className="w-[260px] p-0 bg-[#001b36] text-white border-r-[#001122]">
            <SheetHeader className="h-14 flex-row items-center gap-3 px-6 border-b border-white/5 space-y-0">
              <img src="/astro-logo.png" alt="Astro School" className="w-7 h-7 object-contain brightness-0 invert shrink-0" />
              <div className="leading-none mt-0.5 text-left">
                <SheetTitle className="font-extrabold text-xs text-white tracking-tight m-0">ASTRO SCHOOL</SheetTitle>
              </div>
            </SheetHeader>
            <div className="px-3.5 py-6">
              <NavGroupLinks groups={filteredGroups} onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Header Left Area: Clean Date Pill */}
        <div className="flex-1 flex items-center lg:px-2">
          <div className="hidden md:flex items-center gap-2 text-[11px] font-bold tracking-wide text-slate-400 bg-slate-100/50 px-3.5 py-1.5 rounded-full border border-slate-200/50 cursor-pointer hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* User dropdown styling updated for extreme minimalist aesthetic */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 hover:bg-slate-100/80 transition-colors rounded-full h-9 px-2 pl-3">
              <span className="hidden sm:inline text-xs font-bold text-slate-700 tracking-tight">{user.name}</span>
              <Avatar className="h-7 w-7 rounded-full border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-[#002244] to-blue-700 text-white text-[10px] font-bold object-cover">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.08)] py-1">
            <DropdownMenuLabel className="pb-3 pt-2 px-4">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{user.email}</p>
              <p className="text-[9px] text-blue-700 font-bold tracking-widest uppercase mt-2 bg-blue-50/80 inline-block px-2 py-1 rounded-md border border-blue-100/50">{roleLabel[user.role] ?? user.role}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              onClick={() => {
                import("next-auth/react").then(({ signOut }) =>
                  signOut({ callbackUrl: "/login" })
                )
              }}
              className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 font-semibold m-1 rounded-xl px-4 py-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar Sesi
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content Wrapper */}
      <main
        className={cn(
          "transition-all duration-300 ease-in-out min-h-[calc(100vh-64px)] relative",
          isMinimized ? "lg:pl-[80px]" : "lg:pl-[260px]"
        )}
      >
        {/* Soft layout gradient decorative backdrop */}
        <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#002244]/[0.03] to-transparent pointer-events-none -z-10" />
        {children}
      </main>
    </>
  )
}
