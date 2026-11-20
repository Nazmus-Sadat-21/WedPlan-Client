import type { Metadata } from "next"

import { Transactions } from "@/components/admin/Transactions"

export const metadata: Metadata = {
  title: "Transactions | WedPlan",
  description:
    "Review vendor Premium subscription payments, amounts and statuses recorded from verified Stripe events.",
}

export default function TransactionsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <Transactions />
    </section>
  )
}
