import type { Metadata } from "next"

import { ManageService } from "@/components/vendor/ManageService"

export const metadata: Metadata = {
  title: "My Services | WedPlan Vendor Studio",
  description:
    "View, update, and delete your wedding services, monitor approval status, and manage booking availability.",
}

export default function MyServicesPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <ManageService />
    </section>
  )
}