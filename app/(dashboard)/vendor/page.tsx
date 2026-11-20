"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import {
  CalendarCheck,
  CalendarHeart,
  Crown,
  HandCoins,
  NotebookTabs,
  Sparkles,
  Store,
} from "lucide-react"

import { OverviewHeader } from "@/components/dashboard/OverviewHeader"
import { PageSkeleton } from "@/components/dashboard/PageSkeleton"
import { StatCard } from "@/components/dashboard/StatCard"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/lib/auth-client"
import { isServiceActive } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/constants"
import {
  CategoryBars,
  ChartCard,
  EmptyChart,
  MONTHS_BACK,
  StatusDonut,
  TrendChart,
  lastMonths,
  summarizeBookings,
  type BookingSummary,
} from "@/components/dashboard/overview-charts"
import type { Booking, Service } from "@/lib/types"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Vendor bookings endpoint. Adjust this path to match your Express route.
 * If the request fails, the charts fall back to clearly labelled sample data
 * so the dashboard still renders.
 */
const SERVER_BASE = (process.env.NEXT_PUBLIC_SERVER_API ?? "").replace(
  /\/+$/,
  ""
)
const vendorBookingsEndpoint = (vendorId: string) =>
  `${SERVER_BASE}/bookings/vendor/${encodeURIComponent(vendorId)}`

/* -------------------------------------------------------------------------- */
/*  Data helpers                                                              */
/* -------------------------------------------------------------------------- */

type ServiceSummary = {
  total: number
  active: number
  approved: number
  pending: number
  rejected: number
  categories: { name: string; count: number }[]
}

function approvalOf(service: Service): "approved" | "pending" | "rejected" {
  const raw = String(service.status ?? "pending").toLowerCase()
  if (raw === "approved") return "approved"
  if (raw === "rejected") return "rejected"
  return "pending"
}

function vendorIdOf(service: Service): string | null {
  const raw: unknown = service.vendorId ?? service.vendor
  if (!raw) return null
  if (typeof raw === "string") return raw
  if (typeof raw === "object") {
    if ("_id" in raw) return String((raw as { _id: unknown })._id)
    if ("id" in raw) return String((raw as { id: unknown }).id)
  }
  return null
}

function sampleBookingSummary(): BookingSummary {
  const months = lastMonths(MONTHS_BACK)
  const requests = [3, 5, 4, 8, 7, 11]
  const accepted = [1, 3, 2, 5, 4, 7]
  return {
    monthly: months.map((month, index) => ({
      label: month.label,
      requests: requests[index],
      accepted: accepted[index],
    })),
    status: { accepted: 22, pending: 5, rejected: 7, cancelled: 4 },
    total: 38,
  }
}

