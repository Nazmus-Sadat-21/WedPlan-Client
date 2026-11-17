import type { Metadata } from "next"

import { SignInForm } from "@/components/auth/SignInForm"

export const metadata: Metadata = { title: "Sign In" }

export default function SignInPage() {
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
      <SignInForm />
    </div>
  )
}
