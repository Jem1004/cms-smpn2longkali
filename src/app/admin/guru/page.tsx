import { getStaffList } from "@/actions/staff"
import { StaffManager } from "@/components/admin/staff-manager"

export const metadata = {
  title: "Data Guru — Admin",
  description: "Kelola data guru dan tenaga kependidikan",
}

export default async function GuruPage() {
  const result = await getStaffList()

  const staff = result.success
    ? result.data.map((s) => ({
        id: s.id,
        name: s.name,
        position: s.position,
        photoUrl: s.photoUrl,
        order: s.order,
      }))
    : []

  return <StaffManager staff={staff} />
}
