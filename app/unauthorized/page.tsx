"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowLeft, Home, LayoutDashboard, LogIn, ShieldX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
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

const UnauthorizedPage = () => {
  const router = useRouter()
  const { data, isPending } = useSession()
  const user = data?.user

  // Go back if there is history to return to, otherwise fall back to home
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-center justify-center overflow-hidden bg-[#FDFBF7] px-4 py-16 sm:px-6 dark:bg-background">
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
        {/* Oversized 403 behind the card */}
        <motion.p
          variants={item}
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 left-1/2 -z-10 -translate-x-1/2 font-heading text-[9rem] leading-none font-bold tracking-tight text-transparent select-none [--ghost-stroke:rgba(183,110,121,0.22)] sm:-top-14 sm:text-[13rem] dark:[--ghost-stroke:rgba(214,150,160,0.28)]"
          style={{ WebkitTextStroke: "2px var(--ghost-stroke)" }}
        >
          403
        </motion.p>

        <motion.div
          variants={item}
          className="mx-auto mt-10 rounded-3xl border border-rose-200/80 bg-white/85 p-8 shadow-2xl shadow-rose-950/10 backdrop-blur-xl sm:mt-14 sm:p-12 dark:border-input dark:bg-card/80 dark:shadow-black/40"
        >
          {/* Icon with pulsing ring */}
          <div className="relative mx-auto flex size-20 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-[#B76E79]/20 dark:bg-[#B76E79]/30"
            />
            <span className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#B76E79] to-[#C58970] text-white shadow-lg shadow-rose-900/20 ring-4 ring-rose-100 dark:shadow-black/40 dark:ring-input">
              <ShieldX className="size-9" />
            </span>
          </div>

          <p className="mt-7 text-[11px] font-semibold tracking-[0.24em] text-[#B76E79] uppercase dark:text-champagne-400">
            Access restricted
          </p>
          <h1 className="mt-2 font-heading text-3xl leading-tight font-semibold tracking-tight text-balance text-stone-900 sm:text-4xl dark:text-foreground">
            This page is{" "}
            <span className="bg-gradient-to-r from-[#B76E79] via-rose-500 to-[#C58970] bg-clip-text text-transparent italic dark:from-[#E8A0AB] dark:via-rose-300 dark:to-[#EBC0A8]">
              not for you
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-pretty text-stone-600 dark:text-muted-foreground">
            {user
              ? "Your account doesn't have permission to view this page. If you think this is a mistake, try signing in with a different account."
              : "You need to sign in with the right account to view this page."}
          </p>

          {/* Actions */}
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={handleBack}
              className="h-12 gap-2 rounded-full bg-[#B76E79] px-8 text-base font-medium text-[#fffdf8] shadow-md shadow-rose-900/10 transition-all hover:bg-[#a25c67] hover:shadow-lg dark:shadow-black/30"
            >
              <ArrowLeft className="size-4" />
              Go Back
            </Button>

            {isPending ? null : user ? (
              <Button
                variant="outline"
                render={<Link href={dashboardPathForRole(user.role)} />}
                className="h-12 gap-2 rounded-full border-rose-200/90 bg-white/90 px-8 text-base font-medium text-stone-800 shadow-xs transition-all hover:border-rose-300 hover:bg-rose-50/90 hover:text-stone-950 dark:border-input dark:bg-input/20 dark:text-foreground dark:hover:border-[#B76E79]/50 dark:hover:bg-input/40 dark:hover:text-foreground"
              >
                <LayoutDashboard className="size-4 text-[#B76E79]" />
                My Dashboard
              </Button>
            ) : (
              <Button
                variant="outline"
                render={<Link href="/sign-in" />}
                className="h-12 gap-2 rounded-full border-rose-200/90 bg-white/90 px-8 text-base font-medium text-stone-800 shadow-xs transition-all hover:border-rose-300 hover:bg-rose-50/90 hover:text-stone-950 dark:border-input dark:bg-input/20 dark:text-foreground dark:hover:border-[#B76E79]/50 dark:hover:bg-input/40 dark:hover:text-foreground"
              >
                <LogIn className="size-4 text-[#B76E79]" />
                Sign In
              </Button>
            )}
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-[#B76E79] dark:text-muted-foreground dark:hover:text-champagne-400"
          >
            <Home className="size-3.5" />
            Return to home page
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default UnauthorizedPage