import type { Metadata } from "next"

import { PaymentSuccess } from "@/components/payment/PaymentSuccess"

export const metadata: Metadata = {
  title: "Payment Success | WedPlan",
  description:
    "Your WedPlan Premium Vendor payment has been confirmed by Stripe.",
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>
}) {
  const { session_id } = await searchParams
  const sessionId = Array.isArray(session_id) ? session_id[0] : session_id

  return <PaymentSuccess sessionId={sessionId ?? null} />
}
