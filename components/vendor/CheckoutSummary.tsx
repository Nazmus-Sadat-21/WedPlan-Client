"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CreditCard,
  Crown,
  Gem,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Store,
  WandSparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/lib/auth-client"
import { authFetch } from "@/lib/auth-fetch"
import { API_ENDPOINTS } from "@/lib/constants"
import { cn } from "@/lib/utils"

const PREMIUM_PRICE = 29

const PREMIUM_FEATURES = [
  "Unlimited active services",
  "Premium vendor badge on your profile",
  "All Free plan features included",
  "A full 12 months of Premium access",
  "Instant activation after payment is verified",
]

const STEPS = [
  { step: "01", title: "Review plan", description: "Confirm what is included." },
  { step: "02", title: "Pay securely", description: "Complete checkout on Stripe." },
  { step: "03", title: "Get Premium", description: "Activation after verification." },
] as const

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

function isPremiumPlan(plan: unknown): boolean {
  return String(plan ?? "free").toLowerCase() === "premium"
}

export function CheckoutSummary() {
  const { data, isPending } = useSession()
  const user = data?.user
  const userId = user?.id
  const premium = isPremiumPlan(user?.subscriptionPlan)

  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    if (!userId) {
      toast.error("Your session expired. Please sign in again.")
      return
    }

    setRedirecting(true)
    setError(null)

    try {
      // The server derives the vendor from the verified JWT; the body is empty
      // so a vendor can never start a checkout for somebody else.
      const response = await authFetch(API_ENDPOINTS.createCheckoutSession, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(
          body?.message ?? "Could not start the secure checkout session."
        )
      }
      if (!body?.url || typeof body.url !== "string") {
        throw new Error("Stripe did not return a checkout link. Please try again.")
      }

      window.location.assign(body.url)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not start the secure checkout session."
      setError(message)
      toast.error(message)
      setRedirecting(false)
    }
  }

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl bg-rose-100/60 dark:bg-input/30" />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-[26rem] w-full rounded-3xl bg-rose-100/60 dark:bg-input/30" />
          <Skeleton className="h-[22rem] w-full rounded-3xl bg-rose-100/60 dark:bg-input/30" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] px-6 py-7 text-white shadow-xl shadow-rose-950/15 sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-10 size-56 rounded-full bg-rose-300/20 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-rose-200/90 uppercase">
              <Sparkles className="size-3.5" />
              Premium checkout
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              One step to <span className="text-rose-200 italic">Premium</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-100/80">
              Review your plan, then continue to Stripe&apos;s secure checkout.
              WedPlan never sees or stores your card details.
            </p>
          </div>
          <Link
            href="/vendor/subscription"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="size-3.5" />
            Back to plans
          </Link>
        </div>
      </header>

      {/* Steps */}
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((item, index) => (
          <li
            key={item.step}
            className={cn(
              "flex items-center gap-3 rounded-2xl border px-4 py-3",
              index === 0
                ? "border-[#B76E79]/40 bg-rose-50/70 dark:border-input dark:bg-input/20"
                : "border-rose-200/70 bg-white/80 dark:border-input dark:bg-card/70"
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full font-heading text-xs font-bold",
                index === 0
                  ? "bg-[#B76E79] text-white"
                  : "bg-rose-50 text-[#9F5863] dark:bg-input/40 dark:text-champagne-400"
              )}
            >
              {item.step}
            </span>
            <div>
              <p className="text-xs font-semibold text-stone-900 dark:text-foreground">
                {item.title}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-muted-foreground">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {premium ? (
        <div className="flex flex-col items-center rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-rose-50/50 px-6 py-14 text-center shadow-2xs dark:border-amber-500/20 dark:from-amber-500/10 dark:via-card dark:to-card">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E9C99B] to-[#C58970] text-[#3a2328] shadow-md">
            <Crown className="size-6" />
          </span>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
            You are already a Premium vendor
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            Your account already has unlimited active services and the Premium
            badge. There is nothing left to pay.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              render={<Link href="/vendor/subscription" />}
              variant="outline"
              className="rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
            >
              View my plan
            </Button>
            <Button
              render={<Link href="/vendor" />}
              className="gap-2 rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
            >
              Back to dashboard
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[1.45fr_1fr]">
          {/* Plan details */}
          <div className="space-y-5">
            <section className="relative overflow-hidden rounded-3xl border border-[#E9C99B]/40 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] p-6 text-white shadow-lg shadow-rose-950/15 sm:p-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-[#E9C99B]/20 blur-3xl"
              />
              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E9C99B] to-[#C58970] text-[#3a2328] shadow-md">
                    <Crown className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-rose-200/80 uppercase">
                      Selected plan
                    </p>
                    <h2 className="font-heading text-2xl font-semibold">
                      Premium Vendor
                    </h2>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9C99B]/40 bg-[#E9C99B]/15 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-[#F4DFB8] uppercase backdrop-blur-md">
                  <WandSparkles className="size-3" />
                  Best value
                </span>
              </div>

              <p className="relative mt-4 max-w-lg text-sm leading-relaxed text-rose-100/80">
                Showcase your complete portfolio, publish every wedding package
                and carry a badge that helps couples choose you with confidence.
              </p>

              <ul className="relative mt-5 grid gap-2.5 sm:grid-cols-2">
                {PREMIUM_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-rose-50"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E9C99B]/20 text-[#E9C99B]">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-rose-200/80 bg-white/90 p-5 shadow-2xs sm:p-6 dark:border-input dark:bg-card/90">
              <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-stone-900 dark:text-foreground">
                <ShieldCheck className="size-4.5 text-[#B76E79]" />
                What happens after payment
              </h3>
              <div className="mt-4 space-y-4">
                {[
                  {
                    icon: CreditCard,
                    title: "Stripe confirms your payment",
                    description:
                      "You complete the $29 payment on Stripe's hosted checkout page.",
                  },
                  {
                    icon: ReceiptText,
                    title: "A transaction is recorded",
                    description:
                      "A verified webhook saves your receipt and activates Premium.",
                  },
                  {
                    icon: BadgeCheck,
                    title: "Your plan updates instantly",
                    description:
                      "Your dashboard and listings show Premium for the next 12 months.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
                      <item.icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-stone-900 dark:text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-stone-500 dark:text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white shadow-lg shadow-rose-950/5 dark:border-input dark:bg-card">
              <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50/80 to-[#FDFBF7] px-5 py-4 dark:border-input dark:from-input/30 dark:to-input/10">
                <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-stone-900 dark:text-foreground">
                  <ReceiptText className="size-4.5 text-[#B76E79]" />
                  Order summary
                </h2>
              </div>

              <div className="space-y-3.5 px-5 py-5 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-foreground">
                      Premium Vendor
                    </p>
                    <p className="text-xs text-stone-500 dark:text-muted-foreground">
                      12 months of access
                    </p>
                  </div>
                  <span className="font-semibold text-stone-900 dark:text-foreground">
                    {formatUsd(PREMIUM_PRICE)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5" />
                    Billing cycle
                  </span>
                  <span>One-time / yearly</span>
                </div>

                <div className="h-px bg-rose-100 dark:bg-input" />

                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatUsd(PREMIUM_PRICE)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-muted-foreground">
                  <span>Tax</span>
                  <span>Calculated by Stripe</span>
                </div>

                <div className="flex items-end justify-between border-t border-rose-100 pt-3.5 dark:border-input">
                  <span className="text-sm font-semibold text-stone-900 dark:text-foreground">
                    Total due today
                  </span>
                  <span className="font-heading text-3xl font-bold text-stone-900 dark:text-foreground">
                    {formatUsd(PREMIUM_PRICE)}
                  </span>
                </div>

                {error ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="button"
                  disabled={redirecting || !userId}
                  onClick={handleCheckout}
                  className="h-11 w-full gap-2 rounded-full bg-[#B76E79] text-sm font-semibold text-white shadow-md shadow-rose-900/10 transition-all hover:bg-[#a25c67] hover:shadow-lg"
                >
                  {redirecting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Opening secure checkout…
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      Continue to Stripe
                    </>
                  )}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-stone-400 dark:text-muted-foreground">
                  <LockKeyhole className="size-3" />
                  Encrypted and processed by Stripe
                </p>
              </div>

              <div className="flex items-start gap-2.5 border-t border-rose-100 bg-[#FDFBF7] px-5 py-4 dark:border-input dark:bg-input/10">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] leading-relaxed text-stone-500 dark:text-muted-foreground">
                  Your plan is only upgraded after Stripe sends a verified
                  payment event. A browser redirect alone never activates
                  Premium.
                </p>
              </div>
            </div>

            <Link
              href="/vendor/subscription"
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-[#B76E79] dark:text-muted-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Compare plans again
            </Link>
          </aside>
        </div>
      )}

      {/* Reassurance */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-rose-200/60 bg-white/70 px-4 py-3 text-[11px] text-stone-500 dark:border-input dark:bg-card/60 dark:text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          Verified Stripe payments
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck className="size-3.5 text-[#B76E79]" />
          Premium badge included
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gem className="size-3.5 text-[#B76E79]" />
          Unlimited active services
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Store className="size-3.5 text-[#B76E79]" />
          Keep all Free features
        </span>
      </div>
    </div>
  )
}
