"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Search, Star } from "lucide-react"

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const stats = [
  { value: "1,200+", label: "Wedding services" },
  { value: "350+", label: "Verified vendors" },
  { value: "4.9", label: "Couple rating", star: true },
]

export function Banner() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-900 text-white">
      {/* Fixed Parallax Background Image */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[url('https://www.weddingchicks.com/wp-content/uploads/2026/01/kathy-arno-152-1.jpg')] bg-cover bg-fixed bg-center bg-no-repeat"
      />

      {/* Dark blue-teal overlay, deeper on the left where the text sits */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#0b2a3a]/55" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1f2c]/90 via-[#0b1f2c]/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b1f2c]/70 via-transparent to-[#0b1f2c]/30"
      />

      <div className="relative mx-auto flex min-h-[min(92svh,780px)] max-w-7xl flex-col justify-center gap-12 px-4 py-24 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-16">
        {/* Text block */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex max-w-2xl flex-col items-start text-left"
        >
          {/* Rose accent rule */}
          <motion.span
            variants={item}
            aria-hidden="true"
            className="mb-7 h-px w-16 bg-gradient-to-r from-[#E8A0AB] to-transparent"
          />

          <motion.h1
            variants={item}
            className="font-heading text-5xl leading-[1.04] font-semibold tracking-tight text-balance text-white sm:text-6xl lg:text-7xl"
          >
            We are eager to{" "}
            <span className="bg-gradient-to-r from-[#F0B4BC] via-rose-300 to-[#EBC0A8] bg-clip-text font-medium text-transparent italic">
              plan your day
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-7 max-w-xl text-base leading-relaxed text-pretty text-stone-200 sm:text-lg"
          >
            Discover sunlit venues, fine-art photographers, floral designers,
            and bespoke caterers. Compare trusted vendors and plan your timeless
            celebration with ease.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-10 flex w-full flex-col items-stretch gap-3.5 sm:w-auto sm:flex-row sm:items-center"
          >
            <Link
              href="/browse-services"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#B76E79] px-8 text-base font-medium text-[#fffdf8] shadow-lg shadow-rose-950/30 transition-all hover:bg-[#a25c67] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore Wedding Services
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/browse-services?category=Wedding%20Venues"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-rose-200/90 bg-white/90 px-8 text-base font-medium text-stone-800 shadow-xs backdrop-blur-md transition-all hover:border-rose-300 hover:bg-rose-50/90 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Search className="size-4 text-[#B76E79]" />
              Find a Venue
            </Link>
          </motion.div>
        </motion.div>

        {/* Frosted glass stats panel */}
        <motion.dl
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="grid w-full max-w-sm grid-cols-3 divide-x divide-white/20 rounded-3xl border border-white/25 bg-white/10 px-2 py-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:w-64 lg:max-w-none lg:grid-cols-1 lg:divide-x-0 lg:divide-y lg:px-8 lg:py-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="px-2 text-center lg:px-0 lg:py-5 lg:text-left">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-heading text-2xl font-semibold text-white sm:text-3xl">
                {stat.value}
                {stat.star && (
                  <Star className="mb-1 ml-1 inline size-4 fill-amber-300 text-amber-300" />
                )}
              </dd>
              <dd className="mt-1 text-xs font-medium text-stone-300 sm:text-sm">
                {stat.label}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}