import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Booking Requests" }

export default function BookingRequestsPage() {
  return (
    <ComingSoon
      title="Booking Requests"
      description="Review customer booking requests for your services and accept or reject pending ones."
      backHref="/vendor"
      backLabel="Back to Overview"
    />
  )
}
