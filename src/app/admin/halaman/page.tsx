import { getPages } from "@/actions/page"
import { PageList } from "@/components/admin/page-list"

export const metadata = {
  title: "Halaman — Admin",
  description: "Kelola halaman kustom website",
}

export default async function HalamanPage() {
  const result = await getPages()
  const pages = result.success ? result.data : []
  return <PageList pages={pages} />
}
