"use client"

import type { LucideIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  className?: string
  /** Optional supporting line under the number. */
  hint?: string
  /** Optional accent tone for the icon tile. */
  tone?: "rose" | "emerald" | "amber" | "sky" | "violet"
}

const TONES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  rose: "bg-rose-100/80 text-[#B76E79] dark:bg-rose-400/10 dark:text-rose-300",
  emerald:
    "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  sky: "bg-sky-100/80 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  violet:
    "bg-violet-100/80 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
}

/** Dashboard statistics card (rose theme, consistent with the site UI). */
export function StatCard({
  label,
  value,
  icon: Icon,
  className,
  hint,
  tone = "rose",
}: StatCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className={cn(
        "rounded-2xl border border-rose-200/70 bg-white p-5 shadow-xs shadow-rose-950/5 transition-shadow hover:shadow-lg hover:shadow-rose-950/10 dark:border-input dark:bg-input/20",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300",
            TONES[tone]
          )}
        >
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold text-stone-900 dark:text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] text-stone-500 dark:text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </motion.div>
  )
}
