"use client"

import {
  CalendarHeart,
  CalendarCheck,
  NotebookTabs,
  Store,
  HandCoins,
} from "lucide-react"

import { OverviewHeader } from "@/components/dashboard/OverviewHeader"
import { PageSkeleton } from "@/components/dashboard/PageSkeleton"
import { StatCard } from "@/components/dashboard/StatCard"
import { useSession } from "@/lib/auth-client"

/**
 * Vendor overview: Total Services, Active Services, Pending Booking Requests,
 * Accepted Bookings, Current Subscription Plan. Values show an em dash until
 * the Express API endpoints are wired in.
 */
export default function VendorOverviewPage() {
  const { data, isPending } = useSession()
  const plan = String(data?.user?.subscriptionPlan ?? "free").toLowerCase()
  const planLabel = plan === "premium" ? "Premium" : "Free"

  if (isPending) return <PageSkeleton />

  return (
    <>
      <OverviewHeader subtitle="Manage your services, bookings and subscription." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Services" value="—" icon={NotebookTabs} />
        <StatCard label="Active Services" value="—" icon={Store} />
        <StatCard label="Pending Requests" value="—" icon={CalendarHeart} />
        <StatCard label="Accepted Bookings" value="—" icon={CalendarCheck} />
        <StatCard label="Current Plan" value={planLabel} icon={HandCoins} />
      </div>
      <p className="mt-4 text-xs text-stone-500 dark:text-muted-foreground">
        Live numbers will populate once the Express API statistics endpoint is
        connected.
      </p>
    </>
  )
}
