"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, ChevronDown, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUploader } from "@/components/admin/image-uploader"
import { updateInstitutionalContent } from "@/actions/content"
import type { HeroContent, HeroSlide, ProfileContent, PrincipalContent } from "@/types"

const STATIC_ROUTES = [
  { label: "Beranda", url: "/" },
  { label: "Berita", url: "/berita" },
  { label: "Galeri", url: "/galeri" },
  { label: "Jurusan", url: "/jurusan" },
  { label: "Guru & Tendik", url: "/guru-tendik" },
  { label: "Pengumuman", url: "/pengumuman" },
  { label: "Agenda", url: "/agenda" },
  { label: "Kontak & Pengaduan", url: "/kontak" },
  { label: "Pendaftaran Siswa", url: "/daftar" },
]

interface ContentManagerProps {
  heroContent: HeroContent | null
  profileContent: ProfileContent | null
  principalContent: PrincipalContent | null
  pages: { title: string; slug: string }[]
  articles: { title: string; slug: string }[]
}

const defaultHero: HeroContent = { slides: [] }

const defaultProfile: ProfileContent = {
  description: "",
  videoUrl: "",
  visi: "",
  misi: "",
  sejarah: "",
}

const defaultPrincipal: PrincipalContent = {
  message: "",
  name: "",
  title: "",
  photoUrl: "",
}

