import type { Metadata } from "next"

import { PaymentCancelled } from "@/components/payment/PaymentCancelled"

export const metadata: Metadata = {
  title: "Payment Cancelled | WedPlan",
  description:
    "Your WedPlan Premium checkout was cancelled. No payment was taken and your Free plan is unchanged.",
}

export default function PaymentCancelPage() {
  return <PaymentCancelled />
}
