import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getSiteSettings } from "@/lib/queries"
import type { ProfileContent } from "@/types"

const DEFAULT_PROFILE: ProfileContent = {
  description:
    "Profil sekolah.",
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

/**
 * Extracts a YouTube embed URL from various YouTube URL formats.
 * Returns null if the URL is not a recognized YouTube link.
 */
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    // Already an embed URL
    if (parsed.pathname.startsWith("/embed/")) return url
    // Standard watch URL
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
      },
    }),
    getSiteSettings(),
  ])


  const profile: ProfileContent = profileRecord
    ? (profileRecord.content as unknown as ProfileContent)
    : DEFAULT_PROFILE

  const embedUrl = getYouTubeEmbedUrl(profile.videoUrl)
  const schoolName = siteSettings?.identity?.name || "Sekolah Kami"

  return (
    <section className="bg-white py-16 md:py-24 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left column — Profile + Video */}
          <div className="w-full lg:w-7/12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 tracking-tight flex items-center gap-3">
              <span className="w-2 h-8 bg-[#005b9f] block rounded-sm"></span>
              Profil {schoolName}
            </h2>

            {/* Video */}
            {profile.videoUrl ? (
              embedUrl ? (
                <div className="relative aspect-video rounded-md overflow-hidden shadow-md mb-6 bg-slate-900 border border-slate-200">
                  <iframe
                    src={embedUrl}
                    title={`Profil ${schoolName}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : (
                /* Non-YouTube video link */
                <a
                  href={profile.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-video rounded-md overflow-hidden shadow-md mb-6 bg-slate-100 border border-slate-200 group"
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors z-10">
                    <div className="h-16 w-16 rounded-full bg-[#ff0000] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="h-8 w-8 text-white ml-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </a>
              )
            ) : (
              <div className="relative aspect-video rounded-md overflow-hidden bg-slate-100 mb-6 border border-slate-200 flex items-center justify-center">
                <span className="text-slate-400 font-medium text-sm">
                  Video belum tersedia
                </span>
              </div>
            )}

            {/* Description */}
            <p className="text-slate-600 leading-relaxed text-base font-medium">
              {profile.description}
            </p>
          </div>

          {/* Right column — Latest News */}
          <div className="w-full lg:w-5/12">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Berita Terbaru
              </h2>
              <Link
                href="/berita"
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Selengkapnya &rarr;
              </Link>
            </div>

            {latestArticles.length > 0 ? (
              <div className="space-y-6">
                {latestArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/berita/${article.slug}`}
                    className="flex gap-5 group items-center"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-20 w-28 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200/60">
                      {article.thumbnailUrl ? (
                        <Image
                          src={article.thumbnailUrl}
                          alt={article.title}
                          fill
                          sizes="112px"
                          className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg
                            className="h-6 w-6 text-slate-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Title + Date */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 line-clamp-2 transition-colors mb-2 leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                        {formatDate(article.publishedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="text-slate-400 text-sm font-medium">
                  Belum ada berita terbaru
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