export function ContentManager({
  heroContent,
  profileContent,
  principalContent,
  pages,
  articles,
}: ContentManagerProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Container Modernized */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 w-full">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Konten Landing Page</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Kelola konten yang tampil di halaman utama website. 
            Untuk halaman mandiri (Profil, Jurusan, dll) — gunakan{" "}
            <Link href="/admin/halaman" className="text-blue-600 font-bold hover:underline underline-offset-2">
              Halaman Kustom
            </Link>.
          </p>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/50">
          <TabsTrigger value="hero" className="rounded-xl data-[state=active]:shadow-sm data-[state=active]:font-bold data-[state=active]:bg-[#002244] data-[state=active]:text-white transition-all">Hero Section</TabsTrigger>
          <TabsTrigger value="profil" className="rounded-xl data-[state=active]:shadow-sm data-[state=active]:font-bold data-[state=active]:bg-[#002244] data-[state=active]:text-white transition-all">Profil & Video</TabsTrigger>
          <TabsTrigger value="prakata" className="rounded-xl data-[state=active]:shadow-sm data-[state=active]:font-bold data-[state=active]:bg-[#002244] data-[state=active]:text-white transition-all">Prakata Kepsek</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroTab initialData={heroContent ?? defaultHero} pages={pages} articles={articles} />
        </TabsContent>

        <TabsContent value="profil">
          <ProfilTab initialData={profileContent ?? defaultProfile} />
        </TabsContent>

        <TabsContent value="prakata">
          <PrakataTab initialData={principalContent ?? defaultPrincipal} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================
// Hero Section Tab — Slider
// ============================================

function HeroTab({ initialData, pages, articles }: {
  initialData: HeroContent
  pages: { title: string; slug: string }[]
  articles: { title: string; slug: string }[]
}) {
  const initialSlides: HeroSlide[] = Array.isArray(initialData.slides)
    ? initialData.slides
    : []

  // Track ctaType per slide separately so switching to External with empty URL works
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [expandedId, setExpandedId] = useState<string | null>(initialSlides[0]?.id ?? null)
  const [ctaTypes, setCtaTypes] = useState<Record<string, "INTERNAL" | "EXTERNAL">>(() => {
    const map: Record<string, "INTERNAL" | "EXTERNAL"> = {}
    initialSlides.forEach((s) => {
      map[s.id] = s.ctaUrl.startsWith("http://") || s.ctaUrl.startsWith("https://") ? "EXTERNAL" : "INTERNAL"
    })
    return map
  })
  const [saving, setSaving] = useState(false)

  function addSlide() {
    if (slides.length >= 5) { toast.error("Maksimal 5 slide"); return }
    const id = crypto.randomUUID()
    setSlides((prev) => [...prev, { id, title: "", description: "", imageUrl: "", badgeLabel: "", ctaText: "Baca Lebih Lanjut", ctaUrl: "/berita" }])
    setCtaTypes((prev) => ({ ...prev, [id]: "INTERNAL" }))
    setExpandedId(id) // auto-expand slide baru
  }

  function removeSlide(id: string) {
    setSlides((prev) => {
      const next = prev.filter((s) => s.id !== id)
      // Jika yang dihapus sedang expand, expand slide sebelumnya
      if (expandedId === id) setExpandedId(next[next.length - 1]?.id ?? null)
      return next
    })
    setCtaTypes((prev) => { const next = { ...prev }; delete next[id]; return next })
  }

  function updateSlide(id: string, field: keyof HeroSlide, value: string) {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  function setCtaType(id: string, type: "INTERNAL" | "EXTERNAL") {
    setCtaTypes((prev) => ({ ...prev, [id]: type }))
    updateSlide(id, "ctaUrl", type === "INTERNAL" ? "/" : "https://")
  }
  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateInstitutionalContent("HERO", { slides })
      if (result.success) {
        toast.success("Hero section berhasil disimpan")
      } else {
        toast.error(result.error || "Gagal menyimpan hero section")
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Hero Section Slider</CardTitle>
          <CardDescription className="mt-1">
            Tampil di bagian paling atas landing page. Maks. 5 slide, bergantian otomatis setiap 5 detik.
          </CardDescription>
        </div>
        <Button onClick={addSlide} disabled={slides.length >= 5} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-md transition-all active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> Tambah Slide
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {slides.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 bg-slate-50/50">
            <p className="font-medium">Belum ada slide tayangan.</p>
            <p className="text-sm mt-1 text-slate-400">Klik &quot;Tambah Slide&quot; di atas untuk membuat urutan gambar slider.</p>
          </div>
        )}

        {slides.map((slide, index) => {
          const isOpen = expandedId === slide.id
          const hasTitle = slide.title.trim()
          return (
            <div key={slide.id} className={`rounded-2xl border transition-all ${isOpen ? "border-[#002244]/30 shadow-md" : "border-slate-200 shadow-sm"}`}>
              {/* Accordion Header — always visible */}
              <div
                onClick={() => setExpandedId(isOpen ? null : slide.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/80 rounded-2xl transition-colors cursor-pointer"
              >
                {/* Slide thumbnail preview */}
                <div className="w-12 h-8 rounded-md overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                  {slide.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-3 w-3 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Slide {index + 1}</span>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {hasTitle ? slide.title : <span className="text-slate-400 italic">Belum ada judul</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-red-50 rounded-lg h-7 px-2 text-xs"
                    onClick={(e) => { e.stopPropagation(); removeSlide(slide.id) }}
                  >
                    Hapus
                  </Button>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* Accordion Body — collapsible */}
              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                  <div className="pt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Judul</Label>
                      <Input
                        placeholder="Judul slide"
                        value={slide.title}
                        onChange={(e) => updateSlide(slide.id, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label Badge</Label>
                      <Input
                        placeholder="Contoh: Prestasi Siswa"
                        value={slide.badgeLabel}
                        onChange={(e) => updateSlide(slide.id, "badgeLabel", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea
                      placeholder="Deskripsi singkat slide (maks. 200 karakter)"
                      rows={2}
                      value={slide.description}
                      onChange={(e) => updateSlide(slide.id, "description", e.target.value)}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">{slide.description.length}/200</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Gambar Slide</Label>
                    <ImageUploader
                      currentImageUrl={slide.imageUrl || undefined}
                      onUploadComplete={(url) => updateSlide(slide.id, "imageUrl", url)}
                      
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Tombol CTA</Label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Teks Tombol</Label>
                        <Input
                          placeholder="Baca Lebih Lanjut"
                          value={slide.ctaText}
                          onChange={(e) => updateSlide(slide.id, "ctaText", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Tipe Link</Label>
                        <Select
                          value={ctaTypes[slide.id] ?? "INTERNAL"}
                          onValueChange={(val) => setCtaType(slide.id, val as "INTERNAL" | "EXTERNAL")}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INTERNAL">Internal (halaman website)</SelectItem>
                            <SelectItem value="EXTERNAL">External (link luar)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {ctaTypes[slide.id] === "EXTERNAL" ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">URL External</Label>
                        <Input
                          placeholder="https://example.com"
                          value={slide.ctaUrl}
                          onChange={(e) => updateSlide(slide.id, "ctaUrl", e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Tujuan Halaman</Label>
                        <Select value={slide.ctaUrl} onValueChange={(val) => updateSlide(slide.id, "ctaUrl", val)}>
                          <SelectTrigger><SelectValue placeholder="Pilih halaman..." /></SelectTrigger>
                          <SelectContent>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Rute Tetap</div>
                            {STATIC_ROUTES.map((r) => (
                              <SelectItem key={r.url} value={r.url}>
                                {r.label} <span className="text-xs text-muted-foreground ml-1">{r.url}</span>
                              </SelectItem>
                            ))}
                            {articles.length > 0 && (
                              <>
                                <Separator className="my-1" />
                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Artikel Berita</div>
                                {articles.map((a) => (
                                  <SelectItem key={a.slug} value={`/berita/${a.slug}`}>{a.title}</SelectItem>
                                ))}
                              </>
                            )}
                            {pages.length > 0 && (
                              <>
                                <Separator className="my-1" />
                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Halaman Kustom</div>
                                {pages.map((p) => (
                                  <SelectItem key={p.slug} value={`/halaman/${p.slug}`}>{p.title}</SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {slide.ctaUrl && (
                          <p className="text-xs text-muted-foreground">
                            URL: <code className="bg-muted px-1 rounded">{slide.ctaUrl}</code>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {slides.length > 0 && (
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-lg shadow-[#002244]/20 font-bold transition-all hover:-translate-y-0.5 px-6">
              {saving ? "Menyimpan..." : "Simpan Konfigurasi Hero"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// Profil Tab — hanya description + videoUrl
// (tampil di section Profil & Berita Terbaru landing page)
// ============================================

function ProfilTab({ initialData }: { initialData: ProfileContent }) {
  const [description, setDescription] = useState(initialData.description)
  const [videoUrl, setVideoUrl] = useState(initialData.videoUrl)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      // Preserve existing visi/misi/sejarah values when saving
      const result = await updateInstitutionalContent("PROFILE", {
        description,
        videoUrl,
        visi: initialData.visi,
        misi: initialData.misi,
        sejarah: initialData.sejarah,
      })
      if (result.success) {
        toast.success("Profil sekolah berhasil disimpan")
      } else {
        toast.error(result.error || "Gagal menyimpan profil")
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil &amp; Video</CardTitle>
        <CardDescription>
          Tampil di section &quot;Profil Sekolah&quot; di landing page — bagian kiri layout 2 kolom.
          Untuk konten Visi, Misi, Sejarah — buat di{" "}
          <Link href="/admin/halaman" className="text-primary underline underline-offset-2">
            Halaman Kustom
          </Link>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="profil-description">Deskripsi Singkat</Label>
            {description && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDescription("")}
                className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Hapus Deskripsi
              </Button>
            )}
          </div>
          <Textarea
            id="profil-description"
            placeholder="Deskripsi singkat profil sekolah yang tampil di landing page"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Tampil sebagai teks deskripsi di bawah video profil. Kosongkan jika tidak diperlukan.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="profil-videoUrl">URL Video Profil</Label>
            {videoUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVideoUrl("")}
                className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Hapus Video
              </Button>
            )}
          </div>
          <Input
            id="profil-videoUrl"
            placeholder="https://youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Mendukung URL YouTube. Video akan di-embed di landing page. Kosongkan jika sekolah belum memiliki video profil.
          </p>
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 space-y-1.5 text-xs text-amber-800">
          <p className="font-bold">💡 Tips Menghilangkan Section Profil:</p>
          <p className="text-amber-700">
            Jika Anda ingin <strong>menghilangkan secara total</strong> section Profil Sekolah ini dari halaman <i>landing page</i> (Beranda), pastikan <strong>kedua kolom di atas (Deskripsi & Video) dalam keadaan kosong</strong>.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-lg shadow-[#002244]/20 font-bold transition-all hover:-translate-y-0.5 px-6">
            {saving ? "Menyimpan..." : "Simpan Pengaturan Profil"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Prakata Kepala Sekolah Tab
// ============================================

function PrakataTab({ initialData }: { initialData: PrincipalContent }) {
  const [data, setData] = useState<PrincipalContent>(initialData)
  const [saving, setSaving] = useState(false)

  function update(field: keyof PrincipalContent, value: string) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const result = await updateInstitutionalContent("PRINCIPAL_MESSAGE", data)
      if (result.success) {
        toast.success("Prakata kepala sekolah berhasil disimpan")
      } else {
        toast.error(result.error || "Gagal menyimpan prakata")
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prakata Kepala Sekolah</CardTitle>
        <CardDescription>
          Tampil di section prakata dengan background biru dan pola titik di landing page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prakata-message">Teks Prakata</Label>
          <Textarea
            id="prakata-message"
            placeholder="Teks prakata kepala sekolah"
            rows={6}
            value={data.message}
            onChange={(e) => update("message", e.target.value)}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prakata-name">Nama Kepala Sekolah</Label>
            <Input
              id="prakata-name"
              placeholder="Nama lengkap"
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prakata-title">Jabatan</Label>
            <Input
              id="prakata-title"
              placeholder="Kepala Sekolah"
              value={data.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prakata-photoUrl">Foto Kepala Sekolah</Label>
          <ImageUploader
            currentImageUrl={data.photoUrl || undefined}
            onUploadComplete={(url) => update("photoUrl", url)}
          />
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-1.5 text-xs text-blue-800">
            <p className="font-bold">📸 Panduan foto untuk tampilan terbaik:</p>
            <ul className="space-y-1 text-blue-700 list-disc list-inside">
              <li>Format <strong>PNG dengan background transparan</strong> — foto menyatu langsung dengan background biru section</li>
              <li>Rasio <strong>portrait (2:3)</strong> — contoh ukuran: <strong>600×900px</strong> atau <strong>800×1200px</strong></li>
              <li>Subjek dari <strong>pinggang ke atas</strong> — bukan full body atau close-up wajah</li>
              <li>Untuk menghapus background foto, gunakan <a href="https://remove.bg" target="_blank" rel="noopener noreferrer" className="underline font-semibold">remove.bg</a> (gratis)</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-lg shadow-[#002244]/20 font-bold transition-all hover:-translate-y-0.5 px-6">
            {saving ? "Menyimpan..." : "Simpan Prakata"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// Jurusan Tab — Department Content
// ============================================
// Jurusan Tab — now uses DepartmentManager component
// ============================================
