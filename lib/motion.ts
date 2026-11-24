import type { Transition, Variants } from "motion/react"

/**
 * Shared motion language for WedPlan.
 *
 * Every page and component pulls its easing, durations and variants from here
 * so the whole product moves with the same calm, editorial rhythm.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

export const DURATION = {
  fast: 0.28,
  base: 0.5,
  slow: 0.8,
} as const

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.8,
}

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
}

export const viewportOnce = { once: true, margin: "-80px" } as const
export const viewportEarly = { once: true, margin: "-40px" } as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
}

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
}

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 28 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
}

export const cardHover = {
  y: -6,
  transition: springSoft,
} as const

/** Parent variant that staggers its children into view. */
export function staggerContainer(
  staggerChildren = 0.08,
  delayChildren = 0
): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren, delayChildren },
    },
  }
}

/** Standard page-level entrance used by route templates. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
}
