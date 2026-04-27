import { getRegistrations, isRegistrationOpen, getRegistrationFields } from "@/actions/registration"
import { getDepartments } from "@/actions/department"
import { RegistrationManager } from "@/components/admin/registration-manager"

export const metadata = {
  title: "Pendaftaran Siswa — Admin",
}

export default async function PendaftaranPage() {
  const [regResult, deptResult, spmbOpen, fieldsResult] = await Promise.all([
    getRegistrations(),
    getDepartments(),
    isRegistrationOpen(),
    getRegistrationFields(),
  ])

  const registrations = regResult.success ? regResult.data : []
  const departments = deptResult.success ? deptResult.data : []
  const customFields = fieldsResult.success ? fieldsResult.data : []

  return (
    <div className="p-6 md:p-8">
      <RegistrationManager
        initialRegistrations={registrations}
        departments={departments}
        spmbOpen={spmbOpen}
        customFields={customFields}
      />
    </div>
  )
}
