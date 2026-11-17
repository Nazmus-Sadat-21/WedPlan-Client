import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Manage Services" }

export default function ManageServicesPage() {
  return (
    <ComingSoon
      title="Manage Services"
      description="Review pending submissions, approve or reject services and remove inappropriate listings."
      backHref="/admin"
      backLabel="Back to Overview"
    />
  )
}
