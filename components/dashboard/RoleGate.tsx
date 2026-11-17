"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { useSession } from "@/lib/auth-client"
import { dashboardPathForRole } from "@/lib/roles"

/** Centered rose-styled loading state shown while the session resolves. */
export function DashboardLoader({
  label = "Loading dashboard…",
}: {
  label?: string
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-[#FDFBF7] dark:bg-background">
      <LoaderCircle className="size-8 animate-spin text-[#B76E79]" />
      <p className="text-sm text-stone-500 dark:text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

/**
 * Blocks access to a role's dashboard subtree for everyone else. Unauthenticated
 * users are redirected to sign-in; authenticated users with the wrong role are
 * redirected to their own dashboard (URL tampering can never expose another
 * role's dashboard).
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
  const role = user?.role

  useEffect(() => {
    if (isPending) return
    if (!user) {
      router.replace("/sign-in")
      return
    }
    if (role && role !== allowedRole) {
      toast.error("You don't have access to that dashboard.")
      router.replace(dashboardPathForRole(role))
    }
  }, [allowedRole, isPending, role, router, user])

  if (isPending || !user || (role && role !== allowedRole)) {
    return <DashboardLoader />
  }

  return children
}
