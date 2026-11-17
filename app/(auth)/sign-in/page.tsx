import type { Metadata } from "next"

import { SignInForm } from "@/components/auth/SignInForm"

export const metadata: Metadata = { title: "Sign In" }

export default function SignInPage() {
  return (
    <div className="w-full space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage bookings, services and your wedding plans.
        </p>
      </header>
      <SignInForm />
    </div>
  )
}
