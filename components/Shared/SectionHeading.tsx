"use client"

import { motion, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: "center" | "left"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? (
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#B76E79] uppercase">
          <span
            aria-hidden="true"
            className="h-px w-6 bg-gradient-to-r from-transparent to-[#B76E79]"
          />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 font-heading text-3xl font-semibold text-balance text-stone-800 dark:text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base text-pretty text-stone-600 dark:text-muted-foreground">
          {description}
        </p>
      ) : null}
    </motion.div>
  )
}
