"use client"

import { useEffect, useRef, useState } from "react"
import { CalendarDays, MapPin, ArrowRight, Megaphone } from "lucide-react"
import Link from "next/link"

// Serialized types — Date fields are ISO strings after unstable_cache
interface SerializedAnnouncement {
  id: string
  title: string
  content: string | null
  type: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

interface SerializedEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

interface Props {
  announcements: SerializedAnnouncement[]
  events: SerializedEvent[]
}

export function AnnouncementEventSection({ announcements, events }: Props) {
  if (announcements.length === 0 && events.length === 0) return null

  return (
    <section className="bg-[#f5f7fa] py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Agenda */}
          <FadeIn delay={0}>
            <div className="bg-white rounded-2xl h-full flex flex-col overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#002244] tracking-tight">Agenda</h2>
                <Link href="/agenda" className="text-xs font-medium text-gray-400 hover:text-[#002244] transition-colors flex items-center gap-0.5">
                  Semua <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[480px]">
                {events.length === 0 ? (
                  <p className="px-6 py-12 text-slate-400 text-sm text-center">Belum ada agenda.</p>
                ) : (
                  events.slice(0, 5).map((event, i) => (
                    <FadeIn key={event.id} delay={60 + i * 40}>
                      <div className="group flex items-start gap-4 px-6 py-4 border-t border-gray-50 hover:bg-gray-50/60 transition-colors cursor-default">
                        <div className="w-13 h-13 rounded-lg bg-[#002244] text-white flex flex-col items-center justify-center shrink-0" style={{ width: "52px", height: "52px" }}>
                          <span className="text-lg font-bold leading-none">{new Date(event.startDate).getDate()}</span>
                          <span className="text-[8px] uppercase tracking-wide font-semibold text-white/50 mt-0.5">
                            {new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(event.startDate))}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{event.title}</p>
                          {event.description && (
                            <p className="text-slate-500 text-sm mt-1 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-slate-400 text-xs">
                            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(event.startDate))}</span>
                            {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  ))
                )}
              </div>
            </div>
          </FadeIn>

          {/* Pengumuman */}
          <FadeIn delay={80}>
            <div className="bg-white rounded-2xl h-full flex flex-col overflow-hidden">
              <div className="px-6 py-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#002244] tracking-tight">Pengumuman</h2>
                <Link href="/pengumuman" className="text-xs font-medium text-gray-400 hover:text-[#002244] transition-colors flex items-center gap-0.5">
                  Semua <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[480px]">
                {announcements.length === 0 ? (
                  <p className="px-6 py-12 text-slate-400 text-sm text-center">Belum ada pengumuman.</p>
                ) : (
                  announcements.slice(0, 5).map((item, i) => (
                    <FadeIn key={item.id} delay={100 + i * 40}>
                      <div className="group px-6 py-4 border-t border-gray-50 hover:bg-gray-50/60 transition-colors cursor-default">
                        <div className="flex items-start gap-3">
                          <Megaphone className="h-5 w-5 text-[#002244]/40 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{item.title}</p>
                            {item.content && (
                              <p className="text-slate-500 text-sm mt-1 line-clamp-2">{item.content}</p>
                            )}
                            <p className="text-slate-400 text-xs mt-1.5">
                              {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.createdAt))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  ))
                )}
              </div>
            </div>
          </FadeIn>

        </div>
      </div>
    </section>
  )
}
