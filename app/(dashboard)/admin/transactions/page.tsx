import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Transactions" }

export default function TransactionsPage() {
  return (
    <ComingSoon
      title="Transactions"
      description="Review vendor subscription payments, amounts and statuses recorded from verified Stripe events."
      backHref="/admin"
      backLabel="Back to Overview"
    />
  )
}
