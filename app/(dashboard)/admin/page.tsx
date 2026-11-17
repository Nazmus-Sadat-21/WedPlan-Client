"use client"

import {
  CalendarClock,
  NotebookTabs,
  Store,
  UserRound,
  HandCoins,
  UsersRound,
} from "lucide-react"

import { OverviewHeader } from "@/components/dashboard/OverviewHeader"
import { PageSkeleton } from "@/components/dashboard/PageSkeleton"
import { StatCard } from "@/components/dashboard/StatCard"
import { useSession } from "@/lib/auth-client"

/**
 * Admin overview: Total Registered Users, Total Vendors, Total Customers,
 * Total Services, Pending Services, Total Transactions. Values show an em dash
 * until the Express API endpoints are wired in.
 */
export default function AdminOverviewPage() {
  const { isPending } = useSession()

  if (isPending) return <PageSkeleton />

  return (
    <>
      <OverviewHeader subtitle="Manage users, services and platform transactions." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Registered Users" value="—" icon={UsersRound} />
        <StatCard label="Total Vendors" value="—" icon={Store} />
        <StatCard label="Total Customers" value="—" icon={UserRound} />
        <StatCard label="Total Services" value="—" icon={NotebookTabs} />
        <StatCard label="Pending Services" value="—" icon={CalendarClock} />
        <StatCard label="Total Transactions" value="—" icon={HandCoins} />
      </div>
      <p className="mt-4 text-xs text-stone-500 dark:text-muted-foreground">
        Live numbers will populate once the Express API statistics endpoint is
        connected.
      </p>
    </>
  )
}
