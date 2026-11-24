"use client"

import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { ArrowLeft, Heart } from "lucide-react"

import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

/**
 * Go back one step in history. When the page was opened directly (new tab,
 * pasted link) there is nothing to go back to, so fall back to `fallbackHref`.
 */
export function BackButton({
  fallbackHref = "/",
  label = "Back",
  className,
}: {
  fallbackHref?: string
  label?: string
  className?: string
}) {
  const router = useRouter()
  const reduceMotion = useReducedMotion()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleBack}
      initial={reduceMotion ? false : { opacity: 0, x: -10 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className={cn(
        "group relative inline-flex items-center gap-2.5 rounded-full border border-rose-200/80 bg-white/80 py-1 pr-4 pl-1 text-sm font-semibold text-stone-700 shadow-sm shadow-rose-950/5 dark:shadow-black/20 backdrop-blur-md transition-all duration-300 outline-none hover:-translate-y-px hover:border-[#B76E79]/50 hover:text-[#9F5863] hover:shadow-md hover:shadow-rose-900/10 dark:hover:shadow-black/30 focus-visible:ring-2 focus-visible:ring-[#B76E79]/50 active:translate-y-0 active:scale-[0.98] dark:border-rose-300/20 dark:bg-white/5 dark:text-foreground dark:hover:border-rose-300/40 dark:hover:text-rose-200",
        className
      )}
    >
      {/* Rose-gold medallion holding the arrow */}
      <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#B76E79] to-[#C58970] text-white shadow-md shadow-rose-900/20 dark:shadow-black/20 ring-2 ring-white/80 dark:ring-white/10">
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />
        <ArrowLeft className="relative size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
      </span>
      {label}
      <Heart
        aria-hidden="true"
        className="size-3 scale-50 fill-[#B76E79]/30 text-[#B76E79] opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
      />
    </motion.button>
  )
}
