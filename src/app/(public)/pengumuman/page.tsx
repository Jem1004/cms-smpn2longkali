import type { Metadata } from "next"
import Link from "next/link"
import { getAllPublicAnnouncements } from "@/actions/announcement"
import { Info, AlertCircle, CheckCircle2, Megaphone } from "lucide-react"

export const metadata: Metadata = {
  title: "Pusat Pengumuman",
  description: "Daftar pengumuman dan informasi resmi dari sekolah.",
}

const TYPE_CONFIG: Record<string, { icon: any; badge: string; text: string }> = {
  INFO: {
    icon: Info,
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    text: "Info Khusus",
  },
  WARNING: {
    icon: AlertCircle,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    text: "Peringatan",
  },
  SUCCESS: {
    icon: CheckCircle2,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "Pemberitahuan",
  },
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export default async function PengumumanPage() {
  const announcements = await getAllPublicAnnouncements()

  return (
    <article className="bg-white min-h-screen">
      
      {/* Minimalist Title Bar */}
      <header className="bg-[#002244] relative pt-10 pb-10 md:pt-12 md:pb-12 border-b-[3px] border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-blue-300/60 text-xs font-bold tracking-widest uppercase mb-3">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link> 
            <span className="mx-2 opacity-40">/</span> 
            <span className="text-blue-200/80">Pengumuman</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Papan Pengumuman
          </h1>
        </div>
      </header>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Megaphone className="h-16 w-16 text-slate-200 mb-6" />
            <p className="text-slate-700 text-xl font-bold">Belum Ada Pengumuman</p>
            <p className="text-slate-500 mt-2">Belum ada informasi terbaru yang diterbitkan oleh pihak sekolah.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {announcements.map((item, idx) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.INFO
              const Icon = config.icon
              return (
                <div
                  key={item.id}
                  className={`group py-8 ${idx !== 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                    {/* Visual Indicator Column */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4 shrink-0 sm:w-40 pt-1">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm border ${config.badge}`}>
                        {config.text}
                      </span>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h2>
                      {item.content && (
                        <p className="text-slate-700 mt-3 leading-relaxed text-base pt-1">
                          {item.content}
                        </p>
                      )}
                      {item.expiresAt && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mt-5 pt-4 border-t border-slate-50 border-dashed">
                          <Icon className="w-3.5 h-3.5 opacity-70" /> Berlaku sampai: {formatDate(item.expiresAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
    </article>
  )
}
