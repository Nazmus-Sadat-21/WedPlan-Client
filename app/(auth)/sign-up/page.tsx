import type { Metadata } from "next"

import { SignUpForm } from "@/components/auth/SignUpForm"

export const metadata: Metadata = { title: "Sign Up" }

export default function SignUpPage() {
  return (
    <div className="w-full space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join as a customer to plan your day, or as a vendor to offer services.
        </p>
      </header>
      <SignUpForm />
    </div>
  )
}
