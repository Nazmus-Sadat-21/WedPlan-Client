"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, CalendarHeart, Search, Sparkles, Star } from "lucide-react"

import { Button } from "@/components/ui/button"

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function Banner() {
  return (
    <section className="relative isolate overflow-hidden bg-[#FDFBF7]">
      {/* Fixed Parallax Background Image */}
      <div
        className="absolute inset-0 -z-20 bg-[url('https://www.weddingchicks.com/wp-content/uploads/2026/01/kathy-arno-152-1.jpg')] bg-cover bg-fixed bg-center bg-no-repeat"
        aria-hidden="true"
      />

      {/* Luminous & Clean Alabaster/Blush Light Overlay (Matches the rest of the luxury light theme) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#FFFDFB]/85 via-[#FDFBF7]/75 to-[#FDFBF7]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.5)_0%,rgba(253,242,244,0.7)_100%)]"
      />

      <div className="mx-auto flex min-h-[min(90svh,760px)] max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex max-w-3xl flex-col items-center"
        >
          {/* Editorial Eyebrow Pill */}
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200/90 bg-white/90 px-4 py-1.5 text-xs font-medium tracking-wider text-[#9F5863] uppercase shadow-xs backdrop-blur-md"
          >
            <CalendarHeart className="size-3.5 text-rose-500" />
            <span>Curated Wedding Planning</span>
            <Sparkles className="size-3 text-amber-500" />
          </motion.div>

          {/* Main Romantic Headline */}
          <motion.h1
            variants={item}
            className="mt-7 font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-balance text-stone-900 sm:text-5xl lg:text-6xl"
          >
            Every love story deserves a{" "}
            <span className="bg-gradient-to-r from-[#B76E79] via-rose-500 to-[#C58970] bg-clip-text text-transparent italic">
              picture-perfect
            </span>{" "}
            beginning
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-stone-700 sm:text-lg"
          >
            Discover sunlit venues, fine-art photographers, floral designers,
            and bespoke caterers. Compare trusted vendors and plan your timeless
            celebration with ease.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            variants={item}
            className="mt-9 flex w-full flex-col items-center justify-center gap-3.5 sm:w-auto sm:flex-row"
          >
            <Button
              size="lg"
              asChild
              className="h-12 w-full rounded-full bg-[#B76E79] px-8 text-base font-medium text-white shadow-md shadow-rose-900/10 transition-all hover:bg-[#a25c67] hover:shadow-lg sm:w-auto"
            >
              <Link
                href="/browse-services"
                className="inline-flex items-center gap-2"
              >
                Explore Wedding Services
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 w-full rounded-full border-rose-200/90 bg-white/90 px-8 text-base font-medium text-stone-800 shadow-xs backdrop-blur-md transition-all hover:border-rose-300 hover:bg-rose-50/90 hover:text-stone-950 sm:w-auto"
            >
              <Link
                href="/browse-services?category=Wedding+Venues"
                className="inline-flex items-center gap-2"
              >
                <Search className="size-4 text-[#B76E79]" />
                Find a Venue
              </Link>
            </Button>
          </motion.div>

          {/* Frosted Glass Social Proof Stats */}
          <motion.dl
            variants={item}
            className="mt-14 grid w-full max-w-2xl grid-cols-3 divide-x divide-rose-200/60 rounded-2xl border border-white/95 bg-white/85 px-4 py-5 shadow-md backdrop-blur-md sm:px-8"
          >
            {[
              { value: "1,200+", label: "Wedding Services" },
              { value: "350+", label: "Verified Vendors" },
              { value: "4.9", label: "Couple Rating", star: true },
            ].map((stat) => (
              <div key={stat.label} className="px-2 text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-heading text-2xl font-semibold text-stone-900 sm:text-3xl">
                  {stat.value}
                  {stat.star && (
                    <Star className="mb-1 ml-1 inline size-4 fill-amber-400 text-amber-400" />
                  )}
                </dd>
                <dd className="mt-1 text-xs font-medium text-stone-600 sm:text-sm">
                  {stat.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>

      {/* Seamless Bottom Transition Fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-20 bg-gradient-to-b from-transparent to-[#FDFBF7]"
      />
    </section>
  )
}