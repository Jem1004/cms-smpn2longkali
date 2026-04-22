import { getInstitutionalContent } from "@/actions/content"
import { getPagesForMenu } from "@/actions/page"
import { prisma } from "@/lib/prisma"
import { ContentManager } from "@/components/admin/content-manager"

export const metadata = {
  title: "Manajemen Konten — Admin",
  description: "Kelola konten landing page website sekolah",
}

export default async function KontenPage() {
  const [heroResult, profileResult, principalResult, pages, articles] = await Promise.all([
    getInstitutionalContent("HERO"),
    getInstitutionalContent("PROFILE"),
    getInstitutionalContent("PRINCIPAL_MESSAGE"),
    getPagesForMenu(),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, slug: true },
      orderBy: { publishedAt: "desc" },
      take: 30,
    }),
  ])

  return (
    <ContentManager
      heroContent={heroResult.success ? heroResult.data : null}
      profileContent={profileResult.success ? profileResult.data : null}
      principalContent={principalResult.success ? principalResult.data : null}
      pages={pages}
      articles={articles}
    />
  )
}
