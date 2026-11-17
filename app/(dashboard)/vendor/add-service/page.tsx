import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Add Service" }

export default function AddServicePage() {
  return (
    <ComingSoon
      title="Add Service"
      description="Publish a new wedding service with images, pricing and location. Free plan vendors can publish up to 3 active services."
      backHref="/vendor"
      backLabel="Back to Overview"
    />
  )
}
