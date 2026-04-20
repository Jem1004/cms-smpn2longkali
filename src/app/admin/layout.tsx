import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/sidebar"
import { Toaster } from "@/components/ui/sonner"
import type { SessionWithRole } from "@/types"

export const metadata = {
  title: "Admin",
  description: "Dashboard Admin CMS",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = (await auth()) as SessionWithRole | null

  if (!session?.user) {
    redirect("/login")
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  }

  return (
    <div className="min-h-screen bg-slate-50/40 selection:bg-blue-100">
      <AdminSidebar user={user}>
        <div className="p-4 sm:p-6 lg:p-10">{children}</div>
      </AdminSidebar>
      <Toaster />
    </div>
  )
}
