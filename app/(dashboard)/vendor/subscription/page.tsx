import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Subscription" }

export default function SubscriptionPage() {
  return (
    <ComingSoon
      title="Subscription Plans"
      description="Compare the Free and Premium plans and upgrade to publish unlimited active services."
      backHref="/vendor"
      backLabel="Back to Overview"
    />
  )
}
