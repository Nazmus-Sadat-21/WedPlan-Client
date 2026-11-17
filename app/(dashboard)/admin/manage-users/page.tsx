import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Manage Users" }

export default function ManageUsersPage() {
  return (
    <ComingSoon
      title="Manage Users"
      description="Search and filter registered users, view details and block or unblock accounts."
      backHref="/admin"
      backLabel="Back to Overview"
    />
  )
}
