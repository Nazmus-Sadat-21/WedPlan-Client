import { redirect } from "next/navigation"

/**
 * The Stripe session now returns to /payment/success. Keep this legacy route
 * working by forwarding any session id to the canonical success page.
 */
export default async function CheckoutSuccessRedirect({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>
}) {
  const { session_id } = await searchParams
  const sessionId = Array.isArray(session_id) ? session_id[0] : session_id

  redirect(
    sessionId
      ? `/payment/success?session_id=${encodeURIComponent(sessionId)}`
      : "/payment/success"
  )
}
