"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarHeart,
  Check,
  Crown,
  Gem,
  Infinity as InfinityIcon,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Store,
  WandSparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/lib/auth-client"
import { API_ENDPOINTS } from "@/lib/constants"
import { formatDate } from "@/lib/format"
import type { Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

const PREMIUM_PRICE = 29

const FREE_FEATURES = [
  {
    title: "Up to 3 active services",
    description: "Publish three wedding packages at a time.",
  },
  {
    title: "Basic vendor dashboard",
    description: "Track services, approvals and bookings in one place.",
  },
  {
    title: "Booking request management",
    description: "Accept or decline customer enquiries with one click.",
  },
  {
    title: "Secure service review",
    description: "Every listing is reviewed before it goes live.",
  },
]

const PREMIUM_FEATURES = [
  {
    title: "Unlimited active services",
    description: "Publish every package you offer, with no cap.",
  },
  {
    title: "Premium vendor badge",
    description: "Stand out as a trusted premium partner on WedPlan.",
  },
  {
    title: "All Free plan features",
    description: "Keep your dashboard, bookings and review workflow.",
  },
  {
    title: "A full year of Premium",
    description: "One $29 payment unlocks 12 months of access.",
  },
  {
    title: "Instant activation",
    description: "Premium turns on as soon as Stripe confirms payment.",
  },
]

function isPremiumPlan(plan: unknown): boolean {
  return String(plan ?? "free").toLowerCase() === "premium"
}

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

function PlanFeature({
  title,
  description,
  inverted = false,
}: {
  title: string
  description: string
  inverted?: boolean
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
          inverted
            ? "bg-[#E9C99B]/20 text-[#E9C99B]"
            : "bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400"
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-semibold",
            inverted ? "text-white" : "text-stone-900 dark:text-foreground"
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5 text-xs leading-relaxed",
            inverted
              ? "text-rose-100/70"
              : "text-stone-500 dark:text-muted-foreground"
          )}
        >
          {description}
        </p>
      </div>
    </li>
  )
}

function TransactionStatus({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const paid = normalized === "paid"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
        paid
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          paid ? "bg-emerald-500" : "bg-amber-500"
        )}
      />
      {status}
    </span>
  )
}

