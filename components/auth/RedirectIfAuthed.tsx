"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useSession } from "@/lib/auth-client"
import { dashboardPathForRole } from "@/lib/roles"

/**
 * Sends already-authenticated visitors who open the auth pages straight to
 * their role dashboard. Google OAuth returns the user to /sign-in, where this
 * component completes the role-based redirect.
 */
export function RedirectIfAuthed() {
  const { data, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && data?.user) {
      router.replace(dashboardPathForRole(data.user.role))
    }
  }, [data?.user, isPending, router])

  return null
}
