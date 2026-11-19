import type { Metadata } from "next"

import { ManageUsers } from "@/components/admin/ManageUsers"

export const metadata: Metadata = {
  title: "Manage Users | WedPlan Admin",
  description:
    "Search registered WedPlan members by name or email, review account details and block or unblock access.",
}

export default function ManageUsersPage() {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <ManageUsers />
    </section>
  )
}
