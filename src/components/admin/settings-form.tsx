"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Building2, Phone, Share2, Save, LayoutTemplate, Plus, Trash2, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUploader } from "@/components/admin/image-uploader"
import { updateIdentity, updateContact, updateSocial, updateFooter } from "@/actions/settings"
import { toggleSpmbEnabled } from "@/actions/registration"
import { toggleGraduationEnabled } from "@/actions/graduation"
import type { SiteSettings, SiteIdentity, SiteContact, SiteSocial, SiteFooter, SiteFooterLink } from "@/types"

interface SettingsFormProps {
  initialSettings: SiteSettings
  spmbEnabled: boolean
  graduationEnabled: boolean
}

export function SettingsForm({ initialSettings, spmbEnabled, graduationEnabled }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  
  // Identity state
  const [identity, setIdentity] = useState<SiteIdentity>(initialSettings.identity)
  const [identityErrors, setIdentityErrors] = useState<Record<string, string[]>>({})
  
  // Contact state
  const [contact, setContact] = useState<SiteContact>(initialSettings.contact)
  const [contactErrors, setContactErrors] = useState<Record<string, string[]>>({})
  
  // Social state
  const [social, setSocial] = useState<SiteSocial>(initialSettings.social)
  const [socialErrors, setSocialErrors] = useState<Record<string, string[]>>({})

  // Footer state
  const [footerLinks, setFooterLinks] = useState<SiteFooterLink[]>(initialSettings.footer?.links ?? [])

  // Feature state
  const [spmbOn, setSpmbOn] = useState(spmbEnabled)
  const [graduationOn, setGraduationOn] = useState(graduationEnabled)

  function handleSaveIdentity() {
    setIdentityErrors({})
    startTransition(async () => {
      const result = await updateIdentity(identity)
      if (!result.success) {
        if (result.fieldErrors) setIdentityErrors(result.fieldErrors)
        toast.error(result.error)
        return
      }
      toast.success("Identitas sekolah berhasil disimpan")
    })
  }

  function handleSaveContact() {
    setContactErrors({})
    startTransition(async () => {
      const result = await updateContact(contact)
      if (!result.success) {
        if (result.fieldErrors) setContactErrors(result.fieldErrors)
        toast.error(result.error)
        return
      }
      toast.success("Informasi kontak berhasil disimpan")
    })
  }

  function handleSaveSocial() {
    setSocialErrors({})
    startTransition(async () => {
      const result = await updateSocial(social)
      if (!result.success) {
        if (result.fieldErrors) setSocialErrors(result.fieldErrors)
        toast.error(result.error)
        return
      }
      toast.success("Media sosial berhasil disimpan")
    })
  }

  function handleToggleSpmb() {
    startTransition(async () => {
      const result = await toggleSpmbEnabled(!spmbOn)
      if (!result.success) { toast.error(result.error); return }
      setSpmbOn(!spmbOn)
      toast.success(spmbOn ? "Fitur SPMB dinonaktifkan" : "Fitur SPMB diaktifkan")
    })
  }

  function handleToggleGraduation() {
    startTransition(async () => {
      const result = await toggleGraduationEnabled(!graduationOn)
      if (!result.success) { toast.error(result.error); return }
      setGraduationOn(!graduationOn)
      toast.success(graduationOn ? "Fitur Kelulusan dinonaktifkan" : "Fitur Kelulusan diaktifkan")
    })
  }

  function handleSaveFooter() {    startTransition(async () => {
      const result = await updateFooter({ links: footerLinks })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Footer berhasil disimpan")
    })
  }

  function addFooterLink() {
    setFooterLinks((prev) => [...prev, { id: crypto.randomUUID(), label: "", url: "" }])
  }

  function removeFooterLink(id: string) {
    setFooterLinks((prev) => prev.filter((l) => l.id !== id))
  }

  function updateFooterLink(id: string, field: keyof SiteFooterLink, value: string) {
    setFooterLinks((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l))
  }


  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Premium Header */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-start gap-2 relative overflow-hidden">
        {/* Subtle decorative blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 relative z-10">
          Pengaturan Situs
        </h1>
        <p className="text-slate-500 relative z-10 font-medium">
          Konfigurasi identitas global, informasi kontak, dan media sosial sekolah Anda.
        </p>
      </div>

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList className="bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/50 flex w-max mx-auto shadow-inner">
          <TabsTrigger value="identity" className="rounded-xl data-[state=active]:bg-[#002244] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-sm px-6 py-2.5 transition-all text-slate-500 font-medium">
            <Building2 className="mr-2 h-4 w-4" />
            Identitas
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-xl data-[state=active]:bg-[#002244] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-sm px-6 py-2.5 transition-all text-slate-500 font-medium">
            <Phone className="mr-2 h-4 w-4" />
            Kontak
          </TabsTrigger>
          <TabsTrigger value="social" className="rounded-xl data-[state=active]:bg-[#002244] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-sm px-6 py-2.5 transition-all text-slate-500 font-medium">
            <Share2 className="mr-2 h-4 w-4" />
            Media Sosial
          </TabsTrigger>
          <TabsTrigger value="footer" className="rounded-xl data-[state=active]:bg-[#002244] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-sm px-6 py-2.5 transition-all text-slate-500 font-medium">
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="fitur" className="rounded-xl data-[state=active]:bg-[#002244] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-sm px-6 py-2.5 transition-all text-slate-500 font-medium">
            <Zap className="mr-2 h-4 w-4" />
            Fitur
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Identitas ── */}
        <TabsContent value="identity" className="outline-none focus:ring-0">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Informasi Dasar</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-semibold">Nama Sekolah Lengkap</Label>
                <Input
                  id="name"
                  placeholder="SMKN 1 Surabaya"
                  value={identity.name}
                  onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                />
                {identityErrors.name && <p className="text-sm text-destructive font-medium">{identityErrors.name[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortName" className="text-slate-700 font-semibold">Nama Singkat (Sebutan)</Label>
                <Input
                  id="shortName"
                  placeholder="SMKN 1"
                  value={identity.shortName}
                  onChange={(e) => setIdentity({ ...identity, shortName: e.target.value })}
                />
                {identityErrors.shortName && <p className="text-sm text-destructive font-medium">{identityErrors.shortName[0]}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-slate-700 font-semibold">Tagline Sekolah</Label>
              <Input
                id="tagline"
                placeholder="Berkarakter, Kompeten, Inovatif"
                value={identity.tagline}
                onChange={(e) => setIdentity({ ...identity, tagline: e.target.value })}
              />
              <p className="text-xs text-slate-400 font-medium">Slogan pendek yang tampil berdampingan dengan logo.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 font-semibold">Deskripsi Publik</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi profil singkat sekolah untuk keperluan metadata..."
                rows={3}
                value={identity.description}
                onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
              />
              <p className="text-xs text-slate-400 font-medium">Teks singkat ini muncul di *footer* web dan deskripsi pencarian Google.</p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
               <h2 className="text-lg font-bold text-slate-800">Logo Institusi</h2>
               <div className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl">
                 <ImageUploader
                   onUploadComplete={(url) => setIdentity({ ...identity, logoUrl: url })}
                   currentImageUrl={identity.logoUrl || undefined}
                   
                   acceptedFormats={["image/png", "image/jpeg", "image/webp"]}
                 />
                 <p className="text-xs text-slate-400 font-medium mt-3 text-center">
                   Rekomendasi: Resolusi tinggi (min 500x500px), format WebP atau PNG transparan.
                 </p>
                 {identityErrors.logoUrl && <p className="text-sm text-destructive font-medium mt-1 text-center">{identityErrors.logoUrl[0]}</p>}
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Favicon</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">Ikon kecil yang tampil di tab browser. Gunakan gambar persegi (1:1).</p>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl">
                <div className="flex items-start gap-6">
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                      {identity.faviconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={identity.faviconUrl} alt="Favicon preview" className="w-10 h-10 object-contain" />
                      ) : (
                        <span className="text-2xl">🏫</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">Preview</p>
                  </div>
                  <div className="flex-1">
                    <ImageUploader
                      onUploadComplete={(url) => setIdentity({ ...identity, faviconUrl: url })}
                      currentImageUrl={identity.faviconUrl || undefined}
                      
                      acceptedFormats={["image/png", "image/jpeg", "image/webp"]}
                    />
                    <p className="text-xs text-slate-400 font-medium mt-2">
                      Rekomendasi: PNG persegi, ukuran 32x32px atau 64x64px.
                    </p>
                    {identityErrors.faviconUrl && <p className="text-sm text-destructive font-medium mt-1">{identityErrors.faviconUrl[0]}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button onClick={handleSaveIdentity} disabled={isPending} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-md transition-all active:scale-95 px-8 font-semibold h-11">
                <Save className="mr-2 h-4 w-4" />
                {isPending ? "Menyimpan..." : "Simpan Perubahan Identitas"}
              </Button>
            </div>
          </div>
        </TabsContent>


        {/* ── Tab: Kontak ── */}
        <TabsContent value="contact" className="outline-none focus:ring-0">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Saluran Kontak Resmi</h2>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700 font-semibold">Alamat Lengkap</Label>
              <Textarea
                id="address"
                placeholder="Jl. SMEA No. 4, Wonokromo, Surabaya"
                rows={2}
                value={contact.address}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 font-semibold">Nomor Telepon</Label>
                <Input
                  id="phone"
                  placeholder="(031) 8881234"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold">Alamat Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@sekolah.sch.id"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                />
                {contactErrors.email && <p className="text-sm text-destructive font-medium">{contactErrors.email[0]}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="whatsapp" className="text-slate-700 font-semibold">Nomor WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="628123456789 (format internasional, tanpa + atau spasi)"
                  value={contact.whatsapp ?? ""}
                  onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                />
                <p className="text-xs text-slate-400">Digunakan untuk halaman Kontak & Pengaduan. Contoh: <code className="bg-slate-100 px-1 rounded">628123456789</code></p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Lokasi di Maps</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Embed Google Maps yang tampil di footer website. Buka Google Maps → klik &quot;Bagikan&quot; → &quot;Sematkan peta&quot; → salin URL dari atribut <code className="bg-slate-100 px-1 rounded">src</code> pada kode iframe.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapsEmbedUrl" className="text-slate-700 font-semibold">URL Embed Google Maps</Label>
                <Input
                  id="mapsEmbedUrl"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  value={contact.mapsEmbedUrl ?? ""}
                  onChange={(e) => setContact({ ...contact, mapsEmbedUrl: e.target.value })}
                />
              </div>
              {contact.mapsEmbedUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 h-40">
                  <iframe
                    src={contact.mapsEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Preview Maps"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button onClick={handleSaveContact} disabled={isPending} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-md transition-all active:scale-95 px-8 font-semibold h-11">
                <Save className="mr-2 h-4 w-4" />
                {isPending ? "Menyimpan..." : "Simpan Informasi Kontak"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Media Sosial ── */}
        <TabsContent value="social" className="outline-none focus:ring-0">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-800">Tautan Media Sosial</h2>
              <p className="text-xs text-slate-400 font-medium">Kosongkan *field* jika Anda tidak ingin menampilkan logo media sosial tersebut di website publik.</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-slate-700 font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                    <Share2 className="h-3 w-3" />
                  </div>
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  placeholder="https://instagram.com/sekolah"
                  value={social.instagram}
                  onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                />
                {socialErrors.instagram && <p className="text-sm text-destructive font-medium">{socialErrors.instagram[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube" className="text-slate-700 font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Share2 className="h-3 w-3" />
                  </div>
                  YouTube
                </Label>
                <Input
                  id="youtube"
                  placeholder="https://youtube.com/@sekolah"
                  value={social.youtube}
                  onChange={(e) => setSocial({ ...social, youtube: e.target.value })}
                />
                {socialErrors.youtube && <p className="text-sm text-destructive font-medium">{socialErrors.youtube[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok" className="text-slate-700 font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                    <Share2 className="h-3 w-3" />
                  </div>
                  TikTok
                </Label>
                <Input
                  id="tiktok"
                  placeholder="https://tiktok.com/@sekolah"
                  value={social.tiktok}
                  onChange={(e) => setSocial({ ...social, tiktok: e.target.value })}
                />
                {socialErrors.tiktok && <p className="text-sm text-destructive font-medium">{socialErrors.tiktok[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-slate-700 font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Share2 className="h-3 w-3" />
                  </div>
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  placeholder="https://facebook.com/sekolah"
                  value={social.facebook}
                  onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
                />
                {socialErrors.facebook && <p className="text-sm text-destructive font-medium">{socialErrors.facebook[0]}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button onClick={handleSaveSocial} disabled={isPending} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-md transition-all active:scale-95 px-8 font-semibold h-11">
                <Save className="mr-2 h-4 w-4" />
                {isPending ? "Menyimpan..." : "Simpan Tautan Sosial"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Footer ── */}
        <TabsContent value="footer" className="outline-none focus:ring-0">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-8">

            {/* Section: Links Terkait */}
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Links Terkait</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Tampil di kolom &quot;Links Terkait&quot; footer. Gunakan untuk link aplikasi sekolah, portal siswa, PPDB, dll.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addFooterLink}
                  variant="outline"
                  className="rounded-xl border-slate-200 shrink-0"
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Link
                </Button>
              </div>

              {footerLinks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 bg-slate-50/50">
                  <p className="font-medium">Belum ada link.</p>
                  <p className="text-sm mt-1">Klik &quot;Tambah Link&quot; untuk menambahkan tautan ke footer.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {footerLinks.map((link, index) => (
                    <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                      <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{index + 1}</span>
                      <Input
                        placeholder="Label (contoh: BKK, LSP, PPDB)"
                        value={link.label}
                        onChange={(e) => updateFooterLink(link.id, "label", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="URL (contoh: https://ppdb.sekolah.sch.id)"
                        value={link.url}
                        onChange={(e) => updateFooterLink(link.id, "url", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFooterLink(link.id)}
                        className="text-destructive hover:bg-red-50 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Lokasi Maps */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Lokasi Sekolah (Maps)</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Embed Google Maps yang tampil di kolom &quot;Lokasi&quot; footer.
                </p>
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <p className="font-bold">⚠️ Gunakan URL Embed, bukan link share biasa</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-amber-700">
                    <li>Buka <strong>maps.google.com</strong> di browser</li>
                    <li>Cari lokasi sekolah</li>
                    <li>Klik ikon <strong>Bagikan</strong> → pilih tab <strong>Sematkan peta</strong></li>
                    <li>Klik <strong>Salin HTML</strong></li>
                    <li>Dari kode iframe yang disalin, ambil hanya URL di atribut <code className="bg-amber-100 px-1 rounded">src="..."</code></li>
                  </ol>
                  <p className="text-amber-600 mt-1">URL yang benar dimulai dengan: <code className="bg-amber-100 px-1 rounded">https://www.google.com/maps/embed?pb=</code></p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mapsEmbedUrl" className="text-slate-700 font-semibold">URL Embed Google Maps</Label>
                <Input
                  id="mapsEmbedUrl"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  value={contact.mapsEmbedUrl ?? ""}
                  onChange={(e) => setContact({ ...contact, mapsEmbedUrl: e.target.value })}
                />
              </div>
              {contact.mapsEmbedUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: "200px" }}>
                  <iframe
                    src={contact.mapsEmbedUrl}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Preview Maps"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                onClick={() => {
                  handleSaveFooter()
                  handleSaveContact()
                }}
                disabled={isPending}
                className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-md transition-all active:scale-95 px-8 font-semibold h-11"
              >
                <Save className="mr-2 h-4 w-4" />
                {isPending ? "Menyimpan..." : "Simpan Pengaturan Footer"}
              </Button>
            </div>
          </div>
        </TabsContent>
        {/* ── Tab: Fitur ── */}
        <TabsContent value="fitur" className="outline-none focus:ring-0">
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-800">Fitur Tambahan</h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Aktifkan atau nonaktifkan fitur sesuai kebutuhan sekolah.
              </p>
            </div>

            {/* SPMB Toggle */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">Pendaftaran Siswa Baru (SPMB)</p>
                <p className="text-xs text-slate-400 mt-1">
                  Aktifkan untuk menampilkan menu pendaftaran di sidebar admin dan halaman <code className="bg-slate-100 px-1 rounded">/daftar</code> di publik.
                  Nonaktifkan jika sekolah tidak menggunakan fitur ini.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleSpmb}
                disabled={isPending}
                className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  spmbOn ? "bg-[#002244]" : "bg-slate-300"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  spmbOn ? "translate-x-6" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Kelulusan Toggle */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <p className="font-semibold text-slate-800">Pengumuman Kelulusan</p>
                <p className="text-xs text-slate-400 mt-1">
                  Aktifkan untuk menampilkan menu kelulusan di sidebar admin dan halaman <code className="bg-slate-100 px-1 rounded">/kelulusan</code> di publik.
                  Nonaktifkan jika sekolah tidak menggunakan fitur ini.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleGraduation}
                disabled={isPending}
                className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  graduationOn ? "bg-[#002244]" : "bg-slate-300"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  graduationOn ? "translate-x-6" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}