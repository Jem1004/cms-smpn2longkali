import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ChevronRight, ChevronLeft, Newspaper } from "lucide-react"

export const metadata: Metadata = {
  title: "Berita",
  description: "Kumpulan berita dan artikel terbaru dari sekolah.",
}

const ARTICLES_PER_PAGE = 12

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

function formatDate(date: Date | string | null): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d)
}

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1)

  const where = { status: "PUBLISHED" as const }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (currentPage - 1) * ARTICLES_PER_PAGE,
      take: ARTICLES_PER_PAGE,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.article.count({ where }),
  ])

  const totalPages = Math.ceil(total / ARTICLES_PER_PAGE)

  return (
    <main className="bg-white min-h-screen">

      {/* Header — konsisten dengan halaman lain */}
      <header className="bg-[#002244] relative pt-10 pb-10 md:pt-12 md:pb-12 border-b-[3px] border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-blue-300/60 text-xs font-bold tracking-widest uppercase mb-3">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-blue-200/80">Berita</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Berita &amp; Artikel
          </h1>
          <p className="text-blue-200/60 text-sm mt-2">
            Informasi terbaru seputar kegiatan dan perkembangan sekolah
          </p>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => {
                const excerpt = stripHtml(article.content).slice(0, 150)
                return (
                  <Link
                    key={article.id}
                    href={`/berita/${article.slug}`}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/9] bg-gray-100">
                      {article.thumbnailUrl ? (
                        <Image
                          src={article.thumbnailUrl}
                          alt={article.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Newspaper className="h-10 w-10 text-gray-300" />
                        </div>
                      )}
                      {article.category && (
                        <span className="absolute top-3 left-3 text-xs font-semibold text-[#FFC107] bg-[#002244]/80 px-2 py-0.5 rounded">
                          {article.category.name}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h2 className="text-base font-bold text-[#002244] group-hover:text-blue-600 line-clamp-2 transition-colors leading-snug mb-2">
                        {article.title}
                      </h2>
                      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                        {excerpt}{stripHtml(article.content).length > 150 ? "…" : ""}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{article.author.name}</span>
                        <time>{formatDate(article.publishedAt)}</time>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-between border-t border-gray-100 pt-8">
                <span className="text-sm text-gray-400">
                  Halaman <span className="font-bold text-[#002244]">{currentPage}</span> dari{" "}
                  <span className="font-bold text-[#002244]">{totalPages}</span>
                </span>
                <div className="flex items-center gap-3">
                  {currentPage > 1 ? (
                    <Link
                      href={`/berita?page=${currentPage - 1}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-[#002244] hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" /> Sebelumnya
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-100 text-sm font-semibold text-gray-300 cursor-not-allowed">
                      <ChevronLeft className="h-4 w-4" /> Sebelumnya
                    </span>
                  )}
                  {currentPage < totalPages ? (
                    <Link
                      href={`/berita?page=${currentPage + 1}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#002244] text-white text-sm font-semibold hover:bg-[#003366] transition-colors"
                    >
                      Selanjutnya <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-300 text-sm font-semibold cursor-not-allowed">
                      Selanjutnya <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </nav>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Newspaper className="h-14 w-14 text-gray-300 mb-4" />
            <p className="text-gray-400 text-lg font-medium">Belum ada berita</p>
          </div>
        )}
      </section>
    </main>
  )
}
