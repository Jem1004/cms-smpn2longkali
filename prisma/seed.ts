import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // 1. Create default Super Admin account
  const hashedPassword = await bcrypt.hash("Admin123!", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@astrodigiso-cms.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@astrodigiso-cms.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  })
  console.log(`✅ Super Admin created: ${admin.email}`)

  // 2. Create default categories
  const categories = [
    { name: "Berita Sekolah", slug: "berita-sekolah" },
    { name: "Prestasi", slug: "prestasi" },
    { name: "Kegiatan", slug: "kegiatan" },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log(`✅ Default categories created: ${categories.map((c) => c.name).join(", ")}`)

  // 3. Create placeholder InstitutionalContent for each ContentSection
  const institutionalContents = [
    {
      section: "HERO" as const,
      content: {
        slides: [
          {
            id: "slide-1",
            title: "Selamat Datang di Website Resmi Sekolah",
            description: "Kami berkomitmen mencetak generasi unggul, kompeten, dan siap bersaing di era global.",
            imageUrl: "",
            badgeLabel: "Informasi Sekolah",
            ctaText: "Lihat Berita",
            ctaUrl: "/berita",
          },
        ],
      },
    },
    {
      section: "PROFILE" as const,
      content: {
        description: "Sekolah kami berkomitmen untuk mencetak lulusan yang kompeten, berkarakter, dan siap menghadapi tantangan dunia kerja.",
        videoUrl: "",
        visi: "Menjadi sekolah unggulan yang menghasilkan lulusan kompeten dan berkarakter.",
        misi: "Menyelenggarakan pendidikan yang berkualitas.",
        sejarah: "Sekolah ini didirikan sebagai lembaga pendidikan yang berdedikasi.",
      },
    },
    {
      section: "PRINCIPAL_MESSAGE" as const,
      content: {
        message: "Selamat datang di website resmi sekolah kami. Kami berkomitmen untuk mencetak lulusan yang kompeten, berkarakter, dan siap menghadapi tantangan dunia kerja maupun dunia usaha.",
        name: "Kepala Sekolah",
        title: "Kepala Sekolah",
        photoUrl: "",
      },
    },
    {
      section: "DEPARTMENT" as const,
      content: {
        departments: [],
      },
    },
  ]

  for (const item of institutionalContents) {
    await prisma.institutionalContent.upsert({
      where: { section: item.section },
      update: {},
      create: {
        section: item.section,
        content: item.content,
      },
    })
  }
  console.log("✅ Institutional content placeholders created")

  // 4. Create sample gallery (skip if exists)
  const existingGallery = await prisma.galleryImage.count()
  if (existingGallery === 0) {
    console.log("⏭️  No gallery images seeded — add via admin panel")
  } else {
    console.log(`⏭️  Gallery images already exist (${existingGallery}), skipping`)
  }

  // 5. Create sample staff (skip if exists)
  const existingStaff = await prisma.staff.count()
  if (existingStaff === 0) {
    console.log("⏭️  No staff seeded — add via admin panel")
  } else {
    console.log(`⏭️  Staff already exist (${existingStaff}), skipping`)
  }

  // 6. Create sample articles (skip if exists)
  const existingArticles = await prisma.article.count()
  if (existingArticles === 0) {
    console.log("⏭️  No articles seeded — add via admin panel")
  } else {
    console.log(`⏭️  Articles already exist (${existingArticles}), skipping`)
  }

  console.log("🌱 Seeding complete!")
  console.log("")
  console.log("📋 Default login credentials:")
  console.log("   Email   : admin@astrodigiso-cms.com")
  console.log("   Password: Admin123!")
  console.log("")
  console.log("⚠️  Please change the password after first login.")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
