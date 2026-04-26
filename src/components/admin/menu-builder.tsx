"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { saveMenuItems, deleteMenuItem } from "@/actions/menu"
import type { MenuItemWithChildren, MenuItemForm } from "@/types"

// ─── Types ───────────────────────────────────────────────────────

interface LocalMenuItem {
  id: string
  label: string
  url: string
  type: "INTERNAL" | "EXTERNAL"
  parentId: string | null
  order: number
  isHighlighted: boolean
  children: LocalMenuItem[]
}

interface MenuBuilderProps {
  items: MenuItemWithChildren[]
  pages: { title: string; slug: string }[]
  departments: { name: string; slug: string }[]
}

interface FormState {
  label: string
  url: string
  type: "INTERNAL" | "EXTERNAL"
  parentId: string | null
  isHighlighted: boolean
}

const emptyForm: FormState = {
  label: "",
  url: "",
  type: "INTERNAL",
  parentId: null,
  isHighlighted: false,
}

// ─── Sortable Item ───────────────────────────────────────────────

function SortableMenuItem({
  item,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  depth,
}: {
  item: LocalMenuItem
  isExpanded?: boolean
  onToggle?: () => void
  onEdit: () => void
  onDelete: () => void
  depth: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border bg-card p-3 ${
        depth > 0 ? "ml-8" : ""
      }`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {depth === 0 && item.children.length > 0 && (
        <button
          onClick={onToggle}
          className="text-muted-foreground hover:text-foreground"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <span className="font-medium truncate block">{item.label}</span>
        <span className="text-xs text-muted-foreground truncate block">
          {item.url}
        </span>
      </div>

      <Badge variant={item.type === "INTERNAL" ? "secondary" : "outline"}>
        {item.type === "INTERNAL" ? "Internal" : "External"}
      </Badge>
      {item.isHighlighted && (
        <Badge className="bg-[#FFC107] text-[#002244] hover:bg-[#FFC107]/80">Highlight</Badge>
      )}

      <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="Hapus"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}

// ─── Static internal routes ─────────────────────────────────────

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

// ─── URL Validation ──────────────────────────────────────────────

function isValidUrl(url: string, type: "INTERNAL" | "EXTERNAL"): boolean {
  if (!url.trim()) return false
  if (url === "#") return true  // label-only menu
  if (type === "INTERNAL") {
    return url.startsWith("/")
  }
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ─── Main Component ──────────────────────────────────────────────

export function MenuBuilder({ items: initialItems, pages, departments }: MenuBuilderProps) {
  const [menuItems, setMenuItems] = useState<LocalMenuItem[]>(() =>
    initialItems.map((item) => ({
      id: item.id,
      label: item.label,
      url: item.url,
      type: item.type,
      parentId: item.parentId,
      order: item.order,
      isHighlighted: item.isHighlighted ?? false,
      children: (item.children ?? []).map((child) => ({
        id: child.id,
        label: child.label,
        url: child.url,
        type: child.type,
        parentId: child.parentId,
        order: child.order,
        isHighlighted: child.isHighlighted ?? false,
        children: [],
      })),
    }))
  )

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(initialItems.map((i) => i.id))
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingParentId, setEditingParentId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<LocalMenuItem | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ─── Toggle expand ──────────────────────────────────────────

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(Array.from(prev))
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ─── Drag end handlers ──────────────────────────────────────

  function handleParentDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setMenuItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id)
      const newIndex = prev.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  function handleChildDragEnd(parentId: string, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setMenuItems((prev) =>
      prev.map((parent) => {
        if (parent.id !== parentId) return parent
        const oldIndex = parent.children.findIndex((c) => c.id === active.id)
        const newIndex = parent.children.findIndex((c) => c.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return parent
        return {
          ...parent,
          children: arrayMove(parent.children, oldIndex, newIndex),
        }
      })
    )
  }

  // ─── Form helpers ───────────────────────────────────────────

  function openAddForm(parentId: string | null = null) {
    setEditingId(null)
    setEditingParentId(null)
    setForm({ ...emptyForm, parentId })
    setFormErrors({})
    setFormOpen(true)
  }

  function openEditForm(item: LocalMenuItem, parentId: string | null) {
    setEditingId(item.id)
    setEditingParentId(parentId)
    setForm({
      label: item.label,
      url: item.url,
      type: item.type,
      parentId: item.parentId,
      isHighlighted: item.isHighlighted,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!form.label.trim()) errors.label = "Label wajib diisi"
    if (!form.url.trim()) errors.url = "URL wajib diisi"
    else if (!isValidUrl(form.url, form.type)) {
      errors.url =
        form.type === "INTERNAL"
          ? "URL internal harus diawali dengan /"
          : "URL external tidak valid"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleFormSave() {
    if (!validateForm()) return

    if (editingId) {
      // Edit existing item
      setMenuItems((prev) => {
        // Check if parent changed
        const wasChild = editingParentId !== null
        const willBeChild = form.parentId !== null

        if (wasChild && !willBeChild) {
          // Move from child to parent
          const updated = prev.map((p) => ({
            ...p,
            children: p.children.filter((c) => c.id !== editingId),
          }))
          return [
            ...updated,
            {
              id: editingId,
              label: form.label,
              url: form.url,
              type: form.type,
              isHighlighted: form.isHighlighted,
              parentId: null,
              order: updated.length,
              children: [],
            },
          ]
        }

        if (!wasChild && willBeChild) {
          // Move from parent to child
          const existing = prev.find((p) => p.id === editingId)
          const filtered = prev.filter((p) => p.id !== editingId)
          return filtered.map((p) => {
            if (p.id !== form.parentId) return p
            return {
              ...p,
              children: [
                ...p.children,
                ...(existing?.children ?? []),
                {
                  id: editingId,
                  label: form.label,
                  url: form.url,
                  type: form.type,
                  isHighlighted: form.isHighlighted,
                  parentId: form.parentId,
                  order: p.children.length,
                  children: [],
                },
              ],
            }
          })
        }

        // Same level edit
        return prev.map((p) => {
          if (p.id === editingId) {
            return { ...p, label: form.label, url: form.url, type: form.type, isHighlighted: form.isHighlighted }
          }
          return {
            ...p,
            children: p.children.map((c) =>
              c.id === editingId
                ? { ...c, label: form.label, url: form.url, type: form.type, isHighlighted: form.isHighlighted }
                : c
            ),
          }
        })
      })
    } else {
      // Add new item
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
      if (form.parentId) {
        setMenuItems((prev) =>
          prev.map((p) => {
            if (p.id !== form.parentId) return p
            return {
              ...p,
              children: [
                ...p.children,
                {
                  id: tempId,
                  label: form.label,
                  url: form.url,
                  type: form.type,
                  isHighlighted: form.isHighlighted,
                  parentId: form.parentId,
                  order: p.children.length,
                  children: [],
                },
              ],
            }
          })
        )
        // Auto-expand parent
        setExpandedIds((prev) => {
          const next = new Set(Array.from(prev))
          next.add(form.parentId!)
          return next
        })
      } else {
        setMenuItems((prev) => [
          ...prev,
          {
            id: tempId,
            label: form.label,
            url: form.url,
            type: form.type,
            isHighlighted: form.isHighlighted,
            parentId: null,
            order: prev.length,
            children: [],
          },
        ])
      }
    }

    setFormOpen(false)
  }

  // ─── Delete handler ─────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    const isDbItem = !deleteTarget.id.startsWith("temp-")

    if (isDbItem) {
      const result = await deleteMenuItem(deleteTarget.id)
      if (!result.success) {
        toast.error(result.error)
        setDeleteTarget(null)
        return
      }
    }

    setMenuItems((prev) => {
      // Remove as parent
      const filtered = prev.filter((p) => p.id !== deleteTarget.id)
      // Remove as child
      return filtered.map((p) => ({
        ...p,
        children: p.children.filter((c) => c.id !== deleteTarget.id),
      }))
    })

    toast.success("Item menu berhasil dihapus")
    setDeleteTarget(null)
  }

  // ─── Save all ───────────────────────────────────────────────

  async function handleSaveAll() {
    setSaving(true)
    try {
      const flat: MenuItemForm[] = []
      menuItems.forEach((parent, pIdx) => {
        flat.push({
          label: parent.label,
          url: parent.url,
          type: parent.type,
          isHighlighted: parent.isHighlighted,
          parentId: null,
          order: pIdx,
        })
        parent.children.forEach((child, cIdx) => {
          flat.push({
            label: child.label,
            url: child.url,
            type: child.type,
            isHighlighted: child.isHighlighted,
            parentId: `__idx__${pIdx}`,
            order: cIdx,
          })
        })
      })

      const result = await saveMenuItems(flat)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      // Update local state with server data
      if (result.data) {
        setMenuItems(
          result.data.map((item) => ({
            id: item.id,
            label: item.label,
            url: item.url,
            type: item.type,
            parentId: item.parentId,
            order: item.order,
            isHighlighted: item.isHighlighted ?? false,
            children: (item.children ?? []).map((child) => ({
              id: child.id,
              label: child.label,
              url: child.url,
              type: child.type,
              parentId: child.parentId,
              order: child.order,
              isHighlighted: child.isHighlighted ?? false,
              children: [],
            })),
          }))
        )
      }

      toast.success("Menu berhasil disimpan")
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan menu")
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────

  const parentIds = menuItems.map((i) => i.id)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Container Modernized */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Menu Builder</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Atur struktur navigasi publik website dengan drag-and-drop.
          </p>
        </div>
        <div className="flex gap-3 relative z-10 w-full sm:w-auto">
          <Button variant="outline" onClick={() => openAddForm(null)} className="rounded-xl border-slate-200 hover:bg-slate-50 font-medium w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Menu
          </Button>
          <Button onClick={handleSaveAll} disabled={saving} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-lg shadow-[#002244]/20 font-bold transition-all w-full sm:w-auto">
            {saving ? "Menyimpan..." : "Simpan Urutan"}
          </Button>
        </div>
      </div>

      {menuItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 bg-slate-50/50">
          <p className="font-medium">Belum ada item menu.</p>
          <p className="text-sm text-slate-400 mt-1">Klik &quot;Tambah Menu&quot; di atas untuk memulai membuat direktori web.</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleParentDragEnd}
          >
            <SortableContext
              items={parentIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
              {menuItems.map((parent) => (
                <div key={parent.id} className="space-y-2">
                  <SortableMenuItem
                    item={parent}
                    isExpanded={expandedIds.has(parent.id)}
                    onToggle={() => toggleExpand(parent.id)}
                    onEdit={() => openEditForm(parent, null)}
                    onDelete={() => setDeleteTarget(parent)}
                    depth={0}
                  />

                  {expandedIds.has(parent.id) &&
                    parent.children.length > 0 && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleChildDragEnd(parent.id, e)}
                      >
                        <SortableContext
                          items={parent.children.map((c) => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {parent.children.map((child) => (
                              <SortableMenuItem
                                key={child.id}
                                item={child}
                                onEdit={() => openEditForm(child, parent.id)}
                                onDelete={() => setDeleteTarget(child)}
                                depth={1}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}

                  {expandedIds.has(parent.id) && (
                    <div className="ml-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddForm(parent.id)}
                        className="text-muted-foreground"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Tambah Sub-menu
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
        </div>
      )}

      {/* ─── Add/Edit Dialog ─────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Item Menu" : "Tambah Item Menu"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Ubah detail item menu di bawah ini."
                : "Isi detail item menu baru di bawah ini."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menu-label">Label</Label>
              <Input
                id="menu-label"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="Beranda"
              />
              {formErrors.label && (
                <p className="text-sm text-destructive">{formErrors.label}</p>
              )}
            </div>

            {/* Tipe dulu, baru URL/pilihan halaman */}
            <div className="space-y-2">
              <Label htmlFor="menu-type">Tipe</Label>
              <Select
                value={form.type}
                onValueChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    type: val as "INTERNAL" | "EXTERNAL",
                    url: val === "EXTERNAL" && f.url === "#" ? "" : val === "INTERNAL" ? "/" : f.url === "/" ? "" : f.url,
                  }))
                }
              >
                <SelectTrigger id="menu-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">Internal (halaman website)</SelectItem>
                  <SelectItem value="EXTERNAL">External (link luar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === "INTERNAL" ? (
              <div className="space-y-2">
                <Label htmlFor="menu-page">Tujuan Halaman</Label>
                <Select
                  value={form.url}
                  onValueChange={(val) => setForm((f) => ({ ...f, url: val }))}
                >
                  <SelectTrigger id="menu-page">
                    <SelectValue placeholder="Pilih halaman..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      Rute Tetap
                    </div>
                    {STATIC_ROUTES.map((r) => (
                      <SelectItem key={r.url} value={r.url}>
                        {r.label}
                        <span className="ml-2 text-xs text-muted-foreground">{r.url}</span>
                      </SelectItem>
                    ))}
                    {pages.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                          Halaman Kustom
                        </div>
                        {pages.map((p) => (
                          <SelectItem key={p.slug} value={`/halaman/${p.slug}`}>
                            {p.title}
                            <span className="ml-2 text-xs text-muted-foreground">/halaman/{p.slug}</span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {departments.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                          Jurusan
                        </div>
                        {departments.map((d) => (
                          <SelectItem key={d.slug} value={`/jurusan/${d.slug}`}>
                            {d.name}
                            <span className="ml-2 text-xs text-muted-foreground">/jurusan/{d.slug}</span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {form.url && (
                  <p className="text-xs text-muted-foreground">
                    URL: <code className="bg-muted px-1 rounded">{form.url}</code>
                  </p>
                )}
                {formErrors.url && (
                  <p className="text-sm text-destructive">{formErrors.url}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="menu-url">URL External</Label>
                <div className="flex gap-2">
                  <Input
                    id="menu-url"
                    value={form.url === "#" ? "" : form.url}
                    disabled={form.url === "#"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, url: e.target.value }))
                    }
                    placeholder="https://example.com"
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="no-link"
                    checked={form.url === "#"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, url: e.target.checked ? "#" : "" }))
                    }
                    className="rounded"
                  />
                  <label htmlFor="no-link" className="text-xs text-muted-foreground cursor-pointer">
                    Jadikan label saja (tidak mengarah ke mana pun) — cocok untuk menu utama dengan sub-menu
                  </label>
                </div>
                {formErrors.url && (
                  <p className="text-sm text-destructive">{formErrors.url}</p>
                )}
              </div>
            )}

            {/* Highlight toggle */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 bg-slate-50/50">
              <input
                type="checkbox"
                id="menu-highlight"
                checked={form.isHighlighted}
                onChange={(e) => setForm((f) => ({ ...f, isHighlighted: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="menu-highlight" className="text-sm text-slate-700 cursor-pointer flex-1">
                <span className="font-medium">Highlight menu ini</span>
                <span className="block text-xs text-slate-400 mt-0.5">Tampil dengan warna kuning di navbar — cocok untuk PPDB, pengumuman penting, dll.</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-parent">Parent</Label>              <Select
                value={form.parentId ?? "__none__"}
                onValueChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    parentId: val === "__none__" ? null : val,
                  }))
                }
              >
                <SelectTrigger id="menu-parent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tidak ada (Top-level)</SelectItem>
                  {menuItems
                    .filter((p) => p.id !== editingId)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleFormSave}>
              {editingId ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────── */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Item Menu</DialogTitle>
            <DialogDescription>
              {deleteTarget && deleteTarget.children.length > 0
                ? `Item "${deleteTarget.label}" memiliki ${deleteTarget.children.length} sub-menu. Menghapus item ini juga akan menghapus semua sub-menu terkait.`
                : `Apakah Anda yakin ingin menghapus item "${deleteTarget?.label}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
