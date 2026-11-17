import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Customer Dashboard" }

export default function CustomerDashboardPage() {
  return (
    <ComingSoon
      title="Customer Dashboard"
      description="Your bookings overview, booking management and profile controls are being prepared — coming in the next build."
      backHref="/browse-services"
      backLabel="Browse Services"
    />
  )
}
