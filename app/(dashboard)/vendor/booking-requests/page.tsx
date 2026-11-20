import type { Metadata } from "next"

import { BookingRequests } from "@/components/vendor/BookingRequests"

export const metadata: Metadata = {
  title: "Booking Requests | WedPlan",
  description:
    "Review booking requests for your wedding services, read customer details and accept or decline pending enquiries.",
}

export default function BookingRequestsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <BookingRequests />
    </section>
  )
}
