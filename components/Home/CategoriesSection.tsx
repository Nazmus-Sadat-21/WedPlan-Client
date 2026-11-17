"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"

import { SERVICE_CATEGORIES } from "@/lib/constants"
import { SectionHeading } from "@/components/Shared/SectionHeading"

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function CategoriesSection() {
  return (
    <section className="relative overflow-hidden border-y border-rose-200/50 bg-[#FDFBF7] py-16 sm:py-20 lg:py-24">
      {/* Soft background glow accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-0 -z-10 h-72 w-72 -translate-y-1/2 rounded-full bg-rose-100/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 -z-10 h-80 w-80 rounded-full bg-amber-100/20 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeading
            eyebrow="Categories"
            title="Wedding Service Categories"
            description="From the first floral arrangement to the final toast — explore trusted vendors across every part of your celebration."
          />
        </motion.div>

        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:mt-12"
        >
          {SERVICE_CATEGORIES.map((category) => (
            <motion.li key={category.name} variants={item}>
              <Link
                href={`/browse-services?category=${encodeURIComponent(category.name)}`}
                className="group relative block overflow-hidden rounded-2xl border border-rose-200/75 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-950/5 focus-visible:outline-none"
              >
                <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/3]">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Luminous warm gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/25 to-transparent transition-opacity duration-300 group-hover:from-stone-900/85" />
                </div>
                
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 sm:p-5">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-balance text-white sm:text-lg">
                      {category.name}
                    </h3>
                    <p className="mt-0.5 hidden text-xs font-medium text-rose-100/80 sm:block">
                      {category.tagline}
                    </p>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-[#B76E79] group-hover:text-white group-hover:scale-105">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}