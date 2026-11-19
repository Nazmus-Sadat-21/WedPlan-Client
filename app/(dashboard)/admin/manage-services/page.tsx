import type { Metadata } from "next"

import { ManageServices } from "@/components/admin/ManageServices"

export const metadata: Metadata = {
  title: "Manage Services | WedPlan Admin",
  description:
    "Review vendor submissions, approve or reject services, change publication status and remove inappropriate listings.",
}

export default function ManageServicesPage() {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <ManageServices />
    </section>
  )
}
