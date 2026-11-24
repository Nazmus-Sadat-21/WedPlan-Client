"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, LoaderCircle, LogIn, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authControlClassName } from "@/components/auth/field-styles"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { PasswordField } from "@/components/auth/PasswordField"
import { authClient } from "@/lib/auth-client"
import { EASE_OUT, fadeUp, springSoft, staggerContainer } from "@/lib/motion"
import { dashboardPathForRole } from "@/lib/roles"
import { validateEmail, validateRequired } from "@/lib/validation"
import { cn } from "@/lib/utils"

export function SignInForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
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

      const code = String((error as { code?: unknown }).code ?? "")
      const status = Number((error as { status?: unknown }).status ?? 0)

      if (status === 503 || code === "AUTH_UNAVAILABLE") {
        toast.error(
          "Sign-in is temporarily unavailable. Please try again in a moment."
        )
        return
      }

      if (status === 429) {
        toast.error("Too many attempts. Please wait a moment and try again.")
        return
      }

      toast.error(
        "Invalid email or password. If you signed up with Google, use “Continue with Google” instead."
      )
      return
    }

    if (data?.user?.isBlocked) {
      router.push("/blocked")
      return
    }

    toast.success("Welcome back!")
    setSubmitting(false)
    router.push(nextPath ?? dashboardPathForRole(data?.user?.role))
  }

  const stagger = staggerContainer(0.07, 0.08)

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={reduceMotion ? undefined : stagger}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      className="space-y-4"
      noValidate
    >
      <motion.div variants={reduceMotion ? undefined : fadeUp} className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          className={cn(authControlClassName, "h-11 rounded-xl")}
        />
        {fieldErrors.email ? (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        ) : null}
      </motion.div>

      <motion.div variants={reduceMotion ? undefined : fadeUp}>
        <PasswordField
          value={password}
          onValueChange={setPassword}
          error={fieldErrors.password}
          autoComplete="current-password"
        />
      </motion.div>

      <motion.div variants={reduceMotion ? undefined : fadeUp}>
        <motion.div
          whileHover={reduceMotion || submitting ? undefined : { y: -2 }}
          whileTap={reduceMotion || submitting ? undefined : { scale: 0.99 }}
          transition={springSoft}
        >
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-[#B76E79] to-[#C58970] text-sm font-semibold text-[#fffdf8] shadow-md shadow-rose-900/15 transition-shadow hover:shadow-lg hover:shadow-rose-900/20 focus-visible:border-[#B76E79] focus-visible:ring-[#B76E79]/30 dark:from-champagne-500 dark:to-champagne-400 dark:text-stone-950 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"
          >
            {submitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            {submitting ? "Signing in…" : "Sign In"}
            {!submitting ? <ArrowRight className="size-4" /> : null}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : fadeUp}
        className="flex items-center gap-3"
      >
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-200 dark:to-input" />
        <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase dark:text-muted-foreground">
          or continue with
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-200 dark:to-input" />
      </motion.div>

      <motion.div variants={reduceMotion ? undefined : fadeUp}>
        <GoogleSignInButton callbackURL="/sign-in" disabled={submitting} />
      </motion.div>

      <motion.p
        variants={reduceMotion ? undefined : fadeUp}
        className="text-center text-sm text-stone-600 dark:text-muted-foreground"
      >
        New to WedPlan?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-[#B76E79] underline-offset-4 hover:underline dark:text-champagne-400"
        >
          Create an account
        </Link>
      </motion.p>

      <motion.p
        variants={reduceMotion ? undefined : fadeUp}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: EASE_OUT }}
        className="flex items-center justify-center gap-1.5 border-t border-rose-100 pt-4 text-[11px] text-stone-400 dark:border-input dark:text-muted-foreground"
      >
        <ShieldCheck className="size-3.5 text-emerald-500" />
        Your details are encrypted and never shared.
      </motion.p>
    </motion.form>
  )
}
