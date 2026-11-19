"use client"

import { useEffect, useMemo, useState } from "react"
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
import { API_ENDPOINTS } from "@/lib/constants"
import type { AdminUser, Service } from "@/lib/types"

type Counts = {
  users: number
  vendors: number
  customers: number
  services: number
  pendingServices: number
}

/**
 * Admin overview: Total Registered Users, Total Vendors, Total Customers,
 * Total Services, Pending Services, Total Transactions. Users and services are
 * loaded live from the Express API; transactions stay an em dash until that
 * endpoint exists.
 */
export default function AdminOverviewPage() {
  const { isPending } = useSession()
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function load() {
      try {
        const [usersRes, servicesRes] = await Promise.all([
          fetch(API_ENDPOINTS.users, {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          }),
          fetch(API_ENDPOINTS.services, {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          }),
        ])

        const usersJson: unknown = usersRes.ok ? await usersRes.json() : []
        const servicesJson: unknown = servicesRes.ok
          ? await servicesRes.json()
          : []

        const users: AdminUser[] = Array.isArray(usersJson)
          ? usersJson
          : Array.isArray((usersJson as { data?: unknown })?.data)
            ? (usersJson as { data: AdminUser[] }).data
            : []

        const services: Service[] = Array.isArray(servicesJson)
          ? servicesJson
          : Array.isArray((servicesJson as { data?: unknown })?.data)
            ? (servicesJson as { data: Service[] }).data
            : []

        if (!active) return

        setCounts({
          users: users.length,
          vendors: users.filter((user) => user.role === "vendor").length,
          customers: users.filter((user) => user.role !== "vendor" && user.role !== "admin")
            .length,
          services: services.length,
          pendingServices: services.filter(
            (service) => String(service.status ?? "").toLowerCase() === "pending"
          ).length,
        })
      } catch {
        // Keep the em dashes if the API is unreachable; the manage pages
        // surface their own errors.
      }
    }

    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const stats = useMemo(
    () => ({
      users: counts?.users ?? "—",
      vendors: counts?.vendors ?? "—",
      customers: counts?.customers ?? "—",
      services: counts?.services ?? "—",
      pendingServices: counts?.pendingServices ?? "—",
    }),
    [counts]
  )

  if (isPending) return <PageSkeleton />

  return (
    <>
      <OverviewHeader subtitle="Manage users, services and platform transactions." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Registered Users" value={stats.users} icon={UsersRound} />
        <StatCard label="Total Vendors" value={stats.vendors} icon={Store} />
        <StatCard label="Total Customers" value={stats.customers} icon={UserRound} />
        <StatCard label="Total Services" value={stats.services} icon={NotebookTabs} />
        <StatCard
          label="Pending Services"
          value={stats.pendingServices}
          icon={CalendarClock}
        />
        <StatCard label="Total Transactions" value="—" icon={HandCoins} />
      </div>
      <p className="mt-4 text-xs text-stone-500 dark:text-muted-foreground">
        User and service numbers are live. Transactions will populate once the
        Express API transactions endpoint is connected.
      </p>
    </>
  )
}
