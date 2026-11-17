import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "My Bookings" }

export default function MyBookingsPage() {
  return (
    <ComingSoon
      title="My Bookings"
      description="Track every booking request you have submitted and cancel pending ones."
      backHref="/customer"
      backLabel="Back to Overview"
    />
  )
}
