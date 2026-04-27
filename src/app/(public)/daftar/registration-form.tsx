"use client"

import { useState, useTransition } from "react"
import { CheckCircle, Send } from "lucide-react"
import { submitRegistration } from "@/actions/registration"

interface Props {
  departments: { id: string; name: string }[]
  schoolName: string
  customFields: { id: string; label: string; type: string; options: string[]; required: boolean }[]
}

export function RegistrationForm({ departments, schoolName, customFields }: Props) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [registrationId, setRegistrationId] = useState("")
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [globalError, setGlobalError] = useState("")

  const [form, setForm] = useState({
    namaLengkap: "",
    ttl: "",
    alamat: "",
    asalSekolah: "",
    noHp: "",
    departmentId: "",
  })
  const [customData, setCustomData] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    customFields.forEach((f) => { init[f.id] = "" })
    return init
  })

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setGlobalError("")

    startTransition(async () => {
      const result = await submitRegistration({
        ...form,
        customData: Object.keys(customData).length > 0 ? customData : undefined,
      })
      if (!result.success) {
        if (result.fieldErrors) setErrors(result.fieldErrors)
        setGlobalError(result.error)
        return
      }
      setRegistrationId(result.data.id.slice(-8).toUpperCase())
      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#002244] mb-2">Pendaftaran Berhasil!</h2>
        <p className="text-gray-500 text-sm max-w-sm mb-4">
          Terima kasih telah mendaftar di {schoolName}. Data Anda telah kami terima.
        </p>
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-6 py-4 mb-6">
          <p className="text-xs text-gray-400 mb-1">Nomor Pendaftaran</p>
          <p className="text-2xl font-bold text-[#002244] tracking-wider">{registrationId}</p>
        </div>
        <p className="text-xs text-gray-400 max-w-sm">
          Simpan nomor pendaftaran ini. Pihak sekolah akan menghubungi Anda melalui nomor HP yang didaftarkan.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {globalError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {globalError}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.namaLengkap}
          onChange={(e) => update("namaLengkap", e.target.value)}
          placeholder="Masukkan nama lengkap"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244]"
        />
        {errors.namaLengkap && <p className="text-xs text-red-500">{errors.namaLengkap[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Tempat, Tanggal Lahir <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.ttl}
          onChange={(e) => update("ttl", e.target.value)}
          placeholder="Contoh: Balikpapan, 15 Januari 2010"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244]"
        />
        {errors.ttl && <p className="text-xs text-red-500">{errors.ttl[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Alamat <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.alamat}
          onChange={(e) => update("alamat", e.target.value)}
          placeholder="Alamat lengkap tempat tinggal"
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244] resize-none"
        />
        {errors.alamat && <p className="text-xs text-red-500">{errors.alamat[0]}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Asal Sekolah <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.asalSekolah}
            onChange={(e) => update("asalSekolah", e.target.value)}
            placeholder="Nama sekolah asal"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244]"
          />
          {errors.asalSekolah && <p className="text-xs text-red-500">{errors.asalSekolah[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Nomor HP <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.noHp}
            onChange={(e) => update("noHp", e.target.value)}
            placeholder="08xxxxxxxxxx"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244]"
          />
          {errors.noHp && <p className="text-xs text-red-500">{errors.noHp[0]}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Pilihan Jurusan <span className="text-red-500">*</span>
        </label>
        <select
          value={form.departmentId}
          onChange={(e) => update("departmentId", e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244] bg-white"
        >
          <option value="">Pilih jurusan...</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId[0]}</p>}
      </div>

      {/* Custom Fields */}
      {customFields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.type === "TEXT" && (
            <input
              type="text"
              value={customData[field.id] ?? ""}
              onChange={(e) => setCustomData((d) => ({ ...d, [field.id]: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244]"
            />
          )}
          {field.type === "TEXTAREA" && (
            <textarea
              value={customData[field.id] ?? ""}
              onChange={(e) => setCustomData((d) => ({ ...d, [field.id]: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244] resize-none"
            />
          )}
          {field.type === "NUMBER" && (
            <input
              type="number"
              value={customData[field.id] ?? ""}
              onChange={(e) => setCustomData((d) => ({ ...d, [field.id]: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244]"
            />
          )}
          {field.type === "SELECT" && (
            <select
              value={customData[field.id] ?? ""}
              onChange={(e) => setCustomData((d) => ({ ...d, [field.id]: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244] bg-white"
            >
              <option value="">Pilih...</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {field.type === "DATE" && (
            <input
              type="date"
              value={customData[field.id] ?? ""}
              onChange={(e) => setCustomData((d) => ({ ...d, [field.id]: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002244]/20 focus:border-[#002244]"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-[#002244] hover:bg-[#003366] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors mt-2"
      >
        <Send className="h-4 w-4" />
        {isPending ? "Mengirim..." : "Daftar Sekarang"}
      </button>

      <p className="text-xs text-center text-gray-400">
        Dengan mendaftar, data Anda akan disimpan untuk proses seleksi penerimaan siswa baru.
      </p>
    </form>
  )
}
