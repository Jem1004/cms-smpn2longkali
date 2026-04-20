import { getGalleryImages } from "@/actions/gallery"
import { GalleryManager } from "@/components/admin/gallery-manager"

export const metadata = {
  title: "Galeri — Admin",
  description: "Kelola galeri foto sekolah",
}

export default async function GaleriPage() {
  const result = await getGalleryImages()

  const images = result.success
    ? result.data.map((img) => ({
        id: img.id,
        title: img.title,
        description: img.description,
        imageUrl: img.imageUrl,
        order: img.order,
      }))
    : []

  return <GalleryManager images={images} />
}
