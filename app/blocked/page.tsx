"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Ban, Home, LoaderCircle, LogOut, Mail } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DashboardLoader } from "@/components/dashboard/RoleGate"
import { signOut, useSession } from "@/lib/auth-client"
import { getUserInitials } from "@/lib/format"
import { dashboardPathForRole } from "@/lib/roles"

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const BlockPage = () => {
  const router = useRouter()
  const { data, isPending } = useSession()
  const user = data?.user
  const [signingOut, setSigningOut] = useState(false)

  // Only blocked accounts belong here
  useEffect(() => {
    if (isPending) return
    if (!user) {
      router.replace("/sign-in")
      return
    }
    if (!user.isBlocked) {
      router.replace(dashboardPathForRole(user.role))
    }
  }, [isPending, router, user])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      toast.success("Signed out successfully")
      router.push("/")
    } catch {
      toast.error("Could not sign out. Please try again.")
      setSigningOut(false)
    }
  }

  if (isPending || !user || !user.isBlocked) {
    return <DashboardLoader label="Checking your account…" />
  }

  return (
    <section className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[#FDFBF7] px-4 py-16 sm:px-6 dark:bg-background">
      {/* Soft background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 -z-10 size-96 rounded-full bg-rose-200/40 blur-3xl dark:bg-[#B76E79]/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-0 -z-10 size-96 rounded-full bg-amber-100/50 blur-3xl dark:bg-amber-400/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.7)_0%,rgba(253,242,244,0.5)_100%)] dark:bg-[radial-gradient(circle_at_50%_40%,rgba(183,110,121,0.10)_0%,transparent_70%)]"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-xl text-center"
      >
        <motion.div
          variants={item}
          className="mx-auto rounded-3xl border border-rose-200/80 bg-white/85 p-8 shadow-2xl shadow-rose-950/10 backdrop-blur-xl sm:p-12 dark:border-input dark:bg-card/80 dark:shadow-black/40"
        >
          {/* Icon with pulsing ring */}
          <div className="relative mx-auto flex size-20 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-[#B76E79]/20 dark:bg-[#B76E79]/30"
            />
            <span className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#B76E79] to-[#C58970] text-white shadow-lg shadow-rose-900/20 ring-4 ring-rose-100 dark:shadow-black/40 dark:ring-input">
              <Ban className="size-9" />
            </span>
          </div>

          <p className="mt-7 text-[11px] font-semibold tracking-[0.24em] text-[#B76E79] uppercase dark:text-champagne-400">
            Account suspended
          </p>
          <h1 className="mt-2 font-heading text-3xl leading-tight font-semibold tracking-tight text-balance text-stone-900 sm:text-4xl dark:text-foreground">
            Your account has been{" "}
            <span className="bg-gradient-to-r from-[#B76E79] via-rose-500 to-[#C58970] bg-clip-text text-transparent italic dark:from-[#E8A0AB] dark:via-rose-300 dark:to-[#EBC0A8]">
              blocked
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-pretty text-stone-600 dark:text-muted-foreground">
            An administrator has blocked this account, so dashboards, services
            and bookings are unavailable. If you believe this is a mistake,
            please contact the WedPlan support team.
          </p>

          {/* Signed-in account */}
          <div className="mx-auto mt-7 flex max-w-sm items-center gap-3 rounded-2xl border border-rose-100 bg-[#FDFBF7] p-3 text-left dark:border-input dark:bg-input/15">
            <Avatar className="size-10 ring-2 ring-rose-100 dark:ring-input">
              {user.image ? (
                <AvatarImage
                  src={user.image}
                  alt={user.name ?? "Profile"}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-[#B76E79] to-[#C58970] text-xs font-semibold text-white">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900 dark:text-foreground">
                {user.name ?? "My account"}
              </p>
              <p className="flex items-center gap-1.5 truncate text-xs text-stone-500 dark:text-muted-foreground">
                <Mail className="size-3 shrink-0 text-[#B76E79]" />
                {user.email}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-rose-700 uppercase dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              Blocked
            </span>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="h-12 gap-2 rounded-full bg-[#B76E79] px-8 text-base font-medium text-[#fffdf8] shadow-md shadow-rose-900/10 transition-all hover:bg-[#a25c67] hover:shadow-lg dark:shadow-black/30"
            >
              {signingOut ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              {signingOut ? "Signing out…" : "Sign Out"}
            </Button>

            <Button
              variant="outline"
              render={<Link href="/" />}
              className="h-12 gap-2 rounded-full border-rose-200/90 bg-white/90 px-8 text-base font-medium text-stone-800 shadow-xs transition-all hover:border-rose-300 hover:bg-rose-50/90 hover:text-stone-950 dark:border-input dark:bg-input/20 dark:text-foreground dark:hover:border-[#B76E79]/50 dark:hover:bg-input/40 dark:hover:text-foreground"
            >
              <Home className="size-4 text-[#B76E79]" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default BlockPage