function summarizeServices(services: Service[]): ServiceSummary {
  const counts = new Map<string, number>()
  let active = 0
  let approved = 0
  let pending = 0
  let rejected = 0

  for (const service of services) {
    const approval = approvalOf(service)
    if (approval === "approved") approved++
    else if (approval === "rejected") rejected++
    else pending++

    if (approval !== "rejected" && isServiceActive(service)) active++

    const category = service.category || "Other"
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }

  return {
    total: services.length,
    active,
    approved,
    pending,
    rejected,
    categories: [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  }
}

/* -------------------------------------------------------------------------- */
/*  Charts (dependency-free SVG)                                              */
/* -------------------------------------------------------------------------- */

function ApprovalPipeline({ services }: { services: ServiceSummary }) {
  const parts = [
    { key: "approved", label: "Approved & live", value: services.approved, color: "bg-emerald-500" },
    { key: "pending", label: "Pending review", value: services.pending, color: "bg-amber-400" },
    { key: "rejected", label: "Rejected", value: services.rejected, color: "bg-[#B76E79]" },
  ]

  return (
    <div>
      <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-rose-100/70 dark:bg-input/40">
        {services.total > 0
          ? parts.map((part, index) =>
              part.value > 0 ? (
                <motion.div
                  key={part.key}
                  className={cn("h-full", part.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${(part.value / services.total) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.1 * index, ease: "easeOut" }}
                />
              ) : null
            )
          : null}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {parts.map((part) => (
          <li
            key={part.key}
            className="flex items-center gap-2 rounded-xl border border-rose-100 bg-[#FDFBF7] px-3 py-2 text-xs dark:border-input dark:bg-input/15"
          >
            <span className={cn("size-2.5 shrink-0 rounded-full", part.color)} />
            <span className="text-stone-600 dark:text-muted-foreground">{part.label}</span>
            <span className="ml-auto font-semibold text-stone-900 dark:text-foreground">
              {part.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Small layout pieces                                                       */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function VendorOverviewPage() {
  const { data, isPending } = useSession()
  const userId = data?.user?.id
  const plan = String(data?.user?.subscriptionPlan ?? "free").toLowerCase()
  const isPremium = plan === "premium"
  const planLabel = isPremium ? "Premium" : "Free"

  const [services, setServices] = useState<Service[] | null>(null)
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [bookingsUnavailable, setBookingsUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const controller = new AbortController()
    let active = true

    async function load() {
      setLoading(true)

      const [servicesResult, bookingsResult] = await Promise.allSettled([
        fetch(API_ENDPOINTS.services, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        }).then(async (res) => {
          if (!res.ok) throw new Error("services")
          const json = await res.json()
          return (Array.isArray(json) ? json : (json?.data ?? [])) as Service[]
        }),
        fetch(vendorBookingsEndpoint(userId!), {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        }).then(async (res) => {
          if (!res.ok) throw new Error("bookings")
          const json = await res.json()
          return (Array.isArray(json) ? json : (json?.data ?? [])) as Booking[]
        }),
      ])

      if (!active || controller.signal.aborted) return

      if (servicesResult.status === "fulfilled") {
        setServices(
          servicesResult.value.filter(
            (item) => vendorIdOf(item) === String(userId)
          )
        )
      } else {
        setServices([])
      }

      if (bookingsResult.status === "fulfilled") {
        setBookings(bookingsResult.value)
        setBookingsUnavailable(false)
      } else {
        setBookings(null)
        setBookingsUnavailable(true)
      }

      setLoading(false)
    }

    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [userId])

  const serviceSummary = useMemo(
    () => summarizeServices(services ?? []),
    [services]
  )
  const bookingSummary = useMemo(
    () => (bookings ? summarizeBookings(bookings) : sampleBookingSummary()),
    [bookings]
  )

  if (isPending) return <PageSkeleton />

  const showSample = !loading && bookingsUnavailable
  const dash = "—"

  const acceptanceRate =
    bookingSummary.total > 0
      ? Math.round((bookingSummary.status.accepted / bookingSummary.total) * 100)
      : 0

  return (
    <>
      <OverviewHeader subtitle="Manage your services, bookings and subscription." />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Services"
          value={loading ? dash : serviceSummary.total}
          icon={NotebookTabs}
        />
        <StatCard
          label="Active Services"
          value={loading ? dash : serviceSummary.active}
          icon={Store}
        />
        <StatCard
          label="Pending Requests"
          value={loading ? dash : bookingSummary.status.pending}
          icon={CalendarHeart}
        />
        <StatCard
          label="Accepted Bookings"
          value={loading ? dash : bookingSummary.status.accepted}
          icon={CalendarCheck}
        />
        <StatCard label="Current Plan" value={planLabel} icon={HandCoins} />
      </div>

      {showSample ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <Sparkles className="size-3.5" />
          Booking charts show sample data until the vendor bookings endpoint
          responds.
        </p>
      ) : null}

      {/* Charts */}
      {loading ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          <Skeleton className="h-[26rem] rounded-3xl bg-rose-100/60 lg:col-span-8 dark:bg-input/30" />
          <Skeleton className="h-[26rem] rounded-3xl bg-rose-100/60 lg:col-span-4 dark:bg-input/30" />
          <Skeleton className="h-72 rounded-3xl bg-rose-100/60 lg:col-span-7 dark:bg-input/30" />
          <Skeleton className="h-72 rounded-3xl bg-rose-100/60 lg:col-span-5 dark:bg-input/30" />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          {/* Trend */}
          <ChartCard
            title="Booking activity"
            description="Requests received vs bookings you accepted, last 6 months."
            className="lg:col-span-8"
            delay={0.05}
            action={
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#B76E79]" />
                  Requests
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  Accepted
                </span>
              </div>
            }
          >
            {bookingSummary.total === 0 ? (
              <EmptyChart message="No booking requests yet. Activity will appear here once couples start requesting your services." />
            ) : (
              <TrendChart data={bookingSummary.monthly} />
            )}
          </ChartCard>

          {/* Status donut */}
          <ChartCard
            title="Request outcomes"
            description="How your booking requests are resolved."
            className="lg:col-span-4"
            delay={0.1}
          >
            <StatusDonut
              status={bookingSummary.status}
              total={bookingSummary.total}
            />
          </ChartCard>

          {/* Services by category */}
          <ChartCard
            title="Services by category"
            description="Where your listings are concentrated."
            className="lg:col-span-7"
            delay={0.15}
          >
            {serviceSummary.categories.length === 0 ? (
              <EmptyChart message="Add your first service to see a category breakdown." />
            ) : (
              <CategoryBars categories={serviceSummary.categories} />
            )}
          </ChartCard>

          {/* Right column: pipeline + plan */}
          <div className="space-y-5 lg:col-span-5">
            <ChartCard
              title="Listing approval"
              description="Review status across your services."
              delay={0.2}
            >
              {serviceSummary.total === 0 ? (
                <EmptyChart message="No services submitted yet." />
              ) : (
                <ApprovalPipeline services={serviceSummary} />
              )}
            </ChartCard>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-3xl border border-rose-200/60 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] p-5 text-white shadow-xl shadow-rose-950/15 sm:p-6"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-rose-300/25 blur-3xl"
              />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-rose-200/90 uppercase">
                    Current plan
                  </p>
                  <p className="mt-1 font-heading text-3xl font-semibold">
                    {planLabel}
                  </p>
                  <p className="mt-1 text-xs text-rose-100/80">
                    {bookingSummary.total > 0
                      ? `${acceptanceRate}% of your requests were accepted.`
                      : "Your acceptance rate will show here."}
                  </p>
                </div>
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                  <Crown
                    className={cn(
                      "size-7",
                      isPremium ? "text-amber-200" : "text-rose-100"
                    )}
                  />
                </span>
              </div>
            </motion.section>
          </div>
        </div>
      )}
    </>
  )
}