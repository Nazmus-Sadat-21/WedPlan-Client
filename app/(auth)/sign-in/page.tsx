import type { Metadata } from "next"
import { AlertCircle, LogIn } from "lucide-react"

import { AuthFormShell } from "@/components/auth/AuthFormShell"
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
    <AuthFormShell
      eyebrow="Welcome back"
      title="Sign in to continue planning your"
      highlight="perfect day"
      description="Manage bookings, services and everything in between."
      icon={<LogIn />}
    >
      {sessionUnavailable ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            We couldn&apos;t verify your session just now. Sign in again — if
            this keeps happening, wait a moment and retry.
          </p>
        </div>
      ) : null}

      <SignInForm nextPath={nextPath} />
    </AuthFormShell>
  )
}
