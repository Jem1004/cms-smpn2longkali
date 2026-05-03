import type { Metadata } from "next"
import { HeroSection } from "@/components/public/hero-section"
import { ProfileNewsSection } from "@/components/public/profile-news-section"
import { PrincipalSection } from "@/components/public/principal-section"
import { AnnouncementEventSection } from "@/components/public/announcement-event-section"
import { GallerySection } from "@/components/public/gallery-section"
import { StaffSlider } from "@/components/public/staff-slider"
import { getActiveAnnouncementsCached, getUpcomingEventsCached } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Beranda",
  description: "Website resmi sekolah.",
}

export default async function HomePage() {
  const [announcements, events] = await Promise.all([
    getActiveAnnouncementsCached(),
    getUpcomingEventsCached(),
  ])

  return (
    <>
      <HeroSection />
      <ProfileNewsSection />
      <PrincipalSection />
      <AnnouncementEventSection announcements={announcements} events={events} />
      <StaffSlider />
      <GallerySection />
    </>
  )
}
