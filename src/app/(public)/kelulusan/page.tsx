import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FileText, ExternalLink, GraduationCap, AlertCircle } from "lucide-react"
import { isGraduationEnabled, isGraduationActive, getGraduationSettings } from "@/actions/graduation"
import { getSiteSettings } from "@/lib/queries"
import { GraduationLookup } from "./graduation-lookup"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pengumuman Kelulusan",
  description: "Cek status kelulusan siswa kelas XII.",
}

export default async function KelulusanPage() {
  const enabled = await isGraduationEnabled()
  if (!enabled) notFound()

  const [active, settings, siteSettings] = await Promise.all([
    isGraduationActive(),
    getGraduationSettings(),
    getSiteSettings(),
  ])

  return (
    <main className="bg-white min-h-screen">

      {/* Header */}
      <header className="bg-[#002244] relative pt-10 pb-10 md:pt-12 md:pb-12 border-b-[3px] border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-blue-300/60 text-xs font-bold tracking-widest uppercase mb-3">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-blue-200/80">Kelulusan</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Pengumuman Kelulusan
          </h1>
          <p className="text-blue-200/60 text-sm mt-2">
            {settings.tahunAjaran
              ? `Tahun Ajaran ${settings.tahunAjaran}`
              : "Cek status kelulusan siswa kelas XII"}
          </p>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {!active ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-800 text-lg font-bold">Pengumuman Belum Dibuka</p>
            <p className="text-slate-400 text-sm mt-2 max-w-sm">
              Pengumuman kelulusan belum tersedia saat ini. Silakan cek kembali nanti atau hubungi pihak sekolah untuk informasi lebih lanjut.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* General Info / Surat Announcement */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <GraduationCap className="h-6 w-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">Informasi Kelulusan</h2>
                <p className="text-sm text-slate-600 mt-1 max-w-xl">
                  Pengumuman resmi kelulusan siswa/siswi kelas XII Tahun Ajaran {settings.tahunAjaran} telah ditetapkan. Silakan unduh surat keputusan resmi melalui tautan berikut.
                </p>
                {settings.suratUrl && (
                  <a
                    href={settings.suratUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-blue-700 font-bold text-sm hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
                  >
                    <FileText className="h-4 w-4" />
                    Unduh Surat Keputusan
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                )}
                {!settings.suratUrl && (
                  <div className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/50">
                    <AlertCircle className="h-4 w-4" />
                    Surat keputusan belum diunggah
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="pt-2">
              <GraduationLookup
                schoolName={siteSettings.identity.name}
                tahunAjaran={settings.tahunAjaran}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
