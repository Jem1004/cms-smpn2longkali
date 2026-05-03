import { getGraduationStudents, getGraduationSettings, isGraduationActive } from "@/actions/graduation"
import { GraduationManager } from "@/components/admin/graduation-manager"

export const metadata = {
  title: "Kelulusan — Admin",
}

export default async function KelulusanAdminPage() {
  const [studentsResult, settings, active] = await Promise.all([
    getGraduationStudents(),
    getGraduationSettings(),
    isGraduationActive(),
  ])

  const students = studentsResult.success ? studentsResult.data : []

  return (
    <div className="p-6 md:p-8">
      <GraduationManager
        initialStudents={students}
        settings={settings}
        isActive={active}
      />
    </div>
  )
}
