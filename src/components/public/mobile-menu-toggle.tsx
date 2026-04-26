"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ChevronDown } from "lucide-react"
import type { MenuItemWithChildren, SiteIdentity } from "@/types"

interface MobileMenuToggleProps {
  items: MenuItemWithChildren[]
  identity: SiteIdentity
}

export function MobileMenuToggle({ items, identity }: MobileMenuToggleProps) {
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="lg:hidden p-2 text-slate-700 hover:text-blue-600 transition-colors"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <nav
          className="lg:hidden absolute top-full left-0 w-full bg-[#002244] border-t border-white/10 shadow-lg"
          aria-label="Menu navigasi mobile"
        >
          {/* Mobile header with logo */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
            {identity.logoUrl ? (
              <Image
                src={identity.logoUrl}
                alt={identity.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-[#002244] font-extrabold text-[7px] text-center leading-tight">
                  {identity.shortName.split(" ").map(w => w[0]).join("").slice(0, 4)}
                </span>
              </div>
            )}
            <span className="text-white font-bold text-sm">{identity.shortName}</span>
          </div>
          
          <ul className="flex flex-col py-2">
            {items.map((item) => (
              <li key={item.id}>
                {item.children.length > 0 ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="flex items-center justify-between w-full px-6 py-3 text-white hover:bg-white/10 transition-colors text-sm"
                      aria-expanded={expandedId === item.id}
                    >
                      {item.label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedId === item.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expandedId === item.id && (
                      <ul className="bg-white/5">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={child.url}
                              onClick={() => setOpen(false)}
                              className="block px-10 py-2.5 text-white/80 hover:text-[#FFC107] hover:bg-white/5 transition-colors text-sm"
                              target={child.type === "EXTERNAL" ? "_blank" : undefined}
                              rel={child.type === "EXTERNAL" ? "noopener noreferrer" : undefined}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  item.url === "#" ? (
                    <span className="block px-6 py-3 text-white/60 text-sm cursor-default">
                      {item.label}
                    </span>
                  ) : (
                  <Link
                    href={item.url}
                    onClick={() => setOpen(false)}
                    className={item.isHighlighted
                      ? "block mx-3 my-1 px-4 py-2.5 bg-[#FFC107] text-[#002244] font-bold rounded-lg text-sm transition-colors"
                      : "block px-6 py-3 text-white hover:text-[#FFC107] hover:bg-white/10 transition-colors text-sm"
                    }
                    target={item.type === "EXTERNAL" ? "_blank" : undefined}
                    rel={item.type === "EXTERNAL" ? "noopener noreferrer" : undefined}
                  >
                    {item.label}
                  </Link>
                  )
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  )
}