export function SubscriptionPlans() {
  const { data, isPending } = useSession()
  const user = data?.user
  const userId = user?.id
  const premium = isPremiumPlan(user?.subscriptionPlan)
  const expiresAt = user?.subscriptionExpiresAt

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)

  useEffect(() => {
    if (isPending || !userId) return

    const controller = new AbortController()
    let active = true

    async function loadTransactions() {
      setHistoryLoading(true)
      setHistoryError(false)
      try {
        const response = await fetch(
          API_ENDPOINTS.vendorTransactions(userId!),
          {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }
        )
        if (!response.ok) throw new Error("Could not load payments.")
        const body = await response.json().catch(() => null)
        if (!active) return
        const list: Transaction[] = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : []
        setTransactions(list)
      } catch {
        if (!active || controller.signal.aborted) return
        setHistoryError(true)
      } finally {
        if (active) setHistoryLoading(false)
      }
    }

    loadTransactions()

    return () => {
      active = false
      controller.abort()
    }
  }, [isPending, userId])

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Skeleton className="h-44 w-full rounded-3xl bg-rose-100/60 dark:bg-input/30" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-[30rem] w-full rounded-3xl bg-rose-100/60 dark:bg-input/30" />
          <Skeleton className="h-[30rem] w-full rounded-3xl bg-rose-100/60 dark:bg-input/30" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      {/* Editorial header */}
      <header className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] px-6 py-7 text-white shadow-xl shadow-rose-950/15 sm:px-8 sm:py-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-rose-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-amber-200/15 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-rose-200/90 uppercase">
              <Sparkles className="size-3.5" />
              Vendor studio
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Grow with <span className="text-rose-200 italic">Premium</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-100/80">
              Publish without limits, carry the Premium badge and keep every
              tool you already use. One simple payment covers a full year.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md",
                premium
                  ? "border-amber-300/40 bg-amber-400/20 text-amber-100"
                  : "border-white/20 bg-white/10 text-white"
              )}
            >
              {premium ? (
                <Crown className="size-3.5" />
              ) : (
                <Store className="size-3.5 text-rose-200" />
              )}
              {premium ? "Premium plan" : "Free plan"}
            </span>
            {premium && expiresAt ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
                <CalendarClock className="size-3.5 text-rose-200" />
                Until {formatDate(expiresAt)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
                <InfinityIcon className="size-3.5 text-rose-200" />
                Upgrade anytime
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Current plan strip */}
      <div className="flex flex-col gap-4 rounded-2xl border border-rose-200/75 bg-white/90 p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-input dark:bg-card/90">
        <div className="flex items-center gap-3.5">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl",
              premium
                ? "bg-gradient-to-br from-[#E9C99B] to-[#C58970] text-[#3a2328]"
                : "bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400"
            )}
          >
            {premium ? <Crown className="size-5" /> : <Store className="size-5" />}
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase dark:text-muted-foreground">
              Your current plan
            </p>
            <p className="font-heading text-lg font-semibold text-stone-900 dark:text-foreground">
              {premium ? "Premium Vendor" : "Free Vendor"}
            </p>
            <p className="text-xs text-stone-500 dark:text-muted-foreground">
              {premium
                ? expiresAt
                  ? `Premium access is active until ${formatDate(expiresAt, "long")}.`
                  : "Premium access is active on your account."
                : "You can publish up to 3 active services on the Free plan."}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "w-fit rounded-full px-3 py-1 text-[11px] font-semibold",
            premium
              ? "border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
              : "border-rose-200/80 bg-rose-50 text-[#9F5863] dark:border-input dark:bg-input/30 dark:text-champagne-400"
          )}
        >
          {premium ? <BadgeCheck className="size-3.5" /> : <Gem className="size-3.5" />}
          {premium ? "Premium active" : "Free forever"}
        </Badge>
      </div>

      {/* Plans */}
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        {/* Free plan */}
        <section className="flex flex-col rounded-3xl border border-rose-200/80 bg-white p-6 shadow-2xs sm:p-8 dark:border-input dark:bg-card">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
              <Store className="size-5" />
            </span>
            {!premium ? (
              <Badge
                variant="outline"
                className="rounded-full border-rose-200/80 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-[#9F5863] dark:border-input dark:bg-input/30 dark:text-champagne-400"
              >
                Current plan
              </Badge>
            ) : null}
          </div>

          <h2 className="mt-5 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
            Free
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-muted-foreground">
            Everything you need to start meeting couples and winning your first
            bookings.
          </p>

          <div className="mt-5 flex items-end gap-2">
            <span className="font-heading text-5xl font-bold text-stone-900 dark:text-foreground">
              $0
            </span>
            <span className="pb-1.5 text-sm text-stone-500 dark:text-muted-foreground">
              forever
            </span>
          </div>

          <div className="my-6 h-px bg-rose-100 dark:bg-input" />

          <ul className="space-y-4">
            {FREE_FEATURES.map((feature) => (
              <PlanFeature key={feature.title} {...feature} />
            ))}
          </ul>

          <div className="mt-auto pt-7">
            <Button
              disabled
              variant="outline"
              className="h-11 w-full rounded-full border-rose-200 bg-white text-sm font-semibold text-stone-500 dark:border-input dark:bg-input/20 dark:text-muted-foreground"
            >
              {premium ? "Included in Premium" : "Your current plan"}
            </Button>
            <p className="mt-2.5 text-center text-[11px] text-stone-400 dark:text-muted-foreground">
              No card required. Upgrade whenever you are ready.
            </p>
          </div>
        </section>

        {/* Premium plan */}
        <section className="relative flex flex-col overflow-hidden rounded-3xl border border-[#E9C99B]/40 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] p-6 text-white shadow-xl shadow-rose-950/20 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-12 size-56 rounded-full bg-[#E9C99B]/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-rose-300/15 blur-3xl"
          />

          <div className="relative flex items-start justify-between gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E9C99B] to-[#C58970] text-[#3a2328] shadow-md">
              <Crown className="size-5" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9C99B]/40 bg-[#E9C99B]/15 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-[#F4DFB8] uppercase backdrop-blur-md">
              <WandSparkles className="size-3" />
              Most popular
            </span>
          </div>

          <h2 className="relative mt-5 font-heading text-2xl font-semibold">
            Premium
          </h2>
          <p className="relative mt-1 text-sm text-rose-100/75">
            For vendors ready to showcase their full portfolio and stand out to
            every couple.
          </p>

          <div className="relative mt-5 flex items-end gap-2">
            <span className="font-heading text-5xl font-bold text-[#F4DFB8]">
              ${PREMIUM_PRICE}
            </span>
            <span className="pb-1.5 text-sm text-rose-100/70">/ year</span>
          </div>
          <p className="relative mt-1 text-[11px] text-rose-100/60">
            One payment. Twelve months of Premium access.
          </p>

          <div className="relative my-6 h-px bg-white/15" />

          <ul className="relative space-y-4">
            {PREMIUM_FEATURES.map((feature) => (
              <PlanFeature key={feature.title} {...feature} inverted />
            ))}
          </ul>

          <div className="relative mt-auto pt-7">
            {premium ? (
              <div className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#E9C99B]/40 bg-white/10 text-sm font-semibold text-[#F4DFB8] backdrop-blur-md">
                <BadgeCheck className="size-4" />
                You are already Premium
              </div>
            ) : (
              <Button
                render={<Link href="/vendor/subscription/checkout" />}
                className="h-11 w-full gap-2 rounded-full bg-gradient-to-r from-[#E9C99B] to-[#D8B482] text-sm font-bold text-[#3a2328] shadow-lg shadow-black/20 transition-all hover:from-[#f0d7ad] hover:to-[#e2c294]"
              >
                Upgrade to Premium
                <ArrowRight className="size-4" />
              </Button>
            )}
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-rose-100/60">
              <LockKeyhole className="size-3" />
              Secure checkout powered by Stripe
            </p>
          </div>
        </section>
      </div>

      {/* Value strip */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        {[
          {
            icon: InfinityIcon,
            title: "No listing cap",
            description: "Publish every package you offer, all year round.",
          },
          {
            icon: BadgeCheck,
            title: "A badge couples trust",
            description: "Your Premium badge appears across your vendor profile.",
          },
          {
            icon: ShieldCheck,
            title: "Verified activation",
            description:
              "Premium is switched on only after Stripe confirms payment.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3.5 rounded-2xl border border-rose-200/75 bg-white/90 p-4 shadow-2xs dark:border-input dark:bg-card/90"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
              <item.icon className="size-4.5" />
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

      {/* Billing history */}
      <section className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white/90 shadow-xs dark:border-input dark:bg-card/90">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 px-5 py-4 sm:px-6 dark:border-input">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
              <ReceiptText className="size-4" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-semibold text-stone-900 dark:text-foreground">
                Billing history
              </h2>
              <p className="text-xs text-stone-500 dark:text-muted-foreground">
                Payments confirmed by Stripe for your vendor account.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-stone-400 dark:text-muted-foreground">
            Read-only record
          </span>
        </div>

        {historyLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-14 w-full rounded-xl bg-rose-100/60 dark:bg-input/30"
              />
            ))}
          </div>
        ) : historyError ? (
          <p className="px-5 py-8 text-center text-sm text-stone-500 sm:px-6 dark:text-muted-foreground">
            Billing history could not be loaded right now. Your current plan is
            still shown above.
          </p>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-10 text-center sm:px-6">
            <span className="flex size-12 items-center justify-center rounded-full bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
              <CalendarHeart className="size-5" />
            </span>
            <p className="mt-3 font-heading text-lg font-semibold text-stone-900 dark:text-foreground">
              No payments yet
            </p>
            <p className="mt-1 max-w-sm text-xs text-stone-500 dark:text-muted-foreground">
              When you upgrade to Premium, your Stripe receipt will appear here
              automatically.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-rose-100 dark:divide-input">
            {transactions.slice(0, 6).map((transaction) => (
              <li
                key={transaction._id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <Crown className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 capitalize dark:text-foreground">
                      {transaction.plan || "Premium"} plan
                    </p>
                    <p className="truncate text-xs text-stone-500 dark:text-muted-foreground">
                      {formatDate(transaction.createdAt, "long")}
                      {transaction.stripeSessionId
                        ? ` • ${transaction.stripeSessionId.slice(-10)}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-sm font-bold text-stone-900 dark:text-foreground">
                    {formatAmount(
                      Number(transaction.amount) || 0,
                      transaction.currency
                    )}
                  </span>
                  <TransactionStatus status={transaction.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-center text-[11px] text-stone-400 dark:text-muted-foreground">
        Premium access is activated by a verified Stripe webhook — never by the
        browser redirect alone.
      </p>
    </div>
  )
}
