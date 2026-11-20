import type { Metadata } from "next"

import { SubscriptionPlans } from "@/components/vendor/SubscriptionPlans"

export const metadata: Metadata = {
  title: "Subscription | WedPlan",
  description:
    "Compare the Free and Premium vendor plans. Upgrade for $29 a year to publish unlimited services and unlock the Premium vendor badge.",
}

export default function SubscriptionPage() {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <SubscriptionPlans />
    </section>
  )
}
