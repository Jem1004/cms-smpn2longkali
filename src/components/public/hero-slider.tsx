"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import { ArrowRight } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import type { HeroSlide } from "@/types"

interface HeroSliderProps {
  slides: HeroSlide[]
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  if (slides.length === 1) {
    return <SingleSlide slide={slides[0]} />
  }

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 6000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <SingleSlide slide={slide} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {count > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5 z-30">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === current
                  ? "w-10 bg-[#FFC107]"
                  : "w-5 bg-white/30 hover:bg-white/50"
              }`}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SingleSlide({ slide }: { slide: HeroSlide }) {
  return (
    <div className="relative w-full min-h-[360px] md:min-h-[480px] lg:min-h-[580px]">
      {/* Background image — full bleed */}
      {slide.imageUrl ? (
        <Image
          src={slide.imageUrl}
          alt={slide.title}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#002244]" />
      )}

      {/* Dark overlay gradient — lebih gelap di kiri untuk teks */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#002244]/90 via-[#002244]/60 to-[#002244]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#002244]/50 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center min-h-[360px] md:min-h-[480px] lg:min-h-[580px]">
        <div className="max-w-xl py-12 md:py-16 lg:py-20">
          {/* Badge */}
          {slide.badgeLabel && (
            <span className="inline-block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#FFC107] bg-[#FFC107]/10 border border-[#FFC107]/20 px-3 py-1 rounded-full mb-3 md:mb-4">
              {slide.badgeLabel}
            </span>
          )}

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 md:mb-4">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-white/70 text-xs sm:text-sm md:text-base leading-relaxed mb-6 md:mb-8 max-w-md line-clamp-3">
            {slide.description}
          </p>

          {/* CTA */}
          {slide.ctaText && (
            <Link
              href={slide.ctaUrl || "/berita"}
              className="inline-flex items-center gap-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#002244] font-bold text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-colors"
            >
              {slide.ctaText}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
