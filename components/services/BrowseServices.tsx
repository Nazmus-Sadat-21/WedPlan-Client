"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import {
  CloudOff,
  HeartCrack,
  RotateCcw,
  SearchIcon,
  SlidersHorizontal,
} from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/Shared/EmptyState"
import { SectionHeading } from "@/components/Shared/SectionHeading"
import { ServiceCard } from "@/components/Shared/ServiceCard"
import { ServiceCardSkeletonGrid } from "@/components/Shared/ServiceCardSkeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { fetchServices, isPublicService } from "@/lib/api"
import { SERVICE_CATEGORIES } from "@/lib/constants"
import type { Service } from "@/lib/types"

type LoadState = {
  status: "loading" | "success" | "error"
  services: Service[]
  error: string | null
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

export function BrowseServices({ initialCategory }: { initialCategory?: string }) {
  const [state, setState] = useState<LoadState>({
    status: "loading",
    services: [],
    error: null,
  })
  const [attempt, setAttempt] = useState(0)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState(initialCategory ?? "all")
  const [location, setLocation] = useState("all")
  const [sort, setSort] = useState("newest")

  useEffect(() => {
    const controller = new AbortController()

    fetchServices({ signal: controller.signal })
      .then((services) => {
        setState({
          status: "success",
          services: services.filter(isPublicService),
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

  const locations = useMemo(() => {
    const unique = new Set(
      state.services.map((service) => service.location).filter(Boolean)
    )
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [state.services])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = state.services.filter((service) => {
      const matchesSearch =
        query === "" ||
        service.serviceName.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query) ||
        service.location.toLowerCase().includes(query)
      const matchesCategory = category === "all" || service.category === category
      const matchesLocation = location === "all" || service.location === location
      return matchesSearch && matchesCategory && matchesLocation
    })

    if (sort === "price-asc") {
      return result.sort((a, b) => a.price - b.price)
    }
    if (sort === "price-desc") {
      return result.sort((a, b) => b.price - a.price)
    }
    return result.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bDate - aDate
    })
  }, [state.services, search, category, location, sort])

  function retry() {
    setAttempt((value) => value + 1)
    setState({ status: "loading", services: [], error: null })
  }

  function clearFilters() {
    setSearch("")
    setCategory("all")
    setLocation("all")
    setSort("newest")
  }

  return (
    <section className="relative overflow-hidden bg-[#FDFBF7] dark:bg-background py-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 right-1/4 -z-10 h-80 w-80 rounded-full bg-rose-100/30 dark:bg-rose-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-10 -z-10 h-72 w-72 rounded-full bg-amber-100/20 dark:bg-amber-300/5 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Browse"
          title="Wedding Services"
          description="Discover venues, photographers, florists, caterers and more — all reviewed and ready for your big day."
        />

        <div className="mt-8 rounded-2xl border border-rose-200/75 dark:border-border bg-white dark:bg-card p-4 shadow-xs sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400 dark:text-muted-foreground/80" />
              <Input
                type="search"
                placeholder="Search by name, category or location"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 border-rose-200/90 dark:border-border bg-white dark:bg-card pl-9 focus-visible:border-[#B76E79] focus-visible:ring-[#B76E79]/25"
              />
            </div>

            <NativeSelect
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
              className="w-full [&_select]:h-10 [&_select]:border-rose-200/90 [&_select]:bg-white [&_select]:focus-visible:border-[#B76E79] [&_select]:focus-visible:ring-[#B76E79]/25"
            >
              <NativeSelectOption value="all">All categories</NativeSelectOption>
              {SERVICE_CATEGORIES.map((option) => (
                <NativeSelectOption key={option.name} value={option.name}>
                  {option.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>

            <NativeSelect
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              aria-label="Filter by location"
              className="w-full [&_select]:h-10 [&_select]:border-rose-200/90 [&_select]:bg-white [&_select]:focus-visible:border-[#B76E79] [&_select]:focus-visible:ring-[#B76E79]/25"
            >
              <NativeSelectOption value="all">All locations</NativeSelectOption>
              {locations.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {option}
                </NativeSelectOption>
              ))}
            </NativeSelect>

            <NativeSelect
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort services"
              className="w-full [&_select]:h-10 [&_select]:border-rose-200/90 [&_select]:bg-white [&_select]:focus-visible:border-[#B76E79] [&_select]:focus-visible:ring-[#B76E79]/25"
            >
              <NativeSelectOption value="newest">Newest first</NativeSelectOption>
              <NativeSelectOption value="price-asc">Price: low to high</NativeSelectOption>
              <NativeSelectOption value="price-desc">Price: high to low</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <div className="mt-8">
          {state.status === "loading" ? (
            <ServiceCardSkeletonGrid count={6} />
          ) : state.status === "error" ? (
            <EmptyState
              icon={CloudOff}
              title="Could not load wedding services"
              description={
                state.error ??
                "The wedding services could not be loaded right now. Please try again."
              }
              action={
                <Button
                  onClick={retry}
                  variant="outline"
                  className="gap-2 rounded-full border-rose-200 dark:border-border hover:bg-rose-50 dark:hover:bg-input/40"
                >
                  <RotateCcw className="size-4" />
                  Try again
                </Button>
              }
            />
          ) : state.services.length === 0 ? (
            <EmptyState
              icon={HeartCrack}
              title="No services available yet"
              description="Vendors are preparing their services. Please check back soon."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={SlidersHorizontal}
              title="No services match your filters"
              description="Try a different search term, category or location."
              action={
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="rounded-full border-rose-200 dark:border-border hover:bg-rose-50 dark:hover:bg-input/40"
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-stone-500 dark:text-muted-foreground">
                Showing <span className="font-semibold text-stone-700 dark:text-foreground/80">{filtered.length}</span>{" "}
                of {state.services.length} services
              </p>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filtered.map((service, index) => (
                  <motion.div key={service._id} variants={item}>
                    <ServiceCard service={service} priority={index < 3} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
