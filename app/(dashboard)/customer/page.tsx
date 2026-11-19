"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarHeart,
  CalendarX2,
  Clock,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { OverviewHeader } from "@/components/dashboard/OverviewHeader"
import { PageSkeleton } from "@/components/dashboard/PageSkeleton"
import { StatCard } from "@/components/dashboard/StatCard"
import { useSession } from "@/lib/auth-client"
import { API_ENDPOINTS } from "@/lib/constants"
import type { Booking } from "@/lib/types"

function bookingStatus(
  booking: Booking
): "pending" | "accepted" | "rejected" | "cancelled" {
  const raw = String(booking.status ?? "pending").toLowerCase()
  if (raw === "accepted") return "accepted"
  if (raw === "rejected") return "rejected"
  if (raw === "cancelled") return "cancelled"
  return "pending"
}

/**
 * Customer overview: live totals from the customer's booking requests, plus a
 * shortcut into the My Bookings page where each request can be reviewed.
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
        const response = await fetch(API_ENDPOINTS.customerBookings(userId!), {
          cache: "no-store",
          credentials: "include",
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

  const stats = useMemo(() => {
    const counts = { pending: 0, accepted: 0, rejected: 0, cancelled: 0 }
    for (const booking of bookings) counts[bookingStatus(booking)]++
    return { total: bookings.length, ...counts }
  }, [bookings])

  if (isPending) return <PageSkeleton />

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={loading ? "—" : stats.total}
          icon={CalendarHeart}
        />
        <StatCard
          label="Pending"
          value={loading ? "—" : stats.pending}
          icon={Clock}
        />
        <StatCard
          label="Accepted"
          value={loading ? "—" : stats.accepted}
          icon={CalendarCheck}
        />
        <StatCard
          label="Rejected"
          value={loading ? "—" : stats.rejected}
          icon={CalendarX2}
        />
      </div>

      <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-rose-200/75 bg-gradient-to-br from-white via-white to-rose-50/50 p-5 shadow-2xs sm:flex-row sm:items-center dark:border-input dark:from-input/10 dark:via-card dark:to-card">
        <div>
          <p className="font-heading text-lg font-semibold text-stone-900 dark:text-foreground">
            Every request, in one calm place
          </p>
          <p className="mt-1 text-sm text-stone-600 dark:text-muted-foreground">
            Review vendor replies, open booking details or cancel a pending
            request before the vendor responds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            render={<Link href="/customer/my-bookings" />}
            className="gap-1.5 rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
          >
            My Bookings
            <ArrowRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            render={<Link href="/browse-services" />}
            className="rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
          >
            Browse services
          </Button>
        </div>
      </div>
    </>
  )
}
