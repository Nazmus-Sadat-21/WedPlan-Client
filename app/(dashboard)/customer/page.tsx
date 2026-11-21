"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarHeart,
  CalendarX2,
  Clock,
  MapPin,
  RotateCcw,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewHeader } from "@/components/dashboard/OverviewHeader"
import { PageSkeleton } from "@/components/dashboard/PageSkeleton"
import { StatCard } from "@/components/dashboard/StatCard"
import {
  CategoryBars,
  ChartCard,
  EmptyChart,
  STATUS_META,
  StatusDonut,
  TrendChart,
  bookingStatusOf,
  summarizeBookings,
} from "@/components/dashboard/overview-charts"
import { useSession } from "@/lib/auth-client"
import { authFetch } from "@/lib/auth-fetch"
import { API_ENDPOINTS } from "@/lib/constants"
import type { Booking } from "@/lib/types"
import { cn } from "@/lib/utils"

/** A plain YYYY-MM-DD date should land on the same calendar day everywhere. */
function parseEventDate(value: string | undefined | null): Date | null {
  if (!value) return null
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Customer overview: live totals and charts built from the customer's booking
 * requests, plus a shortcut into the My Bookings page.
 */
export default function CustomerOverviewPage() {
  const { data, isPending } = useSession()
  const userId = data?.user?.id

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!userId) return

    const controller = new AbortController()
    let active = true

    async function loadBookings() {
      setLoading(true)
      setError(null)

      try {
        const response = await authFetch(API_ENDPOINTS.customerBookings(userId!), {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        })
        const body = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(
            body?.message ?? "Could not load your booking summary."
          )
        }

        if (!active) return
        const list: Booking[] = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : []
        setBookings(list)
      } catch (err) {
        if (!active || controller.signal.aborted) return
        setError(
          err instanceof Error
            ? err.message
            : "Could not load your booking summary."
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    loadBookings()

    return () => {
      active = false
      controller.abort()
    }
  }, [userId, reloadKey])

  const summary = useMemo(() => summarizeBookings(bookings), [bookings])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const booking of bookings) {
      const category = booking.service?.category || "Other"
      counts.set(category, (counts.get(category) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [bookings])

  // Next events still ahead of today (pending or accepted), soonest first
  const upcoming = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return bookings
      .map((booking) => ({
        booking,
        date: parseEventDate(booking.eventDate),
        status: bookingStatusOf(booking),
      }))
      .filter(
        (item): item is { booking: Booking; date: Date; status: "pending" | "accepted" } =>
          item.date !== null &&
          item.date >= today &&
          (item.status === "pending" || item.status === "accepted")
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4)
  }, [bookings])

  if (isPending) return <PageSkeleton />

  const dash = "—"
  const status = summary.status

  return (
    <>
      <OverviewHeader subtitle="Track your booking requests and wedding plans." />

      {error ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <span className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((key) => key + 1)}
            className="w-fit gap-1.5 rounded-full border-rose-200 bg-white text-xs text-rose-700 hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:text-rose-300"
          >
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={loading ? dash : summary.total}
          icon={CalendarHeart}
        />
        <StatCard
          label="Pending"
          value={loading ? dash : status.pending}
          icon={Clock}
        />
        <StatCard
          label="Accepted"
          value={loading ? dash : status.accepted}
          icon={CalendarCheck}
        />
        <StatCard
          label="Rejected"
          value={loading ? dash : status.rejected}
          icon={CalendarX2}
        />
      </div>

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
            title="Your request activity"
            description="Requests you sent vs requests vendors accepted, last 6 months."
            className="lg:col-span-8"
            delay={0.05}
            action={
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#B76E79]" />
                  Sent
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  Accepted
                </span>
              </div>
            }
          >
            {summary.total === 0 ? (
              <EmptyChart message="No booking requests yet. Browse services and send your first request to see your activity here." />
            ) : (
              <TrendChart data={summary.monthly} />
            )}
          </ChartCard>

          {/* Status donut */}
          <ChartCard
            title="Request outcomes"
            description="How vendors have replied so far."
            className="lg:col-span-4"
            delay={0.1}
          >
            <StatusDonut status={status} total={summary.total} />
          </ChartCard>

          {/* Upcoming events */}
          <ChartCard
            title="Upcoming events"
            description="Your next pending and accepted dates."
            className="lg:col-span-7"
            delay={0.15}
            action={
              <Link
                href="/customer/my-bookings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#9F5863] hover:underline dark:text-champagne-400"
              >
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <EmptyChart message="No upcoming event dates. Accepted and pending requests with a future date will appear here." />
            ) : (
              <ul className="space-y-3">
                {upcoming.map(({ booking, date, status: itemStatus }, index) => {
                  const vendor =
                    booking.vendor?.businessName ||
                    booking.vendor?.name ||
                    "WedPlan vendor"
                  return (
                    <motion.li
                      key={booking._id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, delay: 0.08 * index }}
                      className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-[#FDFBF7] p-3 transition-shadow hover:shadow-md hover:shadow-rose-950/5 dark:border-input dark:bg-input/15"
                    >
                      {/* Date tile */}
                      <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#B76E79] to-[#C58970] text-white shadow-md shadow-rose-900/15">
                        <span className="text-[10px] font-semibold tracking-wider uppercase">
                          {new Intl.DateTimeFormat("en-US", { month: "short" }).format(date)}
                        </span>
                        <span className="font-heading text-xl leading-none font-bold">
                          {date.getDate()}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-sm font-semibold text-stone-900 sm:text-base dark:text-foreground">
                          {booking.service?.serviceName ?? "Service no longer listed"}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500 dark:text-muted-foreground">
                          <span className="truncate">{vendor}</span>
                          {booking.eventLocation ? (
                            <span className="inline-flex items-center gap-1 truncate">
                              <MapPin className="size-3 shrink-0 text-[#B76E79]" />
                              {booking.eventLocation}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          itemStatus === "accepted"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                        )}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_META[itemStatus].color }}
                        />
                        {STATUS_META[itemStatus].label}
                      </span>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </ChartCard>

          {/* Categories */}
          <ChartCard
            title="Requests by category"
            description="What you have been looking for."
            className="lg:col-span-5"
            delay={0.2}
          >
            {categories.length === 0 ? (
              <EmptyChart message="Send a request to see which categories you explore most." />
            ) : (
              <CategoryBars categories={categories} />
            )}
          </ChartCard>
        </div>
      )}

      {/* Shortcut card */}
      <div className="relative mt-6 overflow-hidden rounded-3xl border border-rose-200/60 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] p-5 text-white shadow-xl shadow-rose-950/15 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-rose-300/25 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-rose-200/90 uppercase">
              <CalendarDays className="size-3.5" />
              Your wedding plans
            </p>
            <p className="mt-1.5 font-heading text-xl font-semibold sm:text-2xl">
              Every request, in one calm place
            </p>
            <p className="mt-1 max-w-xl text-sm text-rose-100/80">
              Review vendor replies, open booking details or cancel a pending
              request before the vendor responds.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={<Link href="/customer/my-bookings" />}
              className="gap-1.5 rounded-full bg-[#B76E79] text-white shadow-md shadow-rose-950/30 hover:bg-[#a25c67]"
            >
              My Bookings
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              render={<Link href="/browse-services" />}
              className="gap-1.5 rounded-full border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
            >
              <Sparkles className="size-4" />
              Browse services
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}