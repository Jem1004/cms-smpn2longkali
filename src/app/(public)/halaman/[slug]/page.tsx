import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPageBySlug } from "@/actions/page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return { title: "Halaman Tidak Ditemukan" }

  const title = page.metaTitle || page.title
  const description = page.metaDesc || undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "id_ID",
    },
  }
}

export default async function PublicPageDetail({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <article className="bg-white min-h-screen">
      
      {/* Minimalist Title Bar */}
      <header className="bg-[#002244] relative pt-10 pb-10 md:pt-12 md:pb-12 border-b-[3px] border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-blue-300/60 text-xs font-bold tracking-widest uppercase mb-3">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link> 
            <span className="mx-2 opacity-40">/</span> 
            <span className="text-blue-200/80">Halaman</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            {page.title}
          </h1>
        </div>
      </header>

      {/* General Purpose Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div
          className={`
            prose prose-lg max-w-none 
            prose-headings:font-bold prose-headings:text-[#002244]
            prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl
            prose-h3:text-xl
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-blue-600 prose-a:font-semibold hover:prose-a:text-blue-700 hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-sm prose-img:my-8 prose-img:w-full prose-img:border border-slate-100
            prose-blockquote:border-l-4 prose-blockquote:border-[#002244] prose-blockquote:bg-slate-50 prose-blockquote:pl-5 prose-blockquote:py-3 prose-blockquote:my-8 prose-blockquote:text-slate-700 prose-blockquote:not-italic
            prose-li:text-slate-700 prose-ul:my-6 prose-ul:space-y-2 prose-li:marker:text-slate-400
            prose-hr:border-slate-200 prose-hr:my-10
          `}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>

    </article>
  )
}
