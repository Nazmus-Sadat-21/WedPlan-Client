"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { authFocusRingClassName } from "@/components/auth/field-styles"
import { authClient } from "@/lib/auth-client"
import { springSoft } from "@/lib/motion"
import {
  clearPendingGoogleRole,
  rememberPendingGoogleRole,
  type SignupRole,
} from "@/lib/roles"
import { cn } from "@/lib/utils"

type GoogleSignInButtonProps = {
  /** Where Google returns the user; the auth layout then redirects by role. */
  callbackURL?: string
  /** On sign-up, the role the new Google account should receive. */
  role?: SignupRole
  disabled?: boolean
  label?: string
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.48-6.5 5.48-4.1 0-7.19-2.94-7.19-7.31 0-4.27 2.98-7.31 7.16-7.31 3.03 0 4.77 1.84 4.77 1.84l2.07-1.81S16.56 2 12.1 2C6.87 2 2.03 6.16 2.03 12c0 5.83 4.36 10 9.97 10 4.98 0 8.7-3.37 8.7-8.31 0-1.01-.14-1.67-.35-2.59z" />
    </svg>
  )
}

/**
 * Google OAuth button shared by the sign-in and sign-up pages. Kicks off the
 * Better Auth social flow with the google provider; the browser navigates to
 * Google and comes back to `callbackURL`, where RedirectIfAuthed completes the
 * role-based dashboard redirect.
 *
 * During sign-up the selected role is stashed so the OAuth round-trip (which
 * cannot carry extra sign-up fields) can apply it once the account exists.
 */
export function GoogleSignInButton({
  callbackURL = "/sign-in",
  role,
  disabled,
  label,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const reduceMotion = useReducedMotion()

  async function handleClick() {
    setLoading(true)
    if (role) {
      rememberPendingGoogleRole(role)
    } else {
      clearPendingGoogleRole()
    }

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      })
      if (error) {
        clearPendingGoogleRole()
        setLoading(false)
        toast.error(
          error.message ??
            "Google authentication is unavailable right now. Please try again."
        )
      }
      // On success the browser navigates to Google from here — keep the
      // spinner visible during the redirect.
    } catch {
      clearPendingGoogleRole()
      setLoading(false)
      toast.error(
        "Google authentication is unavailable right now. Please try again."
      )
    }
  }

  return (
    <motion.div
      whileHover={reduceMotion || disabled || loading ? undefined : { y: -2 }}
      whileTap={reduceMotion || disabled || loading ? undefined : { scale: 0.99 }}
      transition={springSoft}
    >
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          "h-11 w-full gap-2.5 rounded-xl border-rose-200/90 bg-white/70 text-sm font-medium hover:border-[#B76E79]/40 hover:bg-rose-50/70 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
          authFocusRingClassName
        )}
      >
        {loading ? (
          <LoaderCircle className="size-4 animate-spin text-[#B76E79] dark:text-champagne-400" />
        ) : (
          <GoogleIcon className="size-4" />
        )}
        {loading
          ? "Redirecting to Google…"
          : (label ?? "Continue with Google")}
      </Button>
    </motion.div>
  )
}
