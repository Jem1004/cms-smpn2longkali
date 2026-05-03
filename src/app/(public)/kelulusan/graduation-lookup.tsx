"use client"

import { useState, useTransition } from "react"
import { Search, CheckCircle2, XCircle, RotateCcw } from "lucide-react"
import { lookupGraduation } from "@/actions/graduation"

interface GraduationLookupProps {
  schoolName: string
  tahunAjaran: string
}

type LookupResult = {
  namaLengkap: string
  nis: string
  nisn: string
  kelas: string
  jurusan: string
  status: string
  tahunAjaran: string
} | null

export function GraduationLookup({ schoolName, tahunAjaran }: GraduationLookupProps) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<LookupResult | undefined>(undefined)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setError("")
    setNotFound(false)
    setResult(undefined)

    startTransition(async () => {
      const res = await lookupGraduation(query.trim())
      setHasSearched(true)
      if (res.success) {
        if (res.data) {
          setResult(res.data)
        } else {
          setNotFound(true)
        }
      } else {
        setError(res.error)
      }
    })
  }

  const handleReset = () => {
    setQuery("")
    setResult(undefined)
    setNotFound(false)
    setError("")
    setHasSearched(false)
  }

  return (
    <div className="space-y-8">

      {/* Search Form */}
      {!result && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#002244]/5 mb-4">
              <Search className="h-7 w-7 text-[#002244]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Cek Status Kelulusan</h2>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
              Masukkan NIS atau NISN Anda untuk melihat status kelulusan
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="graduation-query" className="block text-sm font-semibold text-slate-700 mb-2">
                NIS atau NISN
              </label>
              <input
                id="graduation-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Masukkan NIS atau NISN..."
                autoComplete="off"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244]/40 transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !query.trim()}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#002244] text-white font-bold text-sm hover:bg-[#003366] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,34,68,0.2)] hover:shadow-[0_6px_20px_rgba(0,34,68,0.3)]"
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Cek Kelulusan
                </>
              )}
            </button>
          </form>

          {/* Not Found */}
          {notFound && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-3">
                <Search className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-amber-800">Data Tidak Ditemukan</p>
              <p className="text-xs text-amber-600 mt-1.5">
                NIS/NISN &quot;{query}&quot; tidak ditemukan dalam data kelulusan tahun ajaran {tahunAjaran}. Pastikan nomor yang Anda masukkan benar.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-red-800">Terjadi Kesalahan</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Result Card: Formal Info Card Style */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto mt-4">
          <div className="bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden relative">
            
            {/* Header */}
            <div className="border-b-[3px] border-slate-800 p-6 md:p-8 text-center bg-slate-50/80">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-wide uppercase font-serif">
                Informasi Kelulusan Siswa
              </h3>
              <div className="w-16 h-1 bg-slate-800 mx-auto my-3"></div>
              <p className="text-sm font-semibold text-slate-700 uppercase">{schoolName}</p>
              <p className="text-sm text-slate-600">Tahun Ajaran {result.tahunAjaran}</p>
            </div>

            {/* Body */}
            <div className="p-6 md:p-10 space-y-8 font-serif">
              <p className="text-center text-slate-700 md:text-lg">
                Berikut adalah data dan hasil kelulusan untuk siswa yang bersangkutan:
              </p>

              {/* Data Table */}
              <div className="bg-white border-l-4 border-slate-800 p-5 md:p-6 shadow-sm font-sans space-y-3.5">
                {[
                  { label: "Nama Siswa", value: result.namaLengkap },
                  { label: "Nomor Induk", value: result.nis },
                  { label: "NISN", value: result.nisn },
                  { label: "Kelas", value: result.kelas },
                  { label: "Jurusan", value: result.jurusan },
                ].map((item) => (
                  <div key={item.label} className="grid grid-cols-[140px_10px_1fr] sm:grid-cols-[180px_10px_1fr] text-sm md:text-base">
                    <span className="font-semibold text-slate-600">{item.label}</span>
                    <span className="text-slate-400">:</span>
                    <span className="font-bold text-slate-900 uppercase">{item.value || "-"}</span>
                  </div>
                ))}
              </div>

              <p className="text-center text-slate-700 md:text-lg">
                Berdasarkan evaluasi pembelajaran selama masa pendidikan, siswa tersebut dinyatakan:
              </p>

              {/* Status Stamp */}
              <div className="flex justify-center py-4">
                <div className={`border-[6px] px-10 py-5 rounded-md inline-block transform -rotate-2 shadow-sm ${
                  result.status === "LULUS" 
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50" 
                    : "border-red-600 text-red-700 bg-red-50/50"
                }`}>
                  <p className="text-3xl md:text-5xl font-black tracking-[0.2em] uppercase font-sans">
                    {result.status === "LULUS" ? "L U L U S" : "TIDAK LULUS"}
                  </p>
                </div>
              </div>

              {result.status === "TIDAK LULUS" && (
                <p className="text-center text-sm md:text-base text-red-600 font-sans font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                  * Harap menghubungi pihak sekolah atau Wali Kelas untuk informasi lebih lanjut mengenai langkah selanjutnya.
                </p>
              )}
            </div>
            
            {/* Footer Action */}
            <div className="bg-slate-100 p-5 border-t border-slate-200 text-center font-sans">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Kembali & Cek Data Lainnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
