import type { Metadata } from "next"
import { getAllPublicEvents } from "@/actions/event"
import { CalendarDays, MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "Agenda Kegiatan",
  description: "Jadwal dan agenda kegiatan sekolah.",
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric" }).format(new Date(date))
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(date))
}

function formatFullDate(start: Date, end: Date | null) {
  const startStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(start))
  if (!end) return startStr
  const endStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(end))
  return `${startStr} – ${endStr}`
}

function getMonthYear(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(date))
}

export default async function AgendaPage() {
  const allEvents = await getAllPublicEvents()

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const upcoming = allEvents.filter((e) => new Date(e.startDate) >= now)
  const past = allEvents.filter((e) => new Date(e.startDate) < now).reverse()

  // Group upcoming by month
  const groupedUpcoming = upcoming.reduce<Record<string, typeof upcoming>>((acc, event) => {
    const key = getMonthYear(event.startDate)
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {})

  return (
    <article className="bg-white min-h-screen">
      {/* Minimalist Title Bar */}
      <header className="bg-[#002244] relative pt-10 pb-10 md:pt-12 md:pb-12 border-b-[3px] border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-blue-200 text-xs font-bold tracking-widest uppercase mb-3">
            <a href="/" className="hover:text-white transition-colors">Beranda</a> 
            <span className="mx-2 opacity-60">/</span> 
            <span className="text-white">Agenda</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Agenda Kegiatan
          </h1>
        </div>
      </header>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="h-16 w-16 text-slate-200 mb-6" />
            <p className="text-slate-700 text-xl font-bold">Belum Ada Agenda</p>
            <p className="text-slate-500 mt-2">Belum ada agenda atau kegiatan sekolah yang dijadwalkan.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Upcoming grouped by month */}
            {Object.keys(groupedUpcoming).length > 0 && (
              <div className="space-y-12">
                {Object.entries(groupedUpcoming).map(([month, events]) => (
                  <div key={month}>
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 pb-4 border-b-2 border-slate-100">
                      Bulan {month}
                    </h2>
                    <div className="flex flex-col">
                      {events.map((event) => (
                        <EventItem key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Past events */}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 pb-4 border-b-2 border-slate-50">
                  Kegiatan Yang Berlalu
                </h2>
                <div className="flex flex-col opacity-60 grayscale-[30%]">
                  {past.map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function EventItem({ event }: { event: Awaited<ReturnType<typeof getAllPublicEvents>>[number] }) {
  return (
    <div className="group flex flex-col sm:flex-row gap-6 pt-6 pb-8 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 -mx-4 px-4 sm:px-6 rounded-2xl transition-colors">
      {/* Typographic Date Column */}
      <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-1 shrink-0 sm:w-28 pt-1">
        <span className="text-4xl md:text-5xl font-black text-[#002244] leading-none group-hover:text-blue-600 transition-colors">
          {formatDay(event.startDate).padStart(2, '0')}
        </span>
        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mt-1 sm:mt-2">
          {formatMonth(event.startDate)}
        </span>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 pt-1">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {event.title}
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-3 sm:mt-4">
          <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 opacity-70 shrink-0" />
            {formatFullDate(event.startDate, event.endDate)}
          </p>
          {event.location && (
            <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
              <MapPin className="h-4 w-4 opacity-70 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </p>
          )}
        </div>

        {event.description && (
          <p className="text-slate-700 mt-4 leading-relaxed text-base pt-3 border-t border-slate-100 border-dashed">
            {event.description}
          </p>
        )}
      </div>
    </div>
  )
}
