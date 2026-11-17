"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { CalendarHeart, HeartHandshake, Search } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HOW_IT_WORKS_STEPS } from "@/lib/constants"
import { SectionHeading } from "@/components/Shared/SectionHeading"

const ICONS: Record<string, LucideIcon> = {
  search: Search,
  calendar: CalendarHeart,
  heart: HeartHandshake,
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-t border-rose-200/50 bg-[#FDFBF7] py-16 sm:py-20 lg:py-24">
      {/* Soft background glow accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-100/30 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeading
            eyebrow="Simple by design"
            title="How WedPlan Works"
            description="Three steps between you and a wedding day that feels exactly like you imagined."
          />
        </motion.div>

        <motion.ol
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="relative mx-auto mt-10 grid max-w-5xl gap-8 lg:mt-14 lg:grid-cols-3 lg:gap-6"
        >
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = ICONS[step.icon] ?? HeartHandshake
            return (
              <motion.li key={step.step} variants={item} className="relative">
                <div className="flex h-full flex-col items-center rounded-2xl border border-rose-200/75 bg-white p-6 text-center shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-950/5 lg:p-7">
                  <span className="font-heading text-4xl font-semibold text-[#B76E79]/40">
                    {step.step}
                  </span>
                  <span className="mt-3 flex size-12 items-center justify-center rounded-full bg-rose-50 text-[#B76E79]">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-heading text-xl font-semibold text-stone-800">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-pretty text-stone-600">
                    {step.description}
                  </p>
                  {index < HOW_IT_WORKS_STEPS.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-1/2 -right-6 hidden h-px w-12 bg-gradient-to-r from-rose-300/60 to-transparent lg:block"
                    />
                  ) : null}
                </div>
              </motion.li>
            )
          })}
        </motion.ol>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            render={<Link href="/browse-services" />}
            className="h-12 rounded-full bg-[#B76E79] px-8 text-base font-medium text-white shadow-md shadow-rose-900/10 transition-all hover:bg-[#a25c67] hover:shadow-lg"
          >
            Start Planning Today
          </Button>
        </div>
      </div>
    </section>
  )
}