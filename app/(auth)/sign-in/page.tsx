import type { Metadata } from "next"
import { AlertCircle } from "lucide-react"

import { SignInForm } from "@/components/auth/SignInForm"

export const metadata: Metadata = { title: "Sign In" }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    reason?: string | string[]
    next?: string | string[]
  }>
}) {
  const { reason, next } = await searchParams
  const resolvedReason = Array.isArray(reason) ? reason[0] : reason
  const sessionUnavailable = resolvedReason === "session-unavailable"

  const rawNext = Array.isArray(next) ? next[0] : next
  // Only ever bounce back to an internal dashboard route.
  const nextPath =
    rawNext && /^\/(admin|vendor|customer)(\/|$)/.test(rawNext)
      ? rawNext
      : undefined

  return (
    <div className="w-full space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-[#B76E79] uppercase">
          Welcome back
        </p>
        <h1 className="font-heading text-3xl font-semibold text-balance text-foreground">
          Sign in to continue planning your{" "}
          <span className="text-[#B76E79] italic">perfect day</span>
        </h1>
        <p className="text-sm text-stone-600 dark:text-muted-foreground">
          Manage bookings, services and everything in between.
        </p>
      </header>

      {sessionUnavailable ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            We couldn&apos;t verify your session just now. Sign in again — if
            this keeps happening, wait a moment and retry.
          </p>
        </div>
      ) : null}

      <SignInForm nextPath={nextPath} />
    </div>
  )
}
