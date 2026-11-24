import type { Metadata } from "next"
import { Sparkles } from "lucide-react"

import { AuthFormShell } from "@/components/auth/AuthFormShell"
import { SignUpForm } from "@/components/auth/SignUpForm"

export const metadata: Metadata = { title: "Sign Up" }

export default function SignUpPage() {
  return (
    <AuthFormShell
      eyebrow="Begin your journey"
      title="Create your"
      highlight="account"
      description="Join as a customer to plan your day, or as a vendor to offer services."
      icon={<Sparkles />}
    >
      <SignUpForm />
    </AuthFormShell>
  )
}
