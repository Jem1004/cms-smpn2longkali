"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  ClipboardList, Download, Trash2, CheckCircle, XCircle, Clock,
  ToggleLeft, ToggleRight, Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  updateRegistrationStatus, deleteRegistration,
  toggleSpmb, toggleDepartmentRegistration,
} from "@/actions/registration"
import type { Registration, Department } from "@prisma/client"

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
}

export function RegistrationManager({ initialRegistrations, departments, spmbOpen }: Props) {
  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [isOpen, setIsOpen] = useState(spmbOpen)
  const [deptList, setDeptList] = useState(departments)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterDept, setFilterDept] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<RegWithDept | null>(null)
  const [detailTarget, setDetailTarget] = useState<RegWithDept | null>(null)
  const [isPending, startTransition] = useTransition()

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
    const rows = filtered.map((r, i) => ({
      No: i + 1,
      "Nama Lengkap": r.namaLengkap,
      "Tempat/Tanggal Lahir": r.ttl,
      Alamat: r.alamat,
      "Asal Sekolah": r.asalSekolah,
      "No HP": r.noHp,
      Jurusan: r.department.name,
      Status: r.status,
      "Tanggal Daftar": formatDate(r.createdAt),
    }))

    // CSV export (no library needed)
    const headers = Object.keys(rows[0] || {})
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => `"${String((row as Record<string, unknown>)[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pendaftaran-siswa-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Data berhasil diexport")
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
            <Download className="mr-2 h-4 w-4" /> Export CSV
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
    </div>
  )
}
