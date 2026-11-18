"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, CloudOff, HeartCrack, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/Shared/EmptyState"
import { ServiceCard } from "@/components/Shared/ServiceCard"
import { ServiceCardSkeletonGrid } from "@/components/Shared/ServiceCardSkeleton"
import { SectionHeading } from "@/components/Shared/SectionHeading"
import { fetchFeaturedServices, isPublicService } from "@/lib/api"
import type { Service } from "@/lib/types"

type LoadState = {
  status: "loading" | "success" | "error"
  services: Service[]
  error: string | null
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

function getServiceTimestamp(service: Service): number {
  if (service.createdAt) {
    const parsed = new Date(service.createdAt).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }

  // Fallback to MongoDB ObjectId timestamp (first 8 hex characters)
  if (typeof service._id === "string" && service._id.length >= 8) {
    const hexSeconds = Number.parseInt(service._id.slice(0, 8), 16)
    if (!Number.isNaN(hexSeconds)) return hexSeconds * 1000
  }

  return 0
}

export function FeaturedServices() {
  const [state, setState] = useState<LoadState>({
    status: "loading",
    services: [],
    error: null,
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetchFeaturedServices({ signal: controller.signal })
      .then((services) => {
        const sortedPublicServices = services
          .filter(isPublicService)
          .sort((a, b) => getServiceTimestamp(b) - getServiceTimestamp(a))

        setState({
          status: "success",
          services: sortedPublicServices,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return
        const message =
          error instanceof Error ? error.message : "Something went wrong."
        setState({ status: "error", services: [], error: message })
        toast.error(message)
      })

    return () => controller.abort()
  }, [attempt])

  function retry() {
    setAttempt((value) => value + 1)
    setState({ status: "loading", services: [], error: null })
  }

  return (
    <section className="relative overflow-hidden bg-[#FDFBF7] py-16 sm:py-20 lg:py-24">
      {/* Soft background glow accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-1/4 -z-10 h-80 w-80 rounded-full bg-rose-100/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-10 -z-10 h-72 w-72 rounded-full bg-amber-100/20 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <SectionHeading
            eyebrow="Featured"
            title="Featured Wedding Services"
            description="Hand-picked, approved, and active services from our most loved wedding vendors."
          />
        </motion.div>

        <div className="mt-10 sm:mt-12">
          {state.status === "loading" ? (
            <ServiceCardSkeletonGrid count={6} />
          ) : state.status === "error" ? (
            <EmptyState
              icon={CloudOff}
              title="Could not load featured services"
              description={
                state.error ??
                "The wedding services could not be loaded right now. Please try again."
              }
              action={
                <Button
                  onClick={retry}
                  variant="outline"
                  className="gap-2 rounded-full border-rose-200 hover:bg-rose-50"
                >
                  <RotateCcw className="size-4" />
                  Try again
                </Button>
              }
            />
          ) : state.services.length === 0 ? (
            <EmptyState
              icon={HeartCrack}
              title="No featured services yet"
              description="Vendors are preparing their services. Please check back soon."
              action={
                <Button
                  render={<Link href="/browse-services" />}
                  variant="outline"
                  className="rounded-full border-rose-200 hover:bg-rose-50"
                >
                  Browse all services
                  <ArrowRight className="size-4" />
                </Button>
              }
            />
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {state.services.map((service, index) => (
                <motion.div key={service._id} variants={item}>
                  <ServiceCard service={service} priority={index < 3} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/browse-services" />}
            className="h-12 gap-2 rounded-full border-rose-200/90 bg-white/80 px-8 text-base font-medium text-stone-700 shadow-xs backdrop-blur-md transition-all hover:border-rose-300 hover:bg-rose-50/80 hover:text-stone-900"
          >
            View All Services
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}