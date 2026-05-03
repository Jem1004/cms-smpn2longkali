import Image from "next/image"
import Link from "next/link"
import { getPublicGallery } from "@/lib/queries"
import { ArrowUpRight } from "lucide-react"

export async function GallerySection() {
  const images = await getPublicGallery()

  if (images.length === 0) {
    return null
  }

  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Minimalist Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Galeri Sekolah
            </h2>
            <p className="text-slate-500 mt-2 text-sm max-w-lg">
              Koleksi momen dan pencapaian terbaik yang direkam dalam sudut pandang visual di institusi kami.
            </p>
          </div>
          <Link
            href="/galeri"
            className="group flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors shrink-0"
          >
            Lihat Semua Foto
            <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Consistent Uniform Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-200 group cursor-pointer">
              <Image
                src={image.imageUrl}
                alt={image.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transform transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
