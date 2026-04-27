import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { isRegistrationOpen, getOpenDepartments, isSpmbEnabled } from "@/actions/registration"
import { getSiteSettings } from "@/lib/queries"
import { ClipboardList } from "lucide-react"
import { RegistrationForm } from "./registration-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pendaftaran Siswa Baru",
  description: "Formulir pendaftaran siswa baru.",
}

export default async function DaftarPage() {
  const enabled = await isSpmbEnabled()
  if (!enabled) notFound()

  const [open, departments, settings] = await Promise.all([
    isRegistrationOpen(),
    getOpenDepartments(),
    getSiteSettings(),
  ])

  return (
    <main className="bg-white min-h-screen">

      {/* Header — konsisten */}
      <header className="bg-[#002244] relative pt-10 pb-10 md:pt-12 md:pb-12 border-b-[3px] border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-blue-300/60 text-xs font-bold tracking-widest uppercase mb-3">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-blue-200/80">Pendaftaran</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Pendaftaran Siswa Baru
          </h1>
          <p className="text-blue-200/60 text-sm mt-2">
            Formulir penerimaan peserta didik baru (SPMB)
          </p>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {!open ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="h-14 w-14 text-gray-300 mb-4" />
            <p className="text-gray-800 text-lg font-bold">Pendaftaran Ditutup</p>
            <p className="text-gray-400 text-sm mt-2 max-w-sm">
              Pendaftaran siswa baru saat ini belum dibuka. Silakan hubungi pihak sekolah untuk informasi lebih lanjut.
            </p>
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="h-14 w-14 text-gray-300 mb-4" />
            <p className="text-gray-800 text-lg font-bold">Belum Ada Jurusan Tersedia</p>
            <p className="text-gray-400 text-sm mt-2">Jurusan belum dikonfigurasi untuk pendaftaran.</p>
          </div>
        ) : (
          <RegistrationForm
            departments={departments}
            schoolName={settings.identity.name}
          />
        )}
      </section>
    </main>
  )
}
