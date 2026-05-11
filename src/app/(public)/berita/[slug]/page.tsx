import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { incrementArticleView } from "@/actions/article"
import { hasViewedArticle } from "@/lib/view-tracker"
import { Calendar, User, ChevronLeft, Share2, Tag, ArrowRight, Eye } from "lucide-react"

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { title: true, content: true, thumbnailUrl: true, metaTitle: true, metaDesc: true },
  })

  if (!article) return { title: "Artikel Tidak Ditemukan" }

  const title = article.metaTitle || article.title
  const description = article.metaDesc || stripHtml(article.content).slice(0, 160)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      locale: "id_ID",
      ...(article.thumbnailUrl && { images: [{ url: article.thumbnailUrl }] }),
    },
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true, slug: true } },
    },
  })

  if (!article || article.status !== "PUBLISHED") {
    notFound()
  }

  // Track article view (non-blocking, fire-and-forget)
  // This runs in the background and doesn't block page render
  const isUniqueView = !(await hasViewedArticle(slug))
  
  // Increment view counter (don't await - let it run in background)
  // The server action will handle both DB update and cookie setting
  incrementArticleView(slug, isUniqueView).catch((error) => {
    // Silent fail - view tracking is not critical
    console.error("[ArticleDetailPage] View tracking failed:", error)
  })

  // Fetch related articles from same category (exclude current)
  const relatedArticles = article.categoryId
    ? await prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          categoryId: article.categoryId,
          id: { not: article.id },
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: { title: true, slug: true, thumbnailUrl: true, publishedAt: true },
      })
    : []

  return (
    <main className="bg-white min-h-screen pb-20">
      
      {/* Minimalist Title Bar - Consitent but more compact */}
      <header className="bg-[#002244] border-b-[3px] border-yellow-400 pt-10 pb-10 md:pt-12 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-blue-300/60 text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link> 
            <span className="opacity-40">/</span> 
            <Link href="/berita" className="hover:text-white transition-colors">Berita</Link>
          </nav>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug mb-5">
            {article.title}
          </h1>

          <div className="flex items-center gap-3 text-blue-200/60 text-sm">
            <span>{article.author.name}</span>
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
            {article.viewCount > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {article.viewCount.toLocaleString("id-ID")} views
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Image - Clean */}
        {article.thumbnailUrl && (
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-slate-50 mb-12">
            <Image
              src={article.thumbnailUrl}
              alt={article.title}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article content - Refined Prosc */}
        <div
          className="prose prose-slate prose-lg max-w-none 
            prose-headings:text-[#002244] prose-headings:font-extrabold 
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-[#002244] prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-[#FFC107]
            prose-img:rounded-xl prose-strong:text-[#002244]"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Related - Minimal Grid */}
        {relatedArticles.length > 0 && (
          <div className="mt-24 pt-16 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-[#002244] mb-10 text-center">
              Berita Lainnya
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.map((related) => (
                <Link
                  key={related.slug}
                  href={`/berita/${related.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[16/10] bg-slate-50 rounded-xl overflow-hidden mb-4">
                    {related.thumbnailUrl ? (
                      <Image
                        src={related.thumbnailUrl}
                        alt={related.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-200">
                        <Tag className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#002244] line-clamp-2 leading-snug group-hover:text-[#FFC107] transition-colors">
                    {related.title}
                  </h3>
                  <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {formatDate(related.publishedAt)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
