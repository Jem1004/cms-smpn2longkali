import { getPublicStaff } from "@/lib/queries"
import { StaffCarousel } from "./staff-carousel"

export async function StaffSlider() {
  const staff = await getPublicStaff()

  if (staff.length === 0) {
    return null
  }

  return (
    <section className="bg-white py-16 md:py-24 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Guru &amp; Tenaga Kependidikan
          </h2>
          <p className="text-slate-500 mt-2 text-base">
            Mengenal lebih dekat tim profesional kami.
          </p>
        </div>

        <StaffCarousel
          staff={staff.map((s) => ({
            id: s.id,
            name: s.name,
            position: s.position,
            photoUrl: s.photoUrl,
          }))}
        />
      </div>
    </section>
  )
}
