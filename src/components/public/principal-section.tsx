import Image from "next/image"
import { getPrincipalContent } from "@/lib/queries"
import type { PrincipalContent } from "@/types"

const DEFAULT_PRINCIPAL: PrincipalContent = {
  message:
    "Selamat datang di website resmi sekolah kami. Kami berkomitmen untuk mencetak lulusan yang kompeten, berkarakter, dan siap menghadapi tantangan dunia kerja maupun dunia usaha.",
  name: "Kepala Sekolah",
  title: "Kepala Sekolah",
  photoUrl: "",
}

export async function PrincipalSection() {
  const record = await getPrincipalContent()

  const principal: PrincipalContent = record
    ? (record.content as unknown as PrincipalContent)
    : DEFAULT_PRINCIPAL

  if (!principal.message && !principal.name) {
    return null
  }

  return (
    <section className="relative text-white overflow-hidden bg-[#002244]">

      {/* Foto desktop — background kanan */}
      {principal.photoUrl && (
        <div className="hidden lg:block absolute top-0 right-0 bottom-0 w-[42%]">
          <Image
            src={principal.photoUrl}
            alt={principal.name}
            fill
            sizes="42vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#002244] to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`py-14 md:py-16 ${principal.photoUrl ? "lg:w-[55%]" : ""}`}>
          <h2 className="text-2xl md:text-3xl font-bold mb-5">
            Prakata Kepala Sekolah
          </h2>
          <div
            className="text-sm md:text-[15px] leading-relaxed text-white/75"
            dangerouslySetInnerHTML={{ __html: principal.message }}
          />
          <div className="mt-6">
            <p className="font-bold text-base">{principal.name}</p>
            <p className="text-sm text-[#FFC107]">{principal.title}</p>
          </div>
        </div>
      </div>

      {/* Foto mobile */}
      {principal.photoUrl && (
        <div className="relative w-full h-52 lg:hidden">
          <Image
            src={principal.photoUrl}
            alt={principal.name}
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#002244] to-transparent" />
        </div>
      )}
    </section>
  )
}
