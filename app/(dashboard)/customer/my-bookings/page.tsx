import type { Metadata } from "next"

import { MyBookings } from "@/components/customer/MyBookings"

export const metadata: Metadata = {
  title: "My Bookings | WedPlan",
  description:
    "Track every booking request you have sent, review vendor replies and cancel pending requests.",
}

export default function MyBookingsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <MyBookings />
    </section>
  )
}
