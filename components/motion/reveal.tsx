"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import {
  EASE_OUT,
  fadeUp,
  staggerContainer,
} from "@/lib/motion"

type RevealProps = {
  children: ReactNode
  className?: string
  /** Seconds to wait before the reveal starts. */
  delay?: number
  /** Vertical travel in pixels. */
  y?: number
  duration?: number
  once?: boolean
  /** Animate immediately on mount instead of when scrolled into view. */
  onMount?: boolean
}

/**
 * Fade + rise entrance for any block. Respects the user's reduced-motion
 * preference and only animates once by default.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.55,
  once = true,
  onMount = false,
}: RevealProps) {
  const reduceMotion = useReducedMotion()

  const animationProps = reduceMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
    : onMount
      ? {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
        }
      : {
          initial: { opacity: 0, y },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once, margin: "-70px" },
        }

  return (
    <motion.div
      {...animationProps}
      transition={{ duration, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

type StaggerProps = {
  children: ReactNode
  className?: string
  stagger?: number
  delayChildren?: number
  once?: boolean
  onMount?: boolean
}

/** Parent that reveals its <StaggerItem> children one after another. */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0,
  once = true,
  onMount = false,
}: StaggerProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      {...(onMount
        ? { animate: "show" }
        : { whileInView: "show", viewport: { once, margin: "-80px" } })}
      className={className}
    >
      {children}
    </motion.div>
  )
}

type StaggerItemProps = {
  children: ReactNode
  className?: string
}

/** Child of <Stagger>. Inherits the parent's stagger timing. */
export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div variants={fadeUp} className={cn(className)}>
      {children}
    </motion.div>
  )
}
