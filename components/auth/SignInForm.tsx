"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircle, LogIn } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authControlClassName } from "@/components/auth/field-styles"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { PasswordField } from "@/components/auth/PasswordField"
import { authClient } from "@/lib/auth-client"
import { dashboardPathForRole } from "@/lib/roles"
import { validateEmail, validateRequired } from "@/lib/validation"

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string | null
    password?: string | null
  }>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = {
      email: validateEmail(email),
      password: validateRequired(password, "Password"),
    }
    setFieldErrors(errors)

    if (errors.email || errors.password) {
      toast.error("Please fix the highlighted fields.")
      return
    }

    setSubmitting(true)
    const { data, error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    })

    if (error) {
      setSubmitting(false)
      toast.error(error.message ?? "Invalid email or password.")
      return
    }

    toast.success("Welcome back!")
    setSubmitting(false)
    router.push(dashboardPathForRole(data?.user?.role))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          className={authControlClassName}
        />
        {fieldErrors.email ? (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        ) : null}
      </div>

      <PasswordField
        value={password}
        onValueChange={setPassword}
        error={fieldErrors.password}
        autoComplete="current-password"
      />

      <Button
        type="submit"
        disabled={submitting}
        className="h-10 w-full gap-2 bg-[#B76E79] text-[#fffdf8] hover:bg-[#a25a64] focus-visible:border-[#B76E79] focus-visible:ring-[#B76E79]/30 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"
      >
        {submitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        {submitting ? "Signing in…" : "Sign In"}
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-rose-200/80 dark:bg-input" />
        <span className="text-xs text-stone-500 dark:text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-rose-200/80 dark:bg-input" />
      </div>

      <GoogleSignInButton callbackURL="/sign-in" disabled={submitting} />

      <p className="text-center text-sm text-stone-600 dark:text-muted-foreground">
        New to WedPlan?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-[#B76E79] underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  )
}
