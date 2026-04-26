"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Save, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changeOwnPassword } from "@/actions/user"

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok")
      return
    }

    if (form.newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter")
      return
    }

    startTransition(async () => {
      const result = await changeOwnPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success("Password berhasil diubah")
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <div className="space-y-2">
        <Label>Password Lama</Label>
        <div className="relative">
          <Input
            type={showCurrent ? "text" : "password"}
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="Masukkan password saat ini"
            required
          />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Password Baru</Label>
        <div className="relative">
          <Input
            type={showNew ? "text" : "password"}
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            placeholder="Minimal 8 karakter"
            required
            minLength={8}
          />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Konfirmasi Password Baru</Label>
        <Input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          placeholder="Ulangi password baru"
          required
          minLength={8}
        />
      </div>

      <Button type="submit" disabled={isPending} className="bg-[#002244] hover:bg-[#003366] text-white rounded-xl w-full">
        <Save className="mr-2 h-4 w-4" />
        {isPending ? "Menyimpan..." : "Ubah Password"}
      </Button>
    </form>
  )
}
