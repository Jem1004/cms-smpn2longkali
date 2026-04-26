import { ChangePasswordForm } from "@/components/admin/change-password-form"

export const metadata = {
  title: "Profil — Admin",
}

export default function ProfilPage() {
  return (
    <div className="p-6 md:p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ganti Password</h1>
        <p className="text-sm text-slate-500 mt-1">Perbarui password akun Anda</p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
