"use client"

import { motion } from "motion/react"
import { BadgeCheck, HandCoins, LifeBuoy, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { WHY_CHOOSE_WEDPLAN } from "@/lib/constants"
import { SectionHeading } from "@/components/Shared/SectionHeading"

const ICONS: Record<string, LucideIcon> = {
  verified: BadgeCheck,
  budget: HandCoins,
  concierge: Sparkles,
  support: LifeBuoy,
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden bg-[#FDFBF7] dark:bg-background py-16 sm:py-20 lg:py-24">
      {/* Soft background glow accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/3 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-100/30 dark:bg-rose-400/10 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeading
            eyebrow="Why WedPlan"
            title="Why Choose WedPlan?"
            description="Planning a wedding should feel joyful, not overwhelming. Here is how WedPlan keeps it that way."
          />
        </motion.div>

        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4"
        >
          {WHY_CHOOSE_WEDPLAN.map((benefit) => {
            const Icon = ICONS[benefit.icon] ?? Sparkles
            return (
              <motion.li key={benefit.title} variants={item}>
                <div className="group h-full rounded-2xl border border-rose-200/75 dark:border-border bg-white dark:bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-300 dark:hover:border-rose-300/40 hover:shadow-xl hover:shadow-rose-950/5 dark:hover:shadow-black/30">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-400/10 text-[#B76E79] transition-colors duration-300 group-hover:bg-[#B76E79] group-hover:text-white">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-stone-800 dark:text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-stone-600 dark:text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}