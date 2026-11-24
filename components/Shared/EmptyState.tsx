"use client"

import type { LucideIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 px-6 py-16 text-center",
        className
      )}
    >
      {Icon ? (
        <motion.div
          initial={reduceMotion ? false : { scale: 0.7, rotate: -8 }}
          animate={reduceMotion ? undefined : { scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT }}
          className="flex size-12 items-center justify-center rounded-full bg-champagne-500/15 text-champagne-700 dark:text-champagne-300"
        >
          <Icon className="size-6" />
        </motion.div>
      ) : null}
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  )
}
