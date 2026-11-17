import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Vendor Dashboard" }

export default function VendorDashboardPage() {
  return (
    <ComingSoon
      title="Vendor Dashboard"
      description="Service management, booking requests and your subscription plan are being prepared — coming in the next build."
      backHref="/browse-services"
      backLabel="Browse Services"
    />
  )
}
