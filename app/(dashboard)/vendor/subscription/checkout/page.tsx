import type { Metadata } from "next"

import { CheckoutSummary } from "@/components/vendor/CheckoutSummary"

export const metadata: Metadata = {
  title: "Premium Checkout | WedPlan",
  description:
    "Review the WedPlan Premium Vendor plan and continue to Stripe's secure checkout.",
}

export default function SubscriptionCheckoutPage() {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <CheckoutSummary />
    </section>
  )
}
