"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import {
  ArrowRight,
  CalendarHeart,
  Heart,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react"

import { BackButton } from "@/components/Shared/BackButton"
import { Logo } from "@/components/Shared/Logo"
import { ThemeToggle } from "@/components/Shared/ThemeToggle"
import { EASE_OUT } from "@/lib/motion"

const AUTH_IMAGE_URL =
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1800&q=85"

const STATS = [
  { value: "1,200+", label: "Curated services" },
  { value: "350+", label: "Trusted vendors" },
  { value: "4.9", label: "Couple rating" },
] as const

const FLOATING_CHIPS = [
  { label: "Wedding venues", icon: CalendarHeart, className: "top-[22%] right-6" },
  { label: "Photography", icon: Sparkles, className: "top-[46%] right-16" },
  { label: "Verified vendors", icon: ShieldCheck, className: "top-[68%] right-8" },
] as const

export function AuthShell({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#FDFBF7] dark:bg-background lg:grid lg:grid-cols-[minmax(0,1.03fr)_minmax(0,1fr)]">
      {/* Ambient glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.45, 0.8, 0.45], scale: [1, 1.12, 1] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 size-96 rounded-full bg-rose-100/60 blur-3xl dark:bg-rose-950/30"
        />
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.4, 0.7, 0.4], scale: [1.08, 1, 1.08] }
          }
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 bottom-0 size-96 rounded-full bg-amber-100/50 blur-3xl dark:bg-rose-900/20"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Editorial image panel (desktop)                                     */}
      {/* ------------------------------------------------------------------ */}
      <aside className="relative isolate hidden min-h-svh overflow-hidden lg:flex lg:flex-col">
        <Image
          src={AUTH_IMAGE_URL}
          alt="Bride and groom sharing a romantic moment beneath a veil"
          fill
          priority
          sizes="55vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3d0e1a]/95 via-[#7c3140]/35 to-[#3d0e1a]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2c0a13]/40 via-transparent to-transparent" />

        {/* Floating chips */}
        {FLOATING_CHIPS.map((chip, index) => (
          <motion.span
            key={chip.label}
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{
              delay: 0.9 + index * 0.15,
              duration: 0.6,
              ease: EASE_OUT,
            }}
            className={`absolute z-10 hidden items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md xl:inline-flex ${chip.className}`}
          >
            <chip.icon className="size-3.5 text-rose-200" />
            {chip.label}
          </motion.span>
        ))}

        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white xl:p-14">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="w-fit rounded-2xl bg-white/10 p-2 shadow-lg ring-1 ring-white/20 backdrop-blur-md [&_span]:text-white"
          >
            <Logo />
          </motion.div>

          <div className="max-w-xl space-y-7">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.65, ease: EASE_OUT }}
              className="flex items-center gap-3 text-rose-100/90"
            >
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-rose-200/70" />
              <Heart className="size-4 fill-rose-200/80 text-rose-200/80" />
              <span className="text-[11px] font-medium tracking-[0.26em] uppercase">
                Plan your forever
              </span>
            </motion.div>

            <motion.h2
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: EASE_OUT }}
              className="font-heading text-4xl leading-[1.08] font-semibold text-balance xl:text-5xl"
            >
              A thousand tiny details.
              <br />
              One{" "}
              <span className="bg-gradient-to-r from-rose-200 via-amber-100 to-rose-200 bg-clip-text text-transparent italic">
                unforgettable
              </span>{" "}
              day.
            </motion.h2>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.65, ease: EASE_OUT }}
              className="max-w-md text-sm leading-relaxed text-rose-100/80 sm:text-base"
            >
              Discover trusted vendors, compare packages and manage every
              booking from one calm, beautiful workspace.
            </motion.p>

            <motion.figure
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7, ease: EASE_OUT }}
              className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-1 text-amber-200">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 font-heading text-lg leading-snug font-medium text-balance">
                &ldquo;We found our venue, photographer and caterer in one
                weekend — everything else just fell into place.&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-xs text-rose-100/75">
                Aisha &amp; Rahim — married June 2025
              </figcaption>
            </motion.figure>

            <motion.dl
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.65, ease: EASE_OUT }}
              className="grid max-w-md grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-5"
            >
              {STATS.map((stat) => (
                <div key={stat.label} className="px-4 first:pl-0">
                  <dd className="font-heading text-2xl font-semibold text-white">
                    {stat.value}
                  </dd>
                  <dt className="mt-0.5 text-[11px] text-rose-100/70">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </motion.dl>
          </div>

          <p className="flex items-center gap-2 text-[11px] text-rose-100/60">
            <ShieldCheck className="size-3.5" />
            Every vendor is reviewed by the WedPlan team.
          </p>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Form panel                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative flex min-h-svh flex-col">
        {/* Compact mobile hero */}
        <div className="relative isolate overflow-hidden lg:hidden">
          <div className="relative h-44 w-full sm:h-52">
            <Image
              src={AUTH_IMAGE_URL}
              alt="Romantic wedding moment"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3d0e1a]/95 via-[#6d2a37]/55 to-[#3d0e1a]/20" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-6 pb-5 text-center text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[9px] font-semibold tracking-[0.2em] uppercase backdrop-blur-md">
                <Heart className="size-2.5 fill-rose-200 text-rose-200" />
                WedPlan
              </span>
              <p className="font-heading text-xl font-semibold text-balance sm:text-2xl">
                Plan a day that feels like{" "}
                <span className="text-rose-200 italic">you</span>.
              </p>
            </div>
          </div>
        </div>

        <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-5 sm:px-8">
          <BackButton />
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-7 sm:px-8 sm:py-9">
          <div className="w-full max-w-md">
            <div className="mb-7 flex justify-center lg:hidden">
              <div className="rounded-2xl bg-white/70 p-2 shadow-sm ring-1 ring-rose-100 backdrop-blur-sm dark:bg-card/70 dark:ring-input">
                <Logo />
              </div>
            </div>
            {children}
          </div>
        </main>

        <footer className="mx-auto flex w-full max-w-md flex-col items-center gap-2 px-5 pb-6 text-center sm:px-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-[#B76E79] dark:text-muted-foreground"
          >
            Back to WedPlan home
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="text-[10px] text-stone-400 dark:text-muted-foreground/70">
            Crafted for couples and the vendors who make it happen.
          </p>
        </footer>
      </div>
    </div>
  )
}
