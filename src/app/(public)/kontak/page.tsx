import type { Metadata } from "next"
import Link from "next/link"
import { getSiteSettings } from "@/lib/queries"
import { MapPin, Phone, Mail } from "lucide-react"
import { KontakForm } from "./kontak-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Kontak & Pengaduan",
  description: "Hubungi kami atau sampaikan pengaduan melalui WhatsApp.",
}

export default async function KontakPage() {
  const settings = await getSiteSettings()
  const { identity, contact } = settings

  return (
    <main className="bg-white min-h-screen">

      {/* Header — konsisten */}
      <header className="bg-[#002244] relative pt-10 pb-10 md:pt-12 md:pb-12 border-b-[3px] border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-blue-300/60 text-xs font-bold tracking-widest uppercase mb-3">
            <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-blue-200/80">Kontak &amp; Pengaduan</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Kontak &amp; Pengaduan
          </h1>
          <p className="text-blue-200/60 text-sm mt-2">
            Sampaikan pertanyaan, saran, atau pengaduan Anda
          </p>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Kiri: Info Kontak + Maps */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#002244] rounded-2xl p-6 text-white space-y-4">
              <h2 className="font-bold text-base">Informasi Kontak</h2>
              {contact.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#FFC107] shrink-0 mt-0.5" />
                  <p className="text-white/70 text-sm leading-relaxed">{contact.address}</p>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-[#FFC107] shrink-0" />
                  <p className="text-white/70 text-sm">{contact.phone}</p>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[#FFC107] shrink-0" />
                  <p className="text-white/70 text-sm">{contact.email}</p>
                </div>
              )}
            </div>

            {contact.mapsEmbedUrl && (
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: "240px" }}>
                <iframe
                  src={contact.mapsEmbedUrl}
                  width="100%"
                  height="240"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title={`Lokasi ${identity.shortName}`}
                />
              </div>
            )}
          </div>

          {/* Kanan: Form */}
          <div className="lg:col-span-3">
            <KontakForm
              whatsappNumber={contact.whatsapp ?? ""}
              schoolName={identity.name}
            />
          </div>

        </div>
      </section>
    </main>
  )
}
