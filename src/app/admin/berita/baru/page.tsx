import { auth } from "@/lib/auth"
import { hasPermission, type Role } from "@/lib/rbac"
import { getCategories } from "@/actions/category"
import { ArticleForm } from "@/components/admin/article-form"
import type { SessionWithRole } from "@/types"

export const metadata = {
  title: "Buat Artikel — Admin",
  description: "Buat artikel berita baru",
}

export default async function BaruPage() {
  const session = (await auth()) as SessionWithRole | null
  const role = (session?.user?.role ?? "CONTRIBUTOR") as Role

  const categoriesResult = await getCategories()
  const categories = categoriesResult.success ? categoriesResult.data : []

  return (
    <ArticleForm
      mode="create"
      categories={categories}
      canPublish={hasPermission(role, "article:publish")}
    />
  )
}
