import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { FileText, Image, GraduationCap, Users, History, PlusCircle, PenSquare } from "lucide-react"
import type { SessionWithRole } from "@/types"

async function getDashboardStats() {
  const [articleCount, galleryCount, staffCount, userCount] = await Promise.all([
    prisma.article.count({ where: {  } }),
    prisma.galleryImage.count(),
    prisma.staff.count(),
    prisma.user.count({ where: { isActive: true } }),
  ])
  return { articleCount, galleryCount, staffCount, userCount }
}

async function getRecentArticles() {
  return prisma.article.findMany({
    where: {  },
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  })
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  const interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " hari yang lalu"
  const hours = seconds / 3600
  if (hours > 1) return Math.floor(hours) + " jam yang lalu"
  const minutes = seconds / 60
  if (minutes > 1) return Math.floor(minutes) + " menit yang lalu"
  return "Baru saja"
}

export default async function AdminDashboardPage() {
  const session = (await auth()) as SessionWithRole | null
  const [stats, recentArticles] = await Promise.all([
    getDashboardStats(),
    getRecentArticles(),
  ])

  const userName = session?.user?.name?.split(" ")[0] ?? "Administrator"

  const cards = [
    { title: "Total Artikel", value: stats.articleCount, icon: FileText, color: "text-blue-600", bgColor: "bg-blue-600/10", description: "Artikel di portal berita" },
    { title: "Galeri Foto", value: stats.galleryCount, icon: Image, color: "text-amber-600", bgColor: "bg-amber-600/10", description: "Aset foto dalam album web" },
    { title: "Tenaga Pengajar", value: stats.staffCount, icon: GraduationCap, color: "text-emerald-600", bgColor: "bg-emerald-600/10", description: "Daftar guru & staff aktif" },
    { title: "Akun Pengguna", value: stats.userCount, icon: Users, color: "text-orange-600", bgColor: "bg-orange-600/10", description: "Akses administrator" },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Halo, {userName} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Selamat datang di panel admin. Berikut rangkuman konten terkini.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100/50">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-emerald-700">Sistem Berjalan Normal</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:border-slate-300 transition-colors flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <h3 className="font-semibold text-slate-600">{card.title}</h3>
            </div>
            <div className="mt-1">
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Split */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Artikel Terbaru */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-lg">
            <History className="h-5 w-5 text-slate-400" />
            <h2>Artikel Terbaru</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 md:p-6">
            {recentArticles.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Belum ada artikel yang dibuat</p>
              </div>
            ) : (
              <div className="space-y-5">
                {recentArticles.map((article, idx) => (
                  <div key={article.id} className="flex gap-4 relative">
                    {idx !== recentArticles.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-[-20px] w-0.5 bg-slate-100" />
                    )}
                    <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white ring-1 ring-slate-100 ${article.status === "PUBLISHED" ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"}`}>
                      <PenSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-sm font-medium text-slate-900 leading-snug truncate max-w-xs">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${article.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {article.status === "PUBLISHED" ? "Published" : "Draft"}
                        </span>
                        <span className="text-xs text-slate-500">{article.author?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-xs text-slate-400">{timeAgo(article.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-lg">
            <PlusCircle className="h-5 w-5 text-slate-400" />
            <h2>Jalan Pintas</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col gap-2">
            <a href="/admin/berita/baru" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Tulis Berita</p>
                <p className="text-xs text-slate-500">Artikel & pengumuman</p>
              </div>
            </a>
            <a href="/admin/galeri" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
              <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Image className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">Unggah Galeri</p>
                <p className="text-xs text-slate-500">Album foto kegiatan</p>
              </div>
            </a>
            <a href="/admin/guru" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
              <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">Data Guru</p>
                <p className="text-xs text-slate-500">Tenaga kependidikan</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
