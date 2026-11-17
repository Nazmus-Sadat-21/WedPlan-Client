"use client"

import { CalendarHeart, CalendarCheck, CalendarX2 } from "lucide-react"

import { OverviewHeader } from "@/components/dashboard/OverviewHeader"
import { PageSkeleton } from "@/components/dashboard/PageSkeleton"
import { StatCard } from "@/components/dashboard/StatCard"
import { useSession } from "@/lib/auth-client"

/**
 * Customer overview: Total Booking Requests, Pending, Accepted, Rejected.
 * Values show an em dash until the Express API endpoints are wired in.
 */
export default function CustomerOverviewPage() {
  const { isPending } = useSession()

  if (isPending) return <PageSkeleton />

  return (
    <>
      <OverviewHeader subtitle="Track your booking requests and wedding plans." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Bookings" value="—" icon={CalendarHeart} />
        <StatCard label="Pending" value="—" icon={CalendarHeart} />
        <StatCard label="Accepted" value="—" icon={CalendarCheck} />
        <StatCard label="Rejected" value="—" icon={CalendarX2} />
      </div>
      <p className="mt-4 text-xs text-stone-500 dark:text-muted-foreground">
        Live numbers will populate once the Express API statistics endpoint is
        connected.
      </p>
    </>
  )
}
