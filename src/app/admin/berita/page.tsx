import { auth } from "@/lib/auth"
import { hasPermission, type Role } from "@/lib/rbac"
import { getArticles } from "@/actions/article"
import { getCategories } from "@/actions/category"
import { ArticleList } from "@/components/admin/article-list"
import type { SessionWithRole } from "@/types"

export const metadata = {
  title: "Berita — Admin",
  description: "Kelola artikel berita sekolah",
}

interface BeritaPageProps {
  searchParams: {
    search?: string
    categoryId?: string
    status?: string
    page?: string
  }
}

export default async function BeritaPage({ searchParams }: BeritaPageProps) {
  const session = (await auth()) as SessionWithRole | null
  const role = (session?.user?.role ?? "CONTRIBUTOR") as Role

  const page = Number(searchParams.page) || 1
  const status = searchParams.status as "DRAFT" | "PUBLISHED" | undefined

  const [articlesResult, categoriesResult] = await Promise.all([
    getArticles({
      search: searchParams.search,
      categoryId: searchParams.categoryId,
      status,
      page,
      pageSize: 10,
    }),
    getCategories(),
  ])

  const articles = articlesResult.success
    ? articlesResult.data.data.map((a: any) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        status: a.status,
        viewCount: a.viewCount ?? 0,
        uniqueViewCount: a.uniqueViewCount ?? 0,
        createdAt: a.createdAt?.toISOString?.() ?? a.createdAt,
        publishedAt: a.publishedAt?.toISOString?.() ?? a.publishedAt ?? null,
        author: a.author ?? null,
        category: a.category ?? null,
      }))
    : []

  const totalPages = articlesResult.success ? articlesResult.data.totalPages : 0
  const total = articlesResult.success ? articlesResult.data.total : 0
  const categories = categoriesResult.success ? categoriesResult.data : []

  return (
    <ArticleList
      articles={articles}
      categories={categories}
      page={page}
      totalPages={totalPages}
      total={total}
      canPublish={hasPermission(role, "article:publish")}
      canDelete={hasPermission(role, "article:delete")}
      canManageCategories={hasPermission(role, "article:publish")}
    />
  )
}
