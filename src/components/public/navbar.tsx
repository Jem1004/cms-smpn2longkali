import Link from "next/link"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { getPublicMenuItems, getSiteSettings } from "@/lib/queries"
import { MobileMenuToggle } from "./mobile-menu-toggle"

const menuClass = "px-4 py-2 rounded-lg text-[14px] font-medium text-slate-600 hover:bg-[#002244] hover:text-white transition-all duration-150"
const highlightClass = "px-4 py-2 rounded-lg text-[14px] font-bold bg-[#FFC107] text-[#002244] hover:bg-[#FFD54F] transition-all duration-150"

export async function Navbar() {
  const [items, settings] = await Promise.all([
    getPublicMenuItems(),
    getSiteSettings(),
  ])

  const { identity } = settings

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">

          {/* Logo + Identity — kiri */}
          <Link href="/" className="flex items-center gap-3 shrink-0 mr-auto group">
            {identity.logoUrl ? (
              <Image
                src={identity.logoUrl}
                alt={identity.name}
                width={44}
                height={44}
                className="w-11 h-11 object-contain"
              />
            ) : (
              <div className="w-11 h-11 bg-[#002244] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-extrabold text-xs">
                  {identity.shortName.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                </span>
              </div>
            )}
            <div>
              <span className="font-bold text-[15px] text-[#002244] block leading-tight tracking-tight">
                {identity.shortName}
              </span>
              {identity.tagline && (
                <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 block">
                  {identity.tagline}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop navigation — kanan */}
          <nav className="hidden lg:flex items-center ml-auto" aria-label="Menu navigasi utama">
            <ul className="flex items-center gap-1">
              {items.map((item) => {
                const cls = item.isHighlighted ? highlightClass : menuClass

                return (
                  <li key={item.id} className="relative group/item">
                    {item.children.length > 0 ? (
                      <>
                        <button
                          className={`flex items-center gap-1 ${cls}`}
                          aria-haspopup="true"
                        >
                          {item.label}
                          <ChevronDown className="h-3.5 w-3.5 opacity-50 group-hover/item:opacity-100 group-hover/item:rotate-180 transition-all duration-200" />
                        </button>

                        <div className="absolute right-0 top-full pt-2 hidden group-hover/item:block z-50">
                          <ul className="bg-white rounded-xl border border-black/[0.06] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] min-w-[220px] py-1.5 overflow-hidden">
                            {item.children.map((child) => (
                              <li key={child.id}>
                                {child.url === "#" ? (
                                  <span className="block px-4 py-2.5 text-[13px] text-slate-300 cursor-default">
                                    {child.label}
                                  </span>
                                ) : (
                                  <Link
                                    href={child.url}
                                    className="block px-4 py-2.5 text-[13px] text-slate-600 hover:bg-[#002244] hover:text-white font-medium transition-all duration-150 mx-1.5 rounded-lg"
                                    target={child.type === "EXTERNAL" ? "_blank" : undefined}
                                    rel={child.type === "EXTERNAL" ? "noopener noreferrer" : undefined}
                                  >
                                    {child.label}
                                  </Link>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : item.url === "#" ? (
                      <span className="px-4 py-2 rounded-lg text-[14px] font-medium text-slate-300 cursor-default">
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={item.url}
                        className={cls}
                        target={item.type === "EXTERNAL" ? "_blank" : undefined}
                        rel={item.type === "EXTERNAL" ? "noopener noreferrer" : undefined}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Mobile menu toggle */}
          <MobileMenuToggle items={items} identity={identity} />
        </div>
      </div>
    </header>
  )
}
