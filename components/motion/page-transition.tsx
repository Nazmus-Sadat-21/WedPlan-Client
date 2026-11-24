"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/motion"

/**
 * Route-level entrance used by the `template.tsx` files. A template remounts on
 * navigation, so every page fades up gently without blocking the server render.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="min-w-0"
    >
      {children}
    </motion.div>
  )
}
