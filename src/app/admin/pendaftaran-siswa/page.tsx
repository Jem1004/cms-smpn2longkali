import { getRegistrations, isRegistrationOpen } from "@/actions/registration"
import { getDepartments } from "@/actions/department"
import { RegistrationManager } from "@/components/admin/registration-manager"

export const metadata = {
  title: "Pendaftaran Siswa — Admin",
}

export default async function PendaftaranPage() {
  const [regResult, deptResult, spmbOpen] = await Promise.all([
    getRegistrations(),
    getDepartments(),
    isRegistrationOpen(),
  ])

  const registrations = regResult.success ? regResult.data : []
  const departments = deptResult.success ? deptResult.data : []

  return (
    <div className="p-6 md:p-8">
      <RegistrationManager
        initialRegistrations={registrations}
        departments={departments}
        spmbOpen={spmbOpen}
      />
    </div>
  )
}
