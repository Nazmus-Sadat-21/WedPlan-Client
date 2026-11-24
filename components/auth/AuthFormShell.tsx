"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

type AuthFormShellProps = {
  eyebrow: string
  /** Heading text; `highlight` is rendered as the italic rose accent. */
  title: string
  highlight?: string
  description: string
  /** Rendered icon element, e.g. `<LogIn />` (components can't cross the server→client boundary). */
  icon: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Frosted card that frames the auth forms. Provides the animated header and a
 * soft glow so sign-in and sign-up feel like part of the same editorial system.
 */
export function AuthFormShell({
  eyebrow,
  title,
  highlight,
  description,
  icon,
  children,
  className,
}: AuthFormShellProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.985 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-rose-200/70 bg-white/85 p-6 shadow-xl shadow-rose-950/5 backdrop-blur-xl sm:p-8 dark:border-input dark:bg-card/85 dark:shadow-black/20",
        className
      )}
    >
      {/* Soft accent glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -right-16 size-48 rounded-full bg-rose-100/70 blur-3xl dark:bg-rose-500/10" />
        <div className="absolute -bottom-24 -left-16 size-48 rounded-full bg-amber-100/50 blur-3xl dark:bg-amber-500/5" />
      </div>

      <header className="mb-6 space-y-3 text-center">
        <motion.span
          initial={reduceMotion ? false : { opacity: 0, scale: 0.8, y: -6 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT }}
          className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-amber-50 text-[#B76E79] shadow-sm ring-1 ring-rose-200/70 dark:from-rose-400/15 dark:to-amber-400/10 dark:text-champagne-400 dark:ring-input"
        >
          <span className="[&_svg]:size-5.5">{icon}</span>
        </motion.span>

        <div>
          <p className="text-[11px] font-semibold tracking-[0.24em] text-[#B76E79] uppercase dark:text-champagne-400">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-semibold text-balance text-stone-900 sm:text-[1.75rem] dark:text-foreground">
            {title}{" "}
            {highlight ? (
              <span className="text-[#B76E79] italic dark:text-champagne-400">
                {highlight}
              </span>
            ) : null}
          </h1>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-pretty text-stone-600 dark:text-muted-foreground">
            {description}
          </p>
        </div>
      </header>

      {children}
    </motion.section>
  )
}
