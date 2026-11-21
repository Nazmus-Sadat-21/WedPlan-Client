"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  Gem,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/lib/auth-client"
import { authFetch } from "@/lib/auth-fetch"
import { API_ENDPOINTS } from "@/lib/constants"
import { formatDate } from "@/lib/format"
import type { Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

type ConfirmationStatus =
  | "checking"
  | "confirmed"
  | "pending"
  | "missing"
  | "error"

const MAX_ATTEMPTS = 8
const RETRY_DELAY = 1500
/** Never let a single confirmation request hang the whole page. */
const REQUEST_TIMEOUT = 8000

function formatAmount(amount: number, currency: string): string {
  const code = String(currency || "usd").toUpperCase()
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

function ReceiptRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs text-stone-500 dark:text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-right text-xs font-semibold text-stone-900 dark:text-foreground",
          mono && "font-mono text-[11px]"
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function PaymentSuccess({ sessionId }: { sessionId: string | null }) {
  const { refetch } = useSession()

  const [status, setStatus] = useState<ConfirmationStatus>(
    sessionId ? "checking" : "missing"
  )
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!sessionId) return

    const controller = new AbortController()
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0

    async function checkConfirmation() {
      attempts += 1

      const requestController = new AbortController()
      const abortRequest = () => requestController.abort()
      controller.signal.addEventListener("abort", abortRequest)
      const requestTimer = setTimeout(abortRequest, REQUEST_TIMEOUT)

      try {
        const response = await authFetch(
          API_ENDPOINTS.transactionBySession(sessionId!),
          {
            cache: "no-store",
            signal: requestController.signal,
            headers: { Accept: "application/json" },
          }
        )

        if (!active) return

        if (response.ok) {
          const body = await response.json().catch(() => null)
          if (!active) return
          if (body && typeof body === "object") {
            setTransaction(body as Transaction)
            setStatus("confirmed")
            return
          }
        }

        if (response.status === 404) {
          const contentType = response.headers.get("content-type") ?? ""
          if (!contentType.includes("application/json")) {
            throw new Error(
              "Could not reach the WedPlan payment service. Check your connection and try again."
            )
          }
          if (attempts >= MAX_ATTEMPTS) {
            setStatus("pending")
            return
          }
          timer = setTimeout(checkConfirmation, RETRY_DELAY)
          return
        }

        const body = await response.json().catch(() => null)
        throw new Error(
          body?.message ?? "We could not confirm this payment right now."
        )
      } catch (err) {
        if (!active || controller.signal.aborted) return

        // A request that timed out (or a dropped connection) is retryable:
        // keep polling, then settle on the non-spinning "pending" state.
        if (requestController.signal.aborted) {
          if (attempts >= MAX_ATTEMPTS) {
            setStatus("pending")
            return
          }
          timer = setTimeout(checkConfirmation, RETRY_DELAY)
          return
        }

        setErrorMessage(
          err instanceof Error
            ? err.message
            : "We could not confirm this payment right now."
        )
        setStatus("error")
      } finally {
        clearTimeout(requestTimer)
        controller.signal.removeEventListener("abort", abortRequest)
      }
    }

    checkConfirmation()

    return () => {
      active = false
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [sessionId, refreshKey])

  useEffect(() => {
    if (status !== "confirmed") return
    void refetch?.()
  }, [status, refetch])

  function retry() {
    if (!sessionId) return
    setStatus("checking")
    setErrorMessage(null)
    setRefreshKey((key) => key + 1)
  }

  const amount = transaction
    ? formatAmount(Number(transaction.amount) || 0, transaction.currency)
    : null

  return (
    <div className="relative overflow-hidden bg-[#FDFBF7] px-4 py-10 sm:px-6 sm:py-16 dark:bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-500/10"
      />
      <div className="relative mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white shadow-xl shadow-rose-950/5 dark:border-input dark:bg-card">
          {/* Status banner */}
          <div
            className={cn(
              "relative overflow-hidden px-6 py-8 text-center text-white sm:px-8",
              status === "confirmed"
                ? "bg-gradient-to-br from-[#1f3d31] via-[#2f5c47] to-[#4c7a5f]"
                : status === "pending" || status === "checking"
                  ? "bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863]"
                  : "bg-gradient-to-br from-[#3a2328] via-[#5b3a3f] to-[#9F5863]"
            )}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -left-10 size-44 rounded-full bg-amber-200/15 blur-3xl"
            />

            <div className="relative mx-auto flex size-16 items-center justify-center rounded-full border border-white/25 bg-white/15 backdrop-blur-md">
              {status === "confirmed" ? (
                <CheckCircle2 className="size-8" />
              ) : status === "checking" ? (
                <LoaderCircle className="size-8 animate-spin" />
              ) : status === "pending" ? (
                <Clock className="size-8" />
              ) : (
                <AlertCircle className="size-8" />
              )}
            </div>

            <p className="relative mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold tracking-[0.24em] uppercase opacity-80">
              <Sparkles className="size-3" />
              WedPlan Premium
            </p>
            <h1 className="relative mt-1.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {status === "confirmed"
                ? "Payment confirmed"
                : status === "checking"
                  ? "Confirming your payment"
                  : status === "pending"
                    ? "Payment received"
                    : status === "missing"
                      ? "Checkout session missing"
                      : "Confirmation unavailable"}
            </h1>
            <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed opacity-80">
              {status === "confirmed"
                ? "Welcome to Premium. Your vendor account has been upgraded and your receipt is saved."
                : status === "checking"
                  ? "Stripe has sent you back to WedPlan. We are waiting for the verified webhook to record your transaction."
                  : status === "pending"
                    ? "Your payment went through, but the confirmation is taking a little longer than usual. It will appear shortly."
                    : status === "missing"
                      ? "We could not find a Stripe session in this link. Open your subscription page to check your plan."
                      : errorMessage}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {status === "checking" ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-xl bg-rose-100/70 dark:bg-input/30" />
                <Skeleton className="h-14 w-full rounded-xl bg-rose-100/70 dark:bg-input/30" />
                <Skeleton className="h-14 w-full rounded-xl bg-rose-100/70 dark:bg-input/30" />
                <p className="pt-2 text-center text-[11px] text-stone-400 dark:text-muted-foreground">
                  This usually takes only a few seconds.
                </p>
              </div>
            ) : status === "confirmed" && transaction ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#E9C99B] to-[#C58970] text-[#3a2328] shadow-sm">
                      <Crown className="size-5" />
                    </span>
                    <div>
                      <p className="font-heading text-base font-semibold text-stone-900 dark:text-foreground">
                        Premium Vendor is active
                      </p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        Unlimited services and your Premium badge are unlocked.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-input/30 dark:text-emerald-300">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </span>
                </div>

                <div className="rounded-2xl border border-rose-200/75 bg-[#FDFBF7] p-4 dark:border-input dark:bg-input/20">
                  <div className="flex items-center gap-2 border-b border-rose-100 pb-2.5 dark:border-input">
                    <ReceiptText className="size-4 text-[#B76E79]" />
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-stone-500 uppercase dark:text-muted-foreground">
                      Payment receipt
                    </p>
                  </div>
                  <div className="divide-y divide-rose-100 dark:divide-input">
                    <ReceiptRow
                      label="Plan"
                      value={
                        <span className="capitalize">
                          {transaction.plan || "Premium"} vendor
                        </span>
                      }
                    />
                    <ReceiptRow
                      label="Amount paid"
                      value={
                        <span className="font-heading text-base">
                          {amount}
                        </span>
                      }
                    />
                    <ReceiptRow
                      label="Payment status"
                      value={
                        <span className="inline-flex items-center gap-1.5 capitalize text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="size-3.5" />
                          {transaction.status}
                        </span>
                      }
                    />
                    <ReceiptRow
                      label="Transaction date"
                      value={formatDate(transaction.createdAt, "long")}
                    />
                    <ReceiptRow
                      label="Reference"
                      value={transaction.stripeSessionId ?? "—"}
                      mono
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    render={<Link href="/vendor" />}
                    className="gap-2 rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
                  >
                    Go to vendor dashboard
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    render={<Link href="/vendor/subscription" />}
                    variant="outline"
                    className="rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
                  >
                    <Gem className="size-4 text-[#B76E79]" />
                    View my subscription
                  </Button>
                </div>

                <p className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-stone-500 dark:border-input dark:bg-input/20 dark:text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  This receipt was recorded by a verified Stripe webhook, not by
                  the browser redirect. Keep it for your records.
                </p>
              </div>
            ) : status === "pending" ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <Clock className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Still waiting for Stripe
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800/80 dark:text-amber-300/80">
                      Your payment is safe. The webhook can take a minute to
                      arrive. Automatic checks are paused now — use{" "}
                      <span className="font-semibold">Check again</span> once
                      Stripe finishes confirming your payment.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={retry}
                    className="gap-2 rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
                  >
                    <RefreshCw className="size-4" />
                    Check again
                  </Button>
                  <Button
                    render={<Link href="/vendor/subscription" />}
                    variant="outline"
                    className="rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
                  >
                    View subscription
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <div>
                    <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                      {status === "missing"
                        ? "No checkout session found"
                        : "We could not confirm this payment"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-rose-800/80 dark:text-rose-300/80">
                      {status === "missing"
                        ? "The success link is incomplete. If you completed a payment, your plan will update once the webhook is processed."
                        : errorMessage}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sessionId ? (
                    <Button
                      type="button"
                      onClick={retry}
                      className="gap-2 rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
                    >
                      <RefreshCw className="size-4" />
                      Try again
                    </Button>
                  ) : null}
                  <Button
                    render={<Link href="/vendor/subscription" />}
                    variant="outline"
                    className="rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
                  >
                    <Crown className="size-4 text-[#B76E79]" />
                    Back to plans
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-rose-100 pt-5 text-[11px] text-stone-400 dark:border-input dark:text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole className="size-3" />
                Secured by Stripe
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3" />
                12 months of Premium
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Store className="size-3" />
                Unlimited services
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-stone-500 dark:text-muted-foreground">
          Need help with a payment? Contact WedPlan support with your receipt
          reference.
        </p>
      </div>
    </div>
  )
}
