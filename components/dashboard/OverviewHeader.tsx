"use client"

import { motion, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/motion"
import { useSession } from "@/lib/auth-client"

/** Greeting header shown at the top of each dashboard overview page. */
export function OverviewHeader({ subtitle }: { subtitle: string }) {
  const { data } = useSession()
  const user = data?.user
  const reduceMotion = useReducedMotion()

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B76E79] uppercase">
          Dashboard
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-balance text-stone-900 sm:text-3xl dark:text-foreground">
          Welcome back,
          <span className="text-[#B76E79] italic">
            {" "}
            {user?.name?.split(" ")[0] ?? "there"}
          </span>
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {user?.role ? (
        <motion.span
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: EASE_OUT }}
          className="inline-flex w-fit items-center rounded-full bg-rose-100/80 px-3 py-1 text-xs font-semibold tracking-wide text-[#9F5863] uppercase"
        >
          {user.role} account
        </motion.span>
      ) : null}
    </motion.header>
  )
}
