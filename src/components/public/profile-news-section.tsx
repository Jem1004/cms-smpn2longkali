import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getSiteSettings } from "@/lib/queries"
import { Newspaper } from "lucide-react"
import type { ProfileContent } from "@/types"

const DEFAULT_PROFILE: ProfileContent = {
  description: "Profil sekolah.",
  videoUrl: "",
  visi: "",
  misi: "",
  sejarah: "",
}

function formatDate(date: Date | null): string {
  if (!date) return ""
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith("/embed/")) return url
    const videoId =
      parsed.searchParams.get("v") ||
      (parsed.hostname === "youtu.be" ? parsed.pathname.slice(1) : null)
    if (videoId) return `https://www.youtube.com/embed/${videoId}`
  } catch {
    // not a valid URL
  }
  return null
}

export async function ProfileNewsSection() {
  const [profileRecord, latestArticles, siteSettings] = await Promise.all([
    prisma.institutionalContent.findUnique({ where: { section: "PROFILE" } }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        publishedAt: true,
        category: { select: { name: true } },
      },
    }),
    getSiteSettings(),
  ])

  const profile: ProfileContent = profileRecord
    ? (profileRecord.content as unknown as ProfileContent)
    : DEFAULT_PROFILE

  const embedUrl = getYouTubeEmbedUrl(profile.videoUrl)
  const schoolName = siteSettings?.identity?.name || "Sekolah Kami"

  const featured = latestArticles[0] ?? null
  const others = latestArticles.slice(1)

  return (
    <section className="bg-white py-16 md:py-24 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          {/* Kiri — Profil + Video */}
          <div className="w-full lg:w-7/12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-7 bg-[#002244] block rounded-full"></span>
              Profil {schoolName}
            </h2>

            {profile.videoUrl ? (
              embedUrl ? (
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-md mb-6 bg-slate-900 border border-slate-200">
                  <iframe
                    src={embedUrl}
                    title={`Profil ${schoolName}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : (
                <a
                  href={profile.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-video rounded-xl overflow-hidden shadow-md mb-6 bg-slate-100 border border-slate-200 group"
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                    <div className="h-16 w-16 rounded-full bg-[#ff0000] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="h-8 w-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </a>
              )
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-6 border border-slate-200 flex items-center justify-center">
                <span className="text-slate-400 font-medium text-sm">Video belum tersedia</span>
              </div>
            )}

            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              {profile.description}
            </p>
          </div>

          {/* Kanan — Berita (1 card besar + 2 list) */}
          <div className="w-full lg:w-5/12">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
              <h2 className="text-xl font-bold text-[#002244] tracking-tight">Berita Terbaru</h2>
              <Link href="/berita" className="text-sm font-semibold text-[#002244] hover:text-blue-600 transition-colors">
                Selengkapnya →
              </Link>
            </div>

            {latestArticles.length > 0 ? (
              <div className="space-y-4">
                {/* Berita utama — card besar */}
                {featured && (
                  <Link
                    href={`/berita/${featured.slug}`}
                    className="block rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group"
                  >
                    <div className="relative aspect-[16/9] bg-gray-100">
                      {featured.thumbnailUrl ? (
                        <Image
                          src={featured.thumbnailUrl}
                          alt={featured.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Newspaper className="h-10 w-10 text-gray-300" />
                        </div>
                      )}
                      {featured.category && (
                        <span className="absolute top-3 left-3 text-[10px] font-bold bg-[#002244]/80 text-[#FFC107] px-2 py-0.5 rounded">
                          {featured.category.name}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#002244] text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {featured.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(featured.publishedAt)}</p>
                    </div>
                  </Link>
                )}

                {/* 2 berita kecil */}
                {others.map((article) => (
                  <Link
                    key={article.id}
                    href={`/berita/${article.slug}`}
                    className="flex gap-4 group items-center"
                  >
                    <div className="relative h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {article.thumbnailUrl ? (
                        <Image
                          src={article.thumbnailUrl}
                          alt={article.title}
                          fill
                          sizes="96px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Newspaper className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 line-clamp-2 transition-colors leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(article.publishedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-slate-400 text-sm">Belum ada berita terbaru</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
