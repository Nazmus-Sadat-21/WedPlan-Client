"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateUser, useSession } from "@/lib/auth-client"
import {
  clearPendingGoogleRole,
  dashboardPathForRole,
  readPendingGoogleRole,
} from "@/lib/roles"

/**
 * Sends already-authenticated visitors who open the auth pages straight to
 * their role dashboard. Google OAuth returns the user to /sign-in (or /sign-up),
 * where this component completes the role-based redirect.
 *
 * When a Google sign-up comes back to /sign-up, the role chosen before leaving
 * for Google is applied to the freshly created account first.
 */
export function RedirectIfAuthed() {
  const { data, isPending } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const applyingRole = useRef(false)

  useEffect(() => {
    if (isPending || !data?.user) return

    const user = data.user
    const pendingRole = pathname === "/sign-up" ? readPendingGoogleRole() : null

    if (!pendingRole) {
      // A role update is in flight — wait for it instead of redirecting with
      // the previous role from the cached session.
      if (applyingRole.current) return
      router.replace(dashboardPathForRole(user.role))
      return
    }

    clearPendingGoogleRole()

    if (user.role === pendingRole) {
      router.replace(dashboardPathForRole(pendingRole))
      return
    }

    if (applyingRole.current) return
    applyingRole.current = true

    updateUser({ role: pendingRole })
      .then(({ error }) => {
        if (error) {
          toast.error(error.message ?? "Could not finish Google sign-up.")
          router.replace(dashboardPathForRole(user.role))
          return
        }
        toast.success("Account created — welcome to WedPlan!")
        router.replace(dashboardPathForRole(pendingRole))
      })
      .catch(() => {
        toast.error("Could not finish Google sign-up. Please try again.")
        router.replace(dashboardPathForRole(user.role))
      })
      .finally(() => {
        applyingRole.current = false
      })
  }, [data?.user, isPending, pathname, router])

  return null
}
