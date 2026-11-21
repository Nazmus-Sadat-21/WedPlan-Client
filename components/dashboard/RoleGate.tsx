"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Heart } from "lucide-react"
import { toast } from "sonner"

import { useSession } from "@/lib/auth-client"

/** Centered rose-styled loading state shown while the session resolves. */
export function DashboardLoader({
  label = "Loading dashboard…",
}: {
  label?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative isolate flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-[#FDFBF7] px-4 dark:bg-background"
    >
      {/* Soft background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 -z-10 size-96 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-500/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-0 -z-10 size-96 rounded-full bg-amber-100/50 blur-3xl dark:bg-amber-500/5"
      />

      {/* Spinner ring around a pulsing brand mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex size-24 items-center justify-center"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-4 border-rose-100 dark:border-input"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#B76E79] border-r-[#C58970]"
        />
        <span className="flex size-14 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-[#B76E79] to-[#C58970] text-white shadow-lg shadow-rose-900/20">
          <Heart className="size-6 fill-white/30" />
        </span>
      </motion.div>

      {/* Label with bouncing dots */}
      <div className="flex flex-col items-center gap-3">
        <p className="font-heading text-lg font-semibold text-stone-800 dark:text-foreground">
          {label}
        </p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="size-2 rounded-full bg-[#B76E79]"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: dot * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Blocks access to a role's dashboard subtree for everyone else.
 *
 * - Not signed in: redirected to sign-in.
 * - Blocked account: redirected home with a message.
 * - Signed in with a different role (or no role): redirected to the
 *   unauthorized page, so URL tampering can never expose another role's
 *   dashboard.
 */
export function RoleGate({
  role: allowedRole,
  children,
}: {
  role: "vendor" | "customer" | "admin"
  children: React.ReactNode
}) {
  const { data, isPending } = useSession()
  const router = useRouter()
  const user = data?.user
  const role = user?.role ? String(user.role).toLowerCase() : null

  const isBlocked = Boolean(user?.isBlocked)
  const hasAccess = Boolean(user) && !isBlocked && role === allowedRole

  // Guards against double toasts/redirects (React StrictMode runs effects twice in dev)
  const handledRef = useRef(false)
  console.log("RoleGate", { allowedRole, isPending, role, hasAccess })
  useEffect(() => {
    if (isPending) return

    if (hasAccess) {
      handledRef.current = false
      return
    }
    if (handledRef.current) return
    handledRef.current = true

    if (!user) {
      router.replace("/sign-in")
      return
    }
    if (isBlocked) {
      toast.error("Your account is blocked. Contact support for help.")
      router.replace("/blocked")
      return
    }
    // Wrong role (or missing role): the unauthorized page explains why
    router.replace("/unauthorized")
  }, [hasAccess, isBlocked, isPending, router, user])

  if (isPending) return <DashboardLoader label="Checking your access…" />
  if (!hasAccess) return <DashboardLoader label="Redirecting…" />

  return children
}