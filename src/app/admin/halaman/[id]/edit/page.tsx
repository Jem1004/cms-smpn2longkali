import { notFound } from "next/navigation"
import { getPageById } from "@/actions/page"
import { PageForm } from "@/components/admin/page-form"

export const metadata = {
  title: "Edit Halaman — Admin",
}

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params
  const result = await getPageById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const page = result.data

  return (
    <PageForm
      mode="edit"
      pageId={page.id}
      initialData={{
        title: page.title,
        slug: page.slug,
        content: page.content,
        isPublished: page.isPublished,
        metaTitle: page.metaTitle ?? null,
        metaDesc: page.metaDesc ?? null,
      }}
    />
  )
}
