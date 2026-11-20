"use client"

import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CalendarHeart,
  Check,
  Crown,
  Gem,
  ShieldCheck,
  Store,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const PREMIUM_PERKS = [
  "Unlimited active services",
  "Premium vendor badge",
  "All Free plan features",
  "12 months of access for $29",
]

export function PaymentCancelled() {
  return (
    <div className="relative overflow-hidden bg-[#FDFBF7] px-4 py-10 sm:px-6 sm:py-16 dark:bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-500/10"
      />
      <div className="relative mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white shadow-xl shadow-rose-950/5 dark:border-input dark:bg-card">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] px-6 py-9 text-center text-white sm:px-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-rose-300/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -left-10 size-44 rounded-full bg-amber-200/15 blur-3xl"
            />

            <div className="relative mx-auto flex size-16 items-center justify-center rounded-full border border-white/25 bg-white/15 backdrop-blur-md">
              <XCircle className="size-8" />
            </div>

            <p className="relative mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold tracking-[0.24em] text-rose-200/90 uppercase">
              <Crown className="size-3" />
              Checkout cancelled
            </p>
            <h1 className="relative mt-1.5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              No payment was taken
            </h1>
            <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-rose-100/80">
              You left Stripe checkout before completing the payment. Your Free
              plan is still active and nothing has been charged.
            </p>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <div className="flex items-center gap-3 rounded-2xl border border-rose-200/75 bg-rose-50/60 p-4 dark:border-input dark:bg-input/20">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#B76E79] shadow-2xs dark:bg-input/40 dark:text-champagne-400">
                <Store className="size-5" />
              </span>
              <div>
                <p className="font-heading text-base font-semibold text-stone-900 dark:text-foreground">
                  Your Free plan is unchanged
                </p>
                <p className="text-xs text-stone-500 dark:text-muted-foreground">
                  You can still publish up to 3 active services and manage every
                  booking request.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase dark:text-muted-foreground">
                <Gem className="size-3.5 text-[#B76E79]" />
                Waiting when you are ready
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {PREMIUM_PERKS.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-muted-foreground"
                  >
                    <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                render={<Link href="/vendor/subscription" />}
                className="gap-2 rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
              >
                Back to plans
                <ArrowRight className="size-4" />
              </Button>
              <Button
                render={<Link href="/vendor" />}
                variant="outline"
                className="gap-2 rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
              >
                <ArrowLeft className="size-4" />
                Vendor dashboard
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-rose-100 pt-4 text-[11px] text-stone-400 dark:border-input dark:text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3" />
                No charge was made
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarHeart className="size-3" />
                Upgrade anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
