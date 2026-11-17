"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircle, LogIn } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  async function handleGoogleSignIn() {
    setSubmitting(true)
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/sign-in",
      })
      // The browser navigates to Google from here.
    } catch {
      setSubmitting(false)
      toast.error("Google sign-in is unavailable right now.")
    }
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
          className="h-10"
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
        className="h-10 w-full gap-2 bg-[#B76E79] text-[#fffdf8] hover:bg-[#a25a64]"
      >
        {submitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        {submitting ? "Signing in…" : "Sign In"}
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-rose-200/80" />
        <span className="text-xs text-stone-500 dark:text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-rose-200/80" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={submitting}
        className="h-10 w-full gap-2 border-rose-200/90 bg-white/70 hover:bg-rose-50/70 dark:bg-input/30 dark:hover:bg-input/50"
      >
        <GoogleIcon className="size-4" />
        Continue with Google
      </Button>

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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.48-6.5 5.48-4.1 0-7.19-2.94-7.19-7.31 0-4.27 2.98-7.31 7.16-7.31 3.03 0 4.77 1.84 4.77 1.84l2.07-1.81S16.56 2 12.1 2C6.87 2 2.03 6.16 2.03 12c0 5.83 4.36 10 9.97 10 4.98 0 8.7-3.37 8.7-8.31 0-1.01-.14-1.67-.35-2.59z" />
    </svg>
  )
}
