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
            title: "Jalur SNBP 2026 Sebanyak 83 Siswa SMKN 1 Surabaya Tembus PTN Ternama",
            description: "Sebanyak 83 siswa SMKN 1 Surabaya dinyatakan lolos ke Perguruan Tinggi Negeri melalui jalur prestasi tahun 2026. Hal ini membuktikan kualitas lulusan vokasi yang mampu bersaing secara akademik.",
            imageUrl: "https://images.unsplash.com/photo-1523050853063-bd80e292472d?auto=format&fit=crop&q=80&w=800",
            badgeLabel: "Prestasi Siswa",
            ctaText: "Baca Lebih Lanjut",
            ctaUrl: "/berita/snbp-2026-83-siswa-tembus-ptn",
          },
          {
            id: "slide-2",
            title: "SMKN 1 Surabaya Sabet Juara Umum LKS Tingkat Kota 2026",
            description: "Kontingen siswa berhasil memborong medali pada ajang Lomba Kompetensi Siswa tahun ini, mengukuhkan posisi sebagai sekolah kejuruan terdepan di Surabaya.",
            imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
            badgeLabel: "Berita Sekolah",
            ctaText: "Selengkapnya",
            ctaUrl: "/berita/juara-umum-lks-kota-2026",
          },
          {
            id: "slide-3",
            title: "Kunjungan Industri Jurusan PPLG ke Perusahaan Teknologi",
            description: "Siswa jurusan Pengembangan Perangkat Lunak dan Gim mendapatkan wawasan langsung dari praktisi industri melalui program kunjungan industri.",
            imageUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=80&w=800",
            badgeLabel: "Kegiatan",
            ctaText: "Baca Selengkapnya",
            ctaUrl: "/berita/kunjungan-industri-pplg-2026",
          },
        ],
      },
    },
    {
      section: "PROFILE" as const,
      content: {
        description: "Profil SMK Negeri 1 Surabaya",
        videoUrl: "",
        visi: "Menjadi SMK unggulan yang menghasilkan lulusan kompeten dan berkarakter.",
        misi: "Menyelenggarakan pendidikan kejuruan yang berkualitas.",
        sejarah: "SMK Negeri 1 Surabaya didirikan sebagai lembaga pendidikan kejuruan.",
      },
    },
    {
      section: "PRINCIPAL_MESSAGE" as const,
      content: {
        message: "Selamat datang di website resmi SMK Negeri 1 Surabaya.",
        name: "Kepala Sekolah",
        title: "Kepala SMK Negeri 1 Surabaya",
        photoUrl: "",
      },
    },
    {
      section: "DEPARTMENT" as const,
      content: {
        departments: [
          {
            id: "dept-1",
            name: "Teknik Komputer dan Jaringan",
            description: "Program keahlian di bidang komputer dan jaringan.",
            imageUrl: "",
          },
        ],
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

  // 4. Create sample gallery images
  const galleryImages = [
    {
      title: "Upacara Bendera",
      description: "Upacara bendera rutin setiap hari Senin",
      imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400",
      order: 0,
    },
    {
      title: "Kegiatan Praktikum",
      description: "Siswa melakukan praktikum di laboratorium",
      imageUrl: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=400",
      order: 1,
    },
    {
      title: "Diskusi Kelompok",
      description: "Kegiatan diskusi kelompok di kelas",
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400",
      order: 2,
    },
    {
      title: "Seminar Industri",
      description: "Seminar bersama praktisi industri",
      imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400",
      order: 3,
    },
  ]

  const existingGallery = await prisma.galleryImage.count()
  if (existingGallery === 0) {
    for (const img of galleryImages) {
      await prisma.galleryImage.create({ data: img })
    }
    console.log(`✅ Gallery images created: ${galleryImages.length} items`)
  } else {
    console.log(`⏭️  Gallery images already exist (${existingGallery}), skipping`)
  }

  // 5. Create sample staff/guru data
  const staffMembers = [
    {
      name: "Dra. Endang Sulastri",
      position: "Kepala Program",
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      order: 0,
    },
    {
      name: "Bambang Wijaya, S.Kom",
      position: "Waka Kurikulum",
      photoUrl: "https://images.unsplash.com/photo-1544168190-79c17527004f?auto=format&fit=crop&q=80&w=200",
      order: 1,
    },
    {
      name: "Siti Aminah, M.Pd",
      position: "Humas",
      photoUrl: "https://images.unsplash.com/photo-1580894732230-2867e638db40?auto=format&fit=crop&q=80&w=200",
      order: 2,
    },
    {
      name: "Agus Kurniawan, ST",
      position: "Kepala Bengkel",
      photoUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=200",
      order: 3,
    },
    {
      name: "Budi Santoso, S.Pd",
      position: "Guru Produktif",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      order: 4,
    },
  ]

  const existingStaff = await prisma.staff.count()
  if (existingStaff === 0) {
    for (const staff of staffMembers) {
      await prisma.staff.create({ data: staff })
    }
    console.log(`✅ Staff members created: ${staffMembers.length} items`)
  } else {
    console.log(`⏭️  Staff members already exist (${existingStaff}), skipping`)
  }

  // 6. Create sample articles
  const existingArticles = await prisma.article.count()
  if (existingArticles === 0) {
    const prestasiCategory = await prisma.category.findUnique({ where: { slug: "prestasi" } })
    const beritaCategory = await prisma.category.findUnique({ where: { slug: "berita-sekolah" } })
    const kegiatanCategory = await prisma.category.findUnique({ where: { slug: "kegiatan" } })

    const articles = [
      {
        title: "Jalur SNBP 2026 Sebanyak 83 Siswa SMKN 1 Surabaya Tembus PTN Ternama",
        content: "<p>Sebanyak 83 siswa SMKN 1 Surabaya dinyatakan lolos ke Perguruan Tinggi Negeri melalui jalur prestasi tahun 2026. Hal ini membuktikan kualitas lulusan vokasi yang mampu bersaing secara akademik.</p><p>Keberhasilan ini merupakan wujud nyata dari komitmen sekolah dalam mendukung prestasi akademik siswa melalui program bimbingan intensif dan pengembangan potensi diri.</p>",
        slug: "snbp-2026-83-siswa-tembus-ptn",
        thumbnailUrl: "https://images.unsplash.com/photo-1523050853063-bd80e292472d?auto=format&fit=crop&q=80&w=800",
        status: "PUBLISHED" as const,
        authorId: admin.id,
        categoryId: prestasiCategory?.id ?? null,
        publishedAt: new Date("2026-04-15"),
      },
      {
        title: "SMKN 1 Surabaya Sabet Juara Umum LKS Tingkat Kota 2026",
        content: "<p>Kontingen siswa SMKN 1 Surabaya berhasil memborong medali pada ajang Lomba Kompetensi Siswa (LKS) tingkat Kota Surabaya tahun 2026.</p><p>Prestasi ini semakin mengukuhkan posisi SMKN 1 Surabaya sebagai sekolah kejuruan terdepan di Surabaya.</p>",
        slug: "juara-umum-lks-kota-2026",
        thumbnailUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
        status: "PUBLISHED" as const,
        authorId: admin.id,
        categoryId: beritaCategory?.id ?? null,
        publishedAt: new Date("2026-04-10"),
      },
      {
        title: "Kunjungan Industri Jurusan PPLG ke Perusahaan Teknologi",
        content: "<p>Siswa jurusan Pengembangan Perangkat Lunak dan Gim (PPLG) mendapatkan wawasan langsung dari praktisi industri melalui program kunjungan industri.</p><p>Kegiatan ini bertujuan untuk memberikan gambaran nyata tentang dunia kerja di bidang teknologi informasi.</p>",
        slug: "kunjungan-industri-pplg-2026",
        thumbnailUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=80&w=800",
        status: "PUBLISHED" as const,
        authorId: admin.id,
        categoryId: kegiatanCategory?.id ?? null,
        publishedAt: new Date("2026-04-05"),
      },
    ]

    for (const article of articles) {
      await prisma.article.create({ data: article })
    }
    console.log(`✅ Sample articles created: ${articles.length} items`)
  } else {
    console.log(`⏭️  Articles already exist (${existingArticles}), skipping`)
  }

  console.log("🌱 Seeding complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
