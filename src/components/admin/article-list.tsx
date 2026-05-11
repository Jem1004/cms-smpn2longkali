"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, Plus, Pencil, Globe, Trash2, ChevronLeft, ChevronRight, Tag } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { DataTable, type Column } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { publishArticle, deleteArticle } from "@/actions/article"
import { createCategory, updateCategory, deleteCategory } from "@/actions/category"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArticleRow {
  id: string
  title: string
  slug: string
  status: "DRAFT" | "PUBLISHED"
  viewCount?: number
  uniqueViewCount?: number
  createdAt: string
  publishedAt: string | null
  author: { id: string; name: string } | null
  category: { id: string; name: string; slug: string } | null
}

interface CategoryRow {
  id: string
  name: string
  slug: string
  _count: { articles: number }
}

interface ArticleListProps {
  articles: ArticleRow[]
  categories: CategoryRow[]
  page: number
  totalPages: number
  total: number
  canPublish: boolean
  canDelete: boolean
  canManageCategories: boolean
}

// ─── Slug helper ──────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArticleList({
  articles,
  categories,
  page,
  totalPages,
  total,
  canPublish,
  canDelete,
  canManageCategories,
}: ArticleListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Article state
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "")
  const [deleteTarget, setDeleteTarget] = useState<ArticleRow | null>(null)

  // Category state
  const [categoryList, setCategoryList] = useState<CategoryRow[]>(categories)
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [catDeleteDialogOpen, setCatDeleteDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<CategoryRow | null>(null)
  const [deletingCat, setDeletingCat] = useState<CategoryRow | null>(null)
  const [catName, setCatName] = useState("")
  const [catSlug, setCatSlug] = useState("")
  const [catSlugManual, setCatSlugManual] = useState(false)
  const [catErrors, setCatErrors] = useState<Record<string, string[]>>({})

  // ─── Article handlers ──────────────────────────────────────────────────────

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== "page") params.delete("page")
    router.push(`/admin/berita?${params.toString()}`)
  }

  function handleSearch() {
    updateParams("search", searchValue.trim())
  }

  function handlePublish(id: string) {
    startTransition(async () => {
      const result = await publishArticle(id)
      if (result.success) {
        toast.success("Artikel berhasil dipublikasikan")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDeleteArticle() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteArticle(deleteTarget.id)
      if (result.success) {
        toast.success("Artikel berhasil dihapus")
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  // ─── Category handlers ─────────────────────────────────────────────────────

  function openCreateCat() {
    setEditingCat(null)
    setCatName("")
    setCatSlug("")
    setCatSlugManual(false)
    setCatErrors({})
    setCatDialogOpen(true)
  }

  function openEditCat(cat: CategoryRow) {
    setEditingCat(cat)
    setCatName(cat.name)
    setCatSlug(cat.slug)
    setCatSlugManual(true)
    setCatErrors({})
    setCatDialogOpen(true)
  }

  function handleCatNameChange(value: string) {
    setCatName(value)
    if (!catSlugManual) setCatSlug(generateSlug(value))
  }

  function handleSaveCat() {
    setCatErrors({})
    startTransition(async () => {
      let result
      if (editingCat) {
        result = await updateCategory(editingCat.id, { name: catName, slug: catSlug })
      } else {
        result = await createCategory({ name: catName, slug: catSlug })
      }

      if (!result.success) {
        if (result.fieldErrors) setCatErrors(result.fieldErrors)
        toast.error(result.error)
        return
      }

      if (editingCat) {
        setCategoryList(prev =>
          prev.map(c => c.id === editingCat.id
            ? { ...c, name: result.data.name, slug: result.data.slug }
            : c
          )
        )
        toast.success("Kategori berhasil diperbarui")
      } else {
        setCategoryList(prev => [...prev, { ...result.data, _count: { articles: 0 } }])
        toast.success("Kategori berhasil dibuat")
      }
      setCatDialogOpen(false)
    })
  }

  function handleDeleteCat() {
    if (!deletingCat) return
    startTransition(async () => {
      const result = await deleteCategory(deletingCat.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setCategoryList(prev => prev.filter(c => c.id !== deletingCat.id))
      toast.success("Kategori berhasil dihapus")
      setCatDeleteDialogOpen(false)
      setDeletingCat(null)
    })
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // ─── Table columns ─────────────────────────────────────────────────────────

  const articleColumns: Column<ArticleRow>[] = [
    {
      key: "title",
      header: "Judul",
      render: (item) => (
        <div className="max-w-[300px]">
          <p className="font-medium truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground truncate">/{item.slug}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Kategori",
      render: (item) => item.category?.name
        ? <Badge variant="outline">{item.category.name}</Badge>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge variant={item.status === "PUBLISHED" ? "default" : "secondary"}>
          {item.status === "PUBLISHED" ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "views",
      header: "Views",
      render: (item) => (
        <div className="text-sm">
          {item.viewCount !== undefined && item.viewCount > 0 ? (
            <span className="font-medium">{item.viewCount.toLocaleString("id-ID")}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      key: "author",
      header: "Penulis",
      render: (item) => item.author?.name ?? "-",
    },
    {
      key: "date",
      header: "Tanggal",
      render: (item) => formatDate(item.publishedAt ?? item.createdAt),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/admin/berita/${item.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          {canPublish && item.status === "DRAFT" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600"
              onClick={() => handlePublish(item.id)}
              disabled={isPending}
            >
              <Globe className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleteTarget(item)}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const categoryColumns: Column<CategoryRow>[] = [
    {
      key: "name",
      header: "Nama",
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "slug",
      header: "Slug",
      render: (item) => (
        <code className="rounded bg-muted px-2 py-1 text-sm">{item.slug}</code>
      ),
    },
    {
      key: "count",
      header: "Artikel",
      render: (item) => <Badge variant="secondary">{item._count.articles}</Badge>,
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCat(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => { setDeletingCat(item); setCatDeleteDialogOpen(true) }}
            disabled={item._count.articles > 0}
            title={item._count.articles > 0 ? "Tidak bisa dihapus, masih ada artikel" : "Hapus"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Berita</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Kelola artikel dan kategori portal sekolah.
          </p>
        </div>
        <Button asChild className="relative z-10 bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-lg shadow-[#002244]/20 font-bold transition-all hover:-translate-y-0.5">
          <Link href="/admin/berita/baru">
            <Plus className="mr-2 h-4 w-4" />
            Tulis Artikel Baru
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="artikel">
        <TabsList className="bg-white border border-slate-200/60 rounded-xl p-1 shadow-sm">
          <TabsTrigger value="artikel" className="rounded-lg data-[state=active]:bg-[#002244] data-[state=active]:text-white">
            Artikel
            <Badge variant="secondary" className="ml-2 text-xs">{total}</Badge>
          </TabsTrigger>
          {canManageCategories && (
            <TabsTrigger value="kategori" className="rounded-lg data-[state=active]:bg-[#002244] data-[state=active]:text-white">
              <Tag className="mr-1.5 h-3.5 w-3.5" />
              Kategori
              <Badge variant="secondary" className="ml-2 text-xs">{categoryList.length}</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Tab: Artikel ── */}
        <TabsContent value="artikel" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari judul artikel..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
                  className="pl-9 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#002244] rounded-xl"
                />
              </div>
              <Button variant="outline" size="icon" onClick={handleSearch} className="h-11 w-11 rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100 hidden sm:flex">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select
                value={searchParams.get("categoryId") ?? ""}
                onValueChange={(v) => updateParams("categoryId", v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[160px] h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categoryList.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={searchParams.get("status") ?? ""}
                onValueChange={(v) => updateParams("status", v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[140px] h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <DataTable columns={articleColumns} data={articles} emptyMessage="Belum ada artikel" />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams("page", String(page - 1))}>
                  <ChevronLeft className="mr-1 h-4 w-4" />Sebelumnya
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams("page", String(page + 1))}>
                  Selanjutnya<ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Kategori ── */}
        {canManageCategories && (
          <TabsContent value="kategori" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button onClick={openCreateCat} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl font-bold">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kategori
              </Button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <DataTable
                columns={categoryColumns}
                data={categoryList}
                emptyMessage="Belum ada kategori"
              />
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* ── Dialog: Delete Article ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Artikel</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus artikel &quot;{deleteTarget?.title}&quot;?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteArticle} disabled={isPending}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Create/Edit Category ── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
            <DialogDescription>
              {editingCat ? "Perbarui informasi kategori" : "Buat kategori baru untuk artikel"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nama Kategori</Label>
              <Input
                id="cat-name"
                placeholder="Contoh: Pengumuman"
                value={catName}
                onChange={(e) => handleCatNameChange(e.target.value)}
              />
              {catErrors.name && <p className="text-sm text-destructive">{catErrors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                placeholder="contoh-slug"
                value={catSlug}
                onChange={(e) => { setCatSlug(e.target.value); setCatSlugManual(true) }}
              />
              {catErrors.slug && <p className="text-sm text-destructive">{catErrors.slug[0]}</p>}
              <p className="text-xs text-muted-foreground">Hanya huruf kecil, angka, dan strip.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCatDialogOpen(false)} disabled={isPending}>Batal</Button>
              <Button onClick={handleSaveCat} disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Delete Category ── */}
      <Dialog open={catDeleteDialogOpen} onOpenChange={setCatDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori &quot;{deletingCat?.name}&quot;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCatDeleteDialogOpen(false)} disabled={isPending}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteCat} disabled={isPending}>
              {isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
