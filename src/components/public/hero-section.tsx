import { prisma } from "@/lib/prisma"
import type { HeroContent } from "@/types"
import { HeroSlider } from "./hero-slider"

const DEFAULT_HERO: HeroContent = {
  slides: [
    {
      id: "default-1",
      title: "Selamat Datang di SMKN 1 Surabaya",
      description: "Sekolah Menengah Kejuruan Negeri 1 Surabaya — mencetak generasi unggul, kompeten, dan siap bersaing di era global.",
      imageUrl: "",
      badgeLabel: "Prestasi Siswa",
      ctaText: "Baca Lebih Lanjut",
      ctaUrl: "/berita",
    },
  ],
}

export async function HeroSection() {
  const heroRecord = await prisma.institutionalContent.findUnique({
    where: { section: "HERO" },
  })

  let hero: HeroContent

  if (heroRecord) {
    const content = heroRecord.content as Record<string, unknown>
    // Support both old format (single slide) and new format (slides array)
    if (Array.isArray((content as Record<string, unknown>).slides)) {
      hero = content as unknown as HeroContent
    } else {
      // Migrate old single-slide format to new slides array
      hero = {
        slides: [
          {
            id: "migrated-1",
            title: (content.title as string) || DEFAULT_HERO.slides[0].title,
            description: (content.description as string) || DEFAULT_HERO.slides[0].description,
            imageUrl: (content.imageUrl as string) || "",
            badgeLabel: (content.badgeLabel as string) || "Prestasi Siswa",
            ctaText: (content.ctaText as string) || "Baca Lebih Lanjut",
            ctaUrl: (content.ctaUrl as string) || "/berita",
          },
        ],
      }
    }
  } else {
    hero = DEFAULT_HERO
  }

  const slides = hero.slides.length > 0 ? hero.slides : DEFAULT_HERO.slides

  return (
    <section className="bg-[#002244] text-white relative overflow-hidden">
      <HeroSlider slides={slides} />
    </section>
  )
}
