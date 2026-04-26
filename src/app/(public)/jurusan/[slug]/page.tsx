import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getDepartmentBySlug } from "@/actions/department"
import { ArrowLeft, BookOpen, Briefcase, User } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const dept = await getDepartmentBySlug(slug)
  if (!dept) return { title: "Jurusan Tidak Ditemukan" }
  return {
    title: dept.name,
    description: dept.description || `Program keahlian ${dept.name}`,
  }
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const dept = await getDepartmentBySlug(slug)

  if (!dept) notFound()

  return (
    <article className="bg-white min-h-screen">

      {/* Header */}
      <header className="bg-[#002244] relative pt-10 pb-10 md:pt-12 md:pb-12 border-b-[3px] border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-blue-300/60 text-xs font-bold tracking-widest uppercase mb-3">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link href="/jurusan" className="hover:text-white transition-colors">Jurusan</Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-blue-200/80">{dept.name}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            {dept.name}
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

        {/* Gambar + Deskripsi */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {dept.imageUrl && (
            <div className="relative w-full lg:w-2/5 aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shrink-0">
              <Image
                src={dept.imageUrl}
                alt={dept.name}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            {dept.description && (
              <p className="text-slate-700 text-base leading-relaxed">{dept.description}</p>
            )}

            {/* Ketua Jurusan */}
            {dept.headName && (
              <div className="mt-6 flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {dept.headPhoto ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                    <Image src={dept.headPhoto} alt={dept.headName} fill className="object-cover" sizes="56px" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#002244]/10 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-[#002244]/30" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400 font-medium">Ketua Program Keahlian</p>
                  <p className="font-bold text-slate-800">{dept.headName}</p>
                  {dept.headTitle && <p className="text-sm text-slate-500">{dept.headTitle}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kompetensi + Bidang Kerja */}
        {(dept.kompetensi.length > 0 || dept.bidangKerja.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dept.kompetensi.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-[#002244]" />
                  <h2 className="text-lg font-bold text-[#002244]">Kompetensi / Materi yang Diajarkan</h2>
                </div>
                <ol className="space-y-2">
                  {dept.kompetensi.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                      <span className="text-xs font-bold text-[#002244] bg-[#002244]/10 rounded-md w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {dept.bidangKerja.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-[#002244]" />
                  <h2 className="text-lg font-bold text-[#002244]">Profesi / Bidang Kerja</h2>
                </div>
                <ol className="space-y-2">
                  {dept.bidangKerja.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                      <span className="text-xs font-bold text-[#002244] bg-[#002244]/10 rounded-md w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/jurusan" className="inline-flex items-center gap-2 text-sm font-semibold text-[#002244] hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Jurusan
          </Link>
        </div>
      </div>
    </article>
  )
}
