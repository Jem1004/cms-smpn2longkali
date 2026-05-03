"use client"

import { useState, useTransition, useRef } from "react"
import {
  Upload,
  Trash2,
  Search,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  X,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  toggleGraduationActive,
  importGraduationStudents,
  deleteGraduationStudent,
  clearGraduationStudents,
  updateGraduationSettings,
} from "@/actions/graduation"
import type { GraduationStudent } from "@prisma/client"
import type { GraduationSettings } from "@/actions/graduation"
import * as XLSX from "xlsx"

interface GraduationManagerProps {
  initialStudents: GraduationStudent[]
  settings: GraduationSettings
  isActive: boolean
}

export function GraduationManager({ initialStudents, settings, isActive }: GraduationManagerProps) {
  const [students, setStudents] = useState(initialStudents)
  const [active, setActive] = useState(isActive)
  const [tahunAjaran, setTahunAjaran] = useState(settings.tahunAjaran)
  const [suratUrl, setSuratUrl] = useState(settings.suratUrl)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "LULUS" | "TIDAK_LULUS">("ALL")
  const [isPending, startTransition] = useTransition()
  const [isImporting, setIsImporting] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const suratInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingSurat, setIsUploadingSurat] = useState(false)

  // ─── Toggle pengumuman ──────────────────────────
  const handleToggleActive = () => {
    startTransition(async () => {
      const result = await toggleGraduationActive(!active)
      if (result.success) {
        setActive(!active)
        toast.success(active ? "Pengumuman ditutup" : "Pengumuman dibuka")
      } else {
        toast.error(result.error)
      }
    })
  }

  // ─── Save settings ──────────────────────────────
  const handleSaveSettings = () => {
    if (!tahunAjaran.trim()) {
      toast.error("Tahun ajaran wajib diisi")
      return
    }
    startTransition(async () => {
      const result = await updateGraduationSettings({ tahunAjaran, suratUrl })
      if (result.success) {
        toast.success("Pengaturan disimpan")
      } else {
        toast.error(result.error)
      }
    })
  }

  // ─── Upload surat kelulusan ─────────────────────
  const handleUploadSurat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file harus PDF, JPG, PNG, atau WebP")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB")
      return
    }

    setIsUploadingSurat(true)
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      })

      if (!presignRes.ok) {
        throw new Error("Gagal mendapatkan URL upload")
      }

      const { uploadUrl, fileUrl } = await presignRes.json()

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!uploadRes.ok) {
        throw new Error("Gagal mengunggah file ke S3")
      }

      setSuratUrl(fileUrl)
      // Auto-save after upload
      const result = await updateGraduationSettings({ tahunAjaran, suratUrl: fileUrl })
      if (result.success) {
        toast.success("Surat kelulusan berhasil diunggah")
      }
    } catch {
      toast.error("Gagal mengunggah file")
    } finally {
      setIsUploadingSurat(false)
      if (suratInputRef.current) suratInputRef.current.value = ""
    }
  }

  // ─── Delete surat kelulusan ─────────────────────
  const handleDeleteSurat = () => {
    if (!confirm("Hapus file surat kelulusan?")) return
    setIsUploadingSurat(true)
    startTransition(async () => {
      const result = await updateGraduationSettings({ tahunAjaran, suratUrl: "" })
      if (result.success) {
        setSuratUrl("")
        toast.success("Surat kelulusan berhasil dihapus")
      } else {
        toast.error("Gagal menghapus surat kelulusan")
      }
      setIsUploadingSurat(false)
    })
  }

  // ─── Import Excel ──────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!tahunAjaran.trim()) {
      toast.error("Set tahun ajaran terlebih dahulu sebelum import")
      return
    }

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tahunAjaran", tahunAjaran)

      const result = await importGraduationStudents(formData)
      if (result.success) {
        toast.success(`${result.data.imported} data diimpor, ${result.data.skipped} dilewati`)
        // Refresh page to get updated data
        window.location.reload()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Gagal mengimpor data")
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // ─── Download Template ──────────────────────────
  const handleDownloadTemplate = () => {
    const templateData = [
      { NIS: "12345", NISN: "001234567", "Nama Lengkap": "Ahmad Fauzi", Kelas: "XII RPL 1", Jurusan: "RPL", Status: "LULUS" },
      { NIS: "12346", NISN: "001234568", "Nama Lengkap": "Budi Santoso", Kelas: "XII TKJ 2", Jurusan: "TKJ", Status: "TIDAK LULUS" },
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")

    // Set column widths
    const wscols = [
      { wch: 10 }, // NIS
      { wch: 15 }, // NISN
      { wch: 30 }, // Nama Lengkap
      { wch: 15 }, // Kelas
      { wch: 15 }, // Jurusan
      { wch: 15 }, // Status
    ]
    ws["!cols"] = wscols

    XLSX.writeFile(wb, "Template_Data_Kelulusan.xlsx")
  }

  // ─── Delete single ──────────────────────────────
  const handleDelete = (id: string, nama: string) => {
    if (!confirm(`Hapus data kelulusan "${nama}"?`)) return
    startTransition(async () => {
      const result = await deleteGraduationStudent(id)
      if (result.success) {
        setStudents((prev) => prev.filter((s) => s.id !== id))
        toast.success("Data dihapus")
      } else {
        toast.error(result.error)
      }
    })
  }

  // ─── Clear all ──────────────────────────────────
  const handleClear = () => {
    if (!tahunAjaran.trim()) return
    startTransition(async () => {
      const result = await clearGraduationStudents(tahunAjaran)
      if (result.success) {
        setStudents([])
        setShowClearConfirm(false)
        toast.success(`${result.data.deleted} data dihapus`)
      } else {
        toast.error(result.error)
      }
    })
  }

  // ─── Filter + search ───────────────────────────
  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search) ||
      s.nisn.includes(search) ||
      s.kelas.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "ALL" || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const lulusCount = students.filter((s) => s.status === "LULUS").length
  const tidakLulusCount = students.filter((s) => s.status === "TIDAK_LULUS").length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengumuman Kelulusan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data kelulusan siswa kelas XII
          </p>
        </div>
        <button
          onClick={handleToggleActive}
          disabled={isPending}
          className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 border ${
            active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          }`}
        >
          {active ? (
            <ToggleRight className="h-5 w-5 text-emerald-600" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-slate-400" />
          )}
          {active ? "Pengumuman Dibuka" : "Pengumuman Ditutup"}
        </button>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 md:p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Pengaturan</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Tahun Ajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tahun Ajaran</label>
            <input
              type="text"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              placeholder="2025/2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Surat Kelulusan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Surat Pengumuman Kelulusan
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={suratInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleUploadSurat}
                className="hidden"
              />
              <button
                onClick={() => suratInputRef.current?.click()}
                disabled={isUploadingSurat}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <FileText className="h-4 w-4" />
                {isUploadingSurat ? "Mengunggah..." : "Unggah File"}
              </button>
              {suratUrl && (
                <div className="flex items-center gap-3 ml-2">
                  <a
                    href={suratUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Lihat File
                  </a>
                  <button
                    onClick={handleDeleteSurat}
                    disabled={isUploadingSurat || isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Hapus file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={isPending}
            className="rounded-xl px-5"
          >
            Simpan Pengaturan
          </Button>
        </div>
      </div>

      {/* Stats + Actions */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{students.length}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Total Siswa</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{lulusCount}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Lulus</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{tidakLulusCount}</p>
          <p className="text-xs text-red-600 font-semibold mt-1">Tidak Lulus</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col items-center justify-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
          <div className="flex flex-col items-stretch w-full gap-2 mt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || !tahunAjaran.trim()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {isImporting ? "Mengimpor..." : "Import Excel"}
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 hover:border-blue-300 transition-colors w-full"
            >
              <Download className="h-4 w-4" />
              Unduh Template
            </button>
          </div>
          {!tahunAjaran.trim() && (
            <p className="text-[10px] text-amber-600 font-semibold mt-1">Set tahun ajaran dulu</p>
          )}
        </div>
      </div>

      {/* Excel Format Hint */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 md:p-5">
        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Format Excel yang Diharapkan</h3>
        <div className="overflow-x-auto">
          <table className="text-xs text-blue-900 w-full">
            <thead>
              <tr className="border-b border-blue-200/60">
                <th className="text-left py-1.5 pr-4 font-bold">NIS</th>
                <th className="text-left py-1.5 pr-4 font-bold">NISN</th>
                <th className="text-left py-1.5 pr-4 font-bold">Nama Lengkap</th>
                <th className="text-left py-1.5 pr-4 font-bold">Kelas</th>
                <th className="text-left py-1.5 pr-4 font-bold">Jurusan</th>
                <th className="text-left py-1.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="text-blue-700">
              <tr>
                <td className="py-1 pr-4">12345</td>
                <td className="py-1 pr-4">001234567</td>
                <td className="py-1 pr-4">Ahmad Fauzi</td>
                <td className="py-1 pr-4">XII RPL 1</td>
                <td className="py-1 pr-4">RPL</td>
                <td className="py-1">LULUS</td>
              </tr>
              <tr>
                <td className="py-1 pr-4">12346</td>
                <td className="py-1 pr-4">001234568</td>
                <td className="py-1 pr-4">Budi Santoso</td>
                <td className="py-1 pr-4">XII TKJ 2</td>
                <td className="py-1 pr-4">TKJ</td>
                <td className="py-1">TIDAK LULUS</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-blue-500 mt-2 font-medium">
          Kolom yang wajib: NIS/NISN (salah satu) dan Nama. Kolom &quot;Status&quot; yang mengandung kata &quot;TIDAK&quot; akan otomatis menjadi TIDAK LULUS.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIS, NISN, atau kelas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["ALL", "LULUS", "TIDAK_LULUS"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === status
                  ? status === "LULUS"
                    ? "bg-emerald-600 text-white"
                    : status === "TIDAK_LULUS"
                    ? "bg-red-600 text-white"
                    : "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status === "ALL" ? "Semua" : status === "LULUS" ? "Lulus" : "Tidak Lulus"}
            </button>
          ))}
        </div>
        {students.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus Semua
          </button>
        )}
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800">Hapus semua data kelulusan tahun {tahunAjaran}?</p>
              <p className="text-xs text-red-600 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              disabled={isPending}
              className="rounded-xl"
            >
              Ya, Hapus Semua
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <FileSpreadsheet className="h-12 w-12 text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-700">
              {students.length === 0 ? "Belum ada data kelulusan" : "Tidak ada hasil pencarian"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {students.length === 0
                ? "Import file Excel untuk menambahkan data siswa"
                : "Coba ubah kata kunci pencarian"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NIS</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NISN</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jurusan</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{student.namaLengkap}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{student.nis}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{student.nisn}</td>
                    <td className="py-3 px-4 text-slate-600">{student.kelas}</td>
                    <td className="py-3 px-4 text-slate-600">{student.jurusan}</td>
                    <td className="py-3 px-4">
                      {student.status === "LULUS" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                          <CheckCircle2 className="h-3 w-3" />
                          Lulus
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                          <XCircle className="h-3 w-3" />
                          Tidak Lulus
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(student.id, student.namaLengkap)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 text-xs text-slate-500 font-medium">
            Menampilkan {filtered.length} dari {students.length} data
          </div>
        )}
      </div>
    </div>
  )
}
