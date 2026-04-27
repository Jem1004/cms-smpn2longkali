"use client"

import React, { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  ClipboardList, Download, Trash2, CheckCircle, XCircle, Clock,
  ToggleLeft, ToggleRight, Filter, Plus, Pencil, Settings2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  updateRegistrationStatus, deleteRegistration,
  toggleSpmb, toggleDepartmentRegistration,
  createRegistrationField, updateRegistrationField, deleteRegistrationField,
} from "@/actions/registration"
import type { Registration, Department, RegistrationField } from "@prisma/client"

type RegWithDept = Registration & { department: { name: string } }

const STATUS_CONFIG = {
  PENDING: { label: "Pending", variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
  DITERIMA: { label: "Diterima", variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
  DITOLAK: { label: "Ditolak", variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date))
}

interface Props {
  initialRegistrations: RegWithDept[]
  departments: Department[]
  spmbOpen: boolean
  customFields: RegistrationField[]
}

export function RegistrationManager({ initialRegistrations, departments, spmbOpen, customFields: initialFields }: Props) {
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [isOpen, setIsOpen] = useState(spmbOpen)
  const [deptList, setDeptList] = useState(departments)
  const [fields, setFields] = useState(initialFields)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterDept, setFilterDept] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<RegWithDept | null>(null)
  const [detailTarget, setDetailTarget] = useState<RegWithDept | null>(null)
  const [isPending, startTransition] = useTransition()

  // Field form state
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<RegistrationField | null>(null)
  const [fieldForm, setFieldForm] = useState({ label: "", type: "TEXT" as string, options: "", required: false })
  const [deleteFieldTarget, setDeleteFieldTarget] = useState<RegistrationField | null>(null)

  // Filter
  const filtered = registrations.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false
    if (filterDept !== "all" && r.departmentId !== filterDept) return false
    return true
  })

  // Toggle SPMB
  function handleToggleSpmb() {
    startTransition(async () => {
      const result = await toggleSpmb(!isOpen)
      if (!result.success) { toast.error(result.error); return }
      setIsOpen(!isOpen)
      toast.success(isOpen ? "Pendaftaran ditutup" : "Pendaftaran dibuka")
    })
  }

  // Toggle department
  function handleToggleDept(dept: Department) {
    startTransition(async () => {
      const result = await toggleDepartmentRegistration(dept.id, !dept.isOpenForRegistration)
      if (!result.success) { toast.error(result.error); return }
      setDeptList((prev) => prev.map((d) => d.id === dept.id ? { ...d, isOpenForRegistration: !d.isOpenForRegistration } : d))
      toast.success(`${dept.name} ${dept.isOpenForRegistration ? "ditutup" : "dibuka"} untuk pendaftaran`)
    })
  }

  // Update status
  function handleStatus(id: string, status: "PENDING" | "DITERIMA" | "DITOLAK") {
    startTransition(async () => {
      const result = await updateRegistrationStatus(id, status)
      if (!result.success) { toast.error(result.error); return }
      setRegistrations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
      if (detailTarget?.id === id) setDetailTarget((prev) => prev ? { ...prev, status } : null)
      toast.success("Status diperbarui")
    })
  }

  // Delete
  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteRegistration(deleteTarget.id)
      if (!result.success) { toast.error(result.error); return }
      setRegistrations((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      toast.success("Data pendaftar dihapus")
      setDeleteTarget(null)
    })
  }

  // Export Excel
  function handleExport() {
    import("xlsx").then((XLSX) => {
      const rows = filtered.map((r, i) => {
        const base: Record<string, unknown> = {
          "No": i + 1,
          "Nama Lengkap": r.namaLengkap,
          "Tempat/Tanggal Lahir": r.ttl,
          "Alamat": r.alamat,
          "Asal Sekolah": r.asalSekolah,
          "No HP": r.noHp,
          "Jurusan": r.department.name,
          "Status": r.status,
          "Tanggal Daftar": formatDate(r.createdAt),
        }
        // Add custom fields
        const cd = (r.customData ?? {}) as Record<string, string>
        for (const f of fields) {
          base[f.label] = cd[f.id] ?? ""
        }
        return base
      })

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Pendaftar")

      const colWidths = Object.keys(rows[0] || {}).map((key) => ({
        wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length)) + 2,
      }))
      ws["!cols"] = colWidths

      XLSX.writeFile(wb, `pendaftaran-siswa-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success("Data berhasil diexport ke Excel")
    })
  }

  // Field handlers
  function openAddField() {
    setEditingField(null)
    setFieldForm({ label: "", type: "TEXT", options: "", required: false })
    setFieldDialogOpen(true)
  }
  function openEditField(f: RegistrationField) {
    setEditingField(f)
    setFieldForm({ label: f.label, type: f.type, options: f.options.join(", "), required: f.required })
    setFieldDialogOpen(true)
  }
  function handleSaveField() {
    if (!fieldForm.label.trim()) { toast.error("Label wajib diisi"); return }
    startTransition(async () => {
      const data = {
        label: fieldForm.label,
        type: fieldForm.type as "TEXT" | "TEXTAREA" | "NUMBER" | "SELECT" | "DATE",
        options: fieldForm.type === "SELECT" ? fieldForm.options.split(",").map((o) => o.trim()).filter(Boolean) : [],
        required: fieldForm.required,
      }
      const result = editingField
        ? await updateRegistrationField(editingField.id, data)
        : await createRegistrationField(data)
      if (!result.success) { toast.error(result.error); return }
      toast.success(editingField ? "Field diperbarui" : "Field ditambahkan")
      setFields((prev) => editingField
        ? prev.map((f) => f.id === editingField.id ? result.data! : f)
        : [...prev, result.data!]
      )
      setFieldDialogOpen(false)
    })
  }
  function handleDeleteField() {
    if (!deleteFieldTarget) return
    startTransition(async () => {
      const result = await deleteRegistrationField(deleteFieldTarget.id)
      if (!result.success) { toast.error(result.error); return }
      setFields((prev) => prev.filter((f) => f.id !== deleteFieldTarget.id))
      toast.success("Field dihapus")
      setDeleteFieldTarget(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pendaftaran Siswa Baru</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola data pendaftar dan konfigurasi SPMB</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0} className="rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button
            onClick={handleToggleSpmb}
            className={`rounded-xl ${isOpen ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}
          >
            {isOpen ? <ToggleRight className="mr-2 h-4 w-4" /> : <ToggleLeft className="mr-2 h-4 w-4" />}
            {isOpen ? "Pendaftaran Dibuka" : "Pendaftaran Ditutup"}
          </Button>
        </div>
      </div>

      {/* Jurusan Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Jurusan Tersedia untuk Pendaftaran</p>
        {deptList.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada jurusan. Tambah di menu Jurusan.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {deptList.map((dept) => (
              <button
                key={dept.id}
                onClick={() => handleToggleDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  dept.isOpenForRegistration
                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                }`}
              >
                {dept.isOpenForRegistration ? "✓" : "✕"} {dept.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Fields */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Field Tambahan Form</p>
            <p className="text-xs text-slate-400 mt-0.5">Field custom yang muncul di form pendaftaran publik</p>
          </div>
          <Button size="sm" variant="outline" onClick={openAddField} className="rounded-lg">
            <Plus className="mr-1 h-3 w-3" /> Tambah Field
          </Button>
        </div>
        {fields.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada field tambahan. Form hanya menampilkan field bawaan.</p>
        ) : (
          <div className="space-y-2">
            {fields.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700">{f.label}</span>
                  <span className="text-xs text-slate-400 ml-2">{f.type}{f.required ? " · Wajib" : ""}</span>
                  {f.type === "SELECT" && f.options.length > 0 && (
                    <span className="text-xs text-slate-300 ml-2">({f.options.join(", ")})</span>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditField(f)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteFieldTarget(f)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="DITERIMA">Diterima</SelectItem>
            <SelectItem value="DITOLAK">Ditolak</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Jurusan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jurusan</SelectItem>
            {deptList.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-400 flex items-center">
          {filtered.length} pendaftar
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-slate-50/50">
          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-500">Belum ada data pendaftar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Asal Sekolah</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Jurusan</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">No HP</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Tanggal</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((reg) => {
                  const sc = STATUS_CONFIG[reg.status]
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setDetailTarget(reg)}>
                      <td className="px-4 py-3 font-medium text-slate-800">{reg.namaLengkap}</td>
                      <td className="px-4 py-3 text-slate-500">{reg.asalSekolah}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{reg.department.name}</Badge></td>
                      <td className="px-4 py-3 text-slate-500">{reg.noHp}</td>
                      <td className="px-4 py-3"><Badge variant={sc.variant}>{sc.label}</Badge></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(reg.createdAt)}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(reg)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(o) => { if (!o) setDetailTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Pendaftar</DialogTitle>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-slate-400">Nama</span>
                <span className="font-medium text-slate-800">{detailTarget.namaLengkap}</span>
                <span className="text-slate-400">TTL</span>
                <span className="text-slate-700">{detailTarget.ttl}</span>
                <span className="text-slate-400">Alamat</span>
                <span className="text-slate-700">{detailTarget.alamat}</span>
                <span className="text-slate-400">Asal Sekolah</span>
                <span className="text-slate-700">{detailTarget.asalSekolah}</span>
                <span className="text-slate-400">No HP</span>
                <span className="text-slate-700">{detailTarget.noHp}</span>
                <span className="text-slate-400">Jurusan</span>
                <span className="text-slate-700">{detailTarget.department.name}</span>
                <span className="text-slate-400">Status</span>
                <Badge variant={STATUS_CONFIG[detailTarget.status].variant}>{STATUS_CONFIG[detailTarget.status].label}</Badge>
                <span className="text-slate-400">Tanggal</span>
                <span className="text-slate-700">{formatDate(detailTarget.createdAt)}</span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg flex-1" onClick={() => handleStatus(detailTarget.id, "DITERIMA")} disabled={isPending}>
                  <CheckCircle className="mr-1 h-3.5 w-3.5" /> Terima
                </Button>
                <Button size="sm" variant="destructive" className="rounded-lg flex-1" onClick={() => handleStatus(detailTarget.id, "DITOLAK")} disabled={isPending}>
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Tolak
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleStatus(detailTarget.id, "PENDING")} disabled={isPending}>
                  <Clock className="mr-1 h-3.5 w-3.5" /> Pending
                </Button>
              </div>

              {/* Custom fields data */}
              {fields.length > 0 && detailTarget.customData && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Tambahan</p>
                  <div className="grid grid-cols-[120px_1fr] gap-2">
                    {fields.map((f) => (
                      <React.Fragment key={f.id}>
                        <span className="text-slate-400">{f.label}</span>
                        <span className="text-slate-700">{(detailTarget.customData as Record<string, string>)?.[f.id] || "-"}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Data Pendaftar</DialogTitle>
            <DialogDescription>Yakin ingin menghapus data &quot;{deleteTarget?.namaLengkap}&quot;?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Form Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Field" : "Tambah Field"}</DialogTitle>
            <DialogDescription>Field custom akan muncul di form pendaftaran publik.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={fieldForm.label} onChange={(e) => setFieldForm((f) => ({ ...f, label: e.target.value }))} placeholder="Contoh: Nama Orang Tua" />
            </div>
            <div className="space-y-2">
              <Label>Tipe Input</Label>
              <Select value={fieldForm.type} onValueChange={(v) => setFieldForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Teks Pendek</SelectItem>
                  <SelectItem value="TEXTAREA">Teks Panjang</SelectItem>
                  <SelectItem value="NUMBER">Angka</SelectItem>
                  <SelectItem value="SELECT">Pilihan Dropdown</SelectItem>
                  <SelectItem value="DATE">Tanggal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fieldForm.type === "SELECT" && (
              <div className="space-y-2">
                <Label>Opsi Pilihan</Label>
                <Input value={fieldForm.options} onChange={(e) => setFieldForm((f) => ({ ...f, options: e.target.value }))} placeholder="Laki-laki, Perempuan (pisahkan dengan koma)" />
                <p className="text-xs text-muted-foreground">Pisahkan setiap opsi dengan koma</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="field-required" checked={fieldForm.required} onChange={(e) => setFieldForm((f) => ({ ...f, required: e.target.checked }))} className="rounded" />
              <label htmlFor="field-required" className="text-sm text-slate-700 cursor-pointer">Wajib diisi</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveField} disabled={isPending}>{editingField ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Field Dialog */}
      <Dialog open={!!deleteFieldTarget} onOpenChange={(o) => { if (!o) setDeleteFieldTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Field</DialogTitle>
            <DialogDescription>Yakin ingin menghapus field &quot;{deleteFieldTarget?.label}&quot;? Data yang sudah diisi pendaftar untuk field ini tidak akan terhapus.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFieldTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteField} disabled={isPending}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
