import type { Metadata } from "next"

import { SignUpForm } from "@/components/auth/SignUpForm"

export const metadata: Metadata = { title: "Sign Up" }

export default function SignUpPage() {
  return (
    <div className="w-full space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-[#B76E79] uppercase">
          Begin your journey
        </p>
        <h1 className="font-heading text-3xl font-semibold text-balance text-foreground">
          Create your <span className="text-[#B76E79] italic">account</span>
        </h1>
        <p className="text-sm text-stone-600 dark:text-muted-foreground">
          Join as a customer to plan your day, or as a vendor to offer services.
        </p>
      </header>
      <SignUpForm />
    </div>
  )
}
