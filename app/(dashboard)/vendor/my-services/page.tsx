import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "My Services" }

export default function MyServicesPage() {
  return (
    <ComingSoon
      title="My Services"
      description="View, update and delete your services, check approval status and manage availability."
      backHref="/vendor"
      backLabel="Back to Overview"
    />
  )
}
