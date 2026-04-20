"use client"

import { useState, FormEvent, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const callbackUrl = searchParams.get("callbackUrl") || "/admin"
  const expired = searchParams.get("expired") === "true"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (!result || result.error) {
        setError("Email atau password salah")
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError("Terjadi kesalahan server. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full min-h-screen bg-white">
      {/* Left side: Premium Branding Visuals (Hidden on small screens) */}
      <div className="hidden lg:flex w-1/2 bg-[#002244] relative overflow-hidden flex-col justify-between p-12 xl:p-16 text-white">
        {/* Abstract Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay grayscale"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1200')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001122]/90 via-[#002244]/80 to-[#002244]/40" />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/astro-logo.png" alt="Astro School Management" className="w-12 h-12 object-contain brightness-0 invert" />
          <div className="leading-none mt-1">
            <h1 className="font-extrabold text-2xl text-white tracking-tight">Astro School Management</h1>
          </div>
        </div>

        <div className="relative z-10 max-w-md lg:pr-8">
          <h2 className="text-3xl xl:text-4xl font-extrabold mb-5 leading-[1.1] tracking-tight">Portal Manajemen<br />Sistem Informasi</h2>
          <p className="text-blue-100/70 text-sm xl:text-base leading-relaxed border-l-2 border-yellow-400 pl-4">
            Kelola konten publik, data berita, dan parameter sistem melalui panel administratif terpusat CMS School dari Astro Dgitial Solution.
          </p>

          <div className="mt-12 flex gap-2 opacity-50">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-white opacity-40" />
            <div className="w-2 h-2 rounded-full bg-white opacity-40" />
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-16 relative">
        {/* Mobile Logo Fallback */}
        <div className="absolute top-8 left-6 sm:left-12 lg:hidden flex items-center gap-2">
          <img src="/astro-logo.png" alt="Astro School" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-slate-900 tracking-tight text-sm">Astro <span className="text-red-600">School</span></span>
        </div>

        <div className="w-full max-w-[400px] space-y-8 mt-12 lg:mt-0">
          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-[#002244] tracking-tight">Selamat Datang</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Silakan masuk menggunakan kredensial admin Anda.</p>
          </div>

          {expired && (
            <div role="alert" className="rounded-lg bg-orange-50 border border-orange-200 p-4 flex gap-3 text-sm text-orange-800">
              <svg className="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <p>Sesi Anda telah berakhir. Silakan login kembali.</p>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3 text-sm text-red-600">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-slate-700 font-semibold tracking-wide text-xs uppercase">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@astroschool.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-[#002244] focus-visible:bg-white rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-semibold tracking-wide text-xs uppercase">Kata Sandi</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-[#002244] focus-visible:bg-white rounded-xl transition-all tracking-widest"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#002244] hover:bg-[#003366] text-white rounded-xl shadow-lg shadow-[#002244]/20 font-bold transition-all hover:-translate-y-0.5 mt-2"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Memproses Autentikasi...
                </div>
              ) : "Masuk ke Dashboard"}
            </Button>
          </form>

          <div className="text-center pt-6 opacity-60">
            <p className="text-xs text-slate-500">&copy; 2026 Hak Cipta CMS - Astro School</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  )
}
