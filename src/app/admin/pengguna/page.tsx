import { getUsers } from "@/actions/user"
import { UserManager } from "@/components/admin/user-manager"

export const metadata = {
  title: "Pengguna — Admin",
  description: "Kelola akun pengguna dan staf admin",
}

export default async function PenggunaPage() {
  const result = await getUsers()

  const users = result.success
    ? result.data.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
      }))
    : []

  return <UserManager users={users} />
}
