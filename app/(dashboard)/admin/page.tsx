"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  Coins,
  Crown,
  HandCoins,
  NotebookTabs,
  Receipt,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Store,
  UserRound,
  UsersRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewHeader } from "@/components/dashboard/OverviewHeader"
import { PageSkeleton } from "@/components/dashboard/PageSkeleton"
import { StatCard } from "@/components/dashboard/StatCard"
import {
  CategoryBars,
  ChartCard,
  DonutChart,
  EmptyChart,
  MONTHS_BACK,
  MonthlySeriesChart,
  StackedBar,
  TrendChart,
  lastMonths,
  type MonthPoint,
} from "@/components/dashboard/overview-charts"
import { useSession } from "@/lib/auth-client"
import { API_ENDPOINTS } from "@/lib/constants"
import type { AdminUser, Service } from "@/lib/types"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

/** Every transaction is a flat $29 subscription payment. */
const TRANSACTION_PRICE = 29

/**
 * GET /transactions on your Express server. Built from the same base URL the
 * profile page uses; change it if you keep the path in API_ENDPOINTS instead.
 */
const SERVER_BASE = (process.env.NEXT_PUBLIC_SERVER_API ?? "").replace(
  /\/+$/,
  ""
)
const TRANSACTIONS_ENDPOINT = `${SERVER_BASE}/transactions`

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})
const formatMoney = (value: number) => currency.format(value)

/* -------------------------------------------------------------------------- */
/*  Data helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Loose view of a user document (only fields this page reads). */
type UserDoc = {
  _id?: string
  id?: string
  role?: string | null
  createdAt?: string | Date | null
  isBlocked?: boolean | null
  emailVerified?: boolean | null
  subscriptionPlan?: string | null
}

type TransactionDoc = {
  _id?: string
  createdAt?: string | Date | null
}

type Loaded = { users: UserDoc[]; services: Service[] }

function toList<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[]
  const data = (json as { data?: unknown } | null)?.data
  return Array.isArray(data) ? (data as T[]) : []
}

function timestampOf(createdAt?: string | Date | null, id?: string): number | null {
  if (createdAt) {
    const parsed = new Date(createdAt).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }
  // Fallback: MongoDB ObjectId timestamp (first 8 hex characters)
  if (typeof id === "string" && id.length >= 8) {
    const seconds = Number.parseInt(id.slice(0, 8), 16)
    if (!Number.isNaN(seconds)) return seconds * 1000
  }
  return null
}

function monthlyCounts(timestamps: (number | null)[]): number[] {
  const months = lastMonths(MONTHS_BACK)
  const counts = months.map(() => 0)
  for (const time of timestamps) {
    if (time === null) continue
    const date = new Date(time)
    const index = months.findIndex(
      (month) => month.key === `${date.getFullYear()}-${date.getMonth()}`
    )
    if (index !== -1) counts[index]++
  }
  return counts
}

function roleOf(user: UserDoc): "admin" | "vendor" | "customer" {
  const role = String(user.role ?? "").toLowerCase()
  if (role === "admin") return "admin"
  if (role === "vendor") return "vendor"
  return "customer"
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Admin overview: live KPI cards and charts built from the users, services and
 * transactions endpoints. Revenue is transactions x $29.
 */
export default function AdminOverviewPage() {
  const { isPending } = useSession()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [transactions, setTransactions] = useState<TransactionDoc[] | null>(null)
  const [transactionsFailed, setTransactionsFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      const init = {
        cache: "no-store" as const,
        credentials: "include" as const,
        signal: controller.signal,
      }

      const [usersResult, servicesResult, transactionsResult] =
        await Promise.allSettled([
          fetch(API_ENDPOINTS.users, init).then((res) => {
            if (!res.ok) throw new Error("Could not load platform users.")
            return res.json()
          }),
          fetch(API_ENDPOINTS.services, init).then((res) => {
            if (!res.ok) throw new Error("Could not load platform services.")
            return res.json()
          }),
          fetch(TRANSACTIONS_ENDPOINT, init).then((res) => {
            if (!res.ok) throw new Error("Could not load transactions.")
            return res.json()
          }),
        ])

      if (!active || controller.signal.aborted) return

      if (usersResult.status === "rejected" || servicesResult.status === "rejected") {
        const reason =
          usersResult.status === "rejected"
            ? usersResult.reason
            : (servicesResult as PromiseRejectedResult).reason
        setError(
          reason instanceof Error ? reason.message : "Could not load the overview."
        )
        setLoaded(null)
      } else {
        setLoaded({
          users: toList<AdminUser>(usersResult.value) as unknown as UserDoc[],
          services: toList<Service>(servicesResult.value),
        })
      }

      if (transactionsResult.status === "fulfilled") {
        setTransactions(toList<TransactionDoc>(transactionsResult.value))
        setTransactionsFailed(false)
      } else {
        setTransactions(null)
        setTransactionsFailed(true)
      }

      setLoading(false)
    }

    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [reloadKey])

  const data = useMemo(() => {
    const users = loaded?.users ?? []
    const services = loaded?.services ?? []

    let admins = 0
    let vendors = 0
    let customers = 0
    let verified = 0
    let blocked = 0
    let premium = 0
    for (const user of users) {
      const role = roleOf(user)
      if (role === "admin") admins++
      else if (role === "vendor") vendors++
      else customers++
      if (user.emailVerified) verified++
      if (user.isBlocked) blocked++
      if (String(user.subscriptionPlan ?? "").toLowerCase() === "premium") premium++
    }

    let approved = 0
    let pending = 0
    let rejected = 0
    const categoryCounts = new Map<string, number>()
    for (const service of services) {
      const status = String(service.status ?? "pending").toLowerCase()
      if (status === "approved") approved++
      else if (status === "rejected") rejected++
      else pending++
      const category = service.category || "Other"
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1)
    }

    const userMonths = monthlyCounts(
      users.map((user) => timestampOf(user.createdAt, user._id ?? user.id))
    )
    const serviceMonths = monthlyCounts(
      services.map((service) =>
        timestampOf(
          (service as { createdAt?: string | null }).createdAt,
          service._id
        )
      )
    )
    const growth: MonthPoint[] = lastMonths(MONTHS_BACK).map((month, index) => ({
      label: month.label,
      requests: userMonths[index],
      accepted: serviceMonths[index],
    }))

    // Transactions and revenue (flat price per transaction)
    const txList = transactions ?? []
    const txMonths = monthlyCounts(
      txList.map((tx) => timestampOf(tx.createdAt, tx._id))
    )
    const labels = lastMonths(MONTHS_BACK).map((month) => month.label)
    const txSeries = labels.map((label, index) => ({
      label,
      value: txMonths[index],
    }))
    const revenueSeries = labels.map((label, index) => ({
      label,
      value: txMonths[index] * TRANSACTION_PRICE,
    }))
    const thisMonth = txMonths[txMonths.length - 1] ?? 0
    const lastMonth = txMonths[txMonths.length - 2] ?? 0
    const change =
      lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null

    return {
      totals: {
        users: users.length,
        admins,
        vendors,
        customers,
        verified,
        blocked,
        premium,
        services: services.length,
        approved,
        pending,
        rejected,
        transactions: txList.length,
        revenue: txList.length * TRANSACTION_PRICE,
        thisMonthRevenue: thisMonth * TRANSACTION_PRICE,
        thisMonthTransactions: thisMonth,
        change,
      },
      growth,
      txSeries,
      revenueSeries,
      categories: [...categoryCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    }
  }, [loaded, transactions])

  if (isPending) return <PageSkeleton />

  const t = data.totals
  const dash = "—"
  const ready = Boolean(loaded) && !loading
  const txReady = !loading && transactions !== null
  const verifiedPercent = t.users > 0 ? Math.round((t.verified / t.users) * 100) : 0
  const premiumPercent = t.users > 0 ? Math.round((t.premium / t.users) * 100) : 0

  const healthRows = [
    {
      label: "Email verified",
      value: `${t.verified} of ${t.users}`,
      percent: verifiedPercent,
      icon: BadgeCheck,
      bar: "bg-emerald-500",
    },
    {
      label: "Premium subscribers",
      value: `${t.premium} of ${t.users}`,
      percent: premiumPercent,
      icon: Crown,
      bar: "bg-amber-400",
    },
    {
      label: "Blocked accounts",
      value: `${t.blocked}`,
      percent: t.users > 0 ? Math.round((t.blocked / t.users) * 100) : 0,
      icon: ShieldAlert,
      bar: "bg-[#B76E79]",
    },
  ]

  return (
    <>
      <OverviewHeader subtitle="Manage users, services and platform transactions." />

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

      {transactionsFailed && !loading ? (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <Sparkles className="size-3.5" />
          Transactions could not be loaded, so revenue figures are unavailable.
        </p>
      ) : null}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered Users" value={ready ? t.users : dash} icon={UsersRound} />
        <StatCard label="Total Vendors" value={ready ? t.vendors : dash} icon={Store} />
        <StatCard label="Total Customers" value={ready ? t.customers : dash} icon={UserRound} />
        <StatCard label="Total Services" value={ready ? t.services : dash} icon={NotebookTabs} />
        <StatCard label="Pending Services" value={ready ? t.pending : dash} icon={CalendarClock} />
        <StatCard
          label="Total Transactions"
          value={txReady ? t.transactions : dash}
          icon={Receipt}
        />
        <StatCard
          label="Total Revenue"
          value={txReady ? formatMoney(t.revenue) : dash}
          icon={HandCoins}
        />
      </div>

      {/* Charts */}
      {loading && !loaded ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          <Skeleton className="h-[26rem] rounded-3xl bg-rose-100/60 lg:col-span-8 dark:bg-input/30" />
          <Skeleton className="h-[26rem] rounded-3xl bg-rose-100/60 lg:col-span-4 dark:bg-input/30" />
          <Skeleton className="h-[26rem] rounded-3xl bg-rose-100/60 lg:col-span-8 dark:bg-input/30" />
          <Skeleton className="h-[26rem] rounded-3xl bg-rose-100/60 lg:col-span-4 dark:bg-input/30" />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          {/* Revenue */}
          <ChartCard
            title="Total revenue"
            description={`Monthly revenue at ${formatMoney(TRANSACTION_PRICE)} per transaction, last 6 months.`}
            className="lg:col-span-8"
            delay={0.05}
          >
            {!txReady ? (
              <EmptyChart message="Revenue will appear here once transactions load." />
            ) : t.transactions === 0 ? (
              <EmptyChart message="No transactions yet. Revenue will appear here after the first payment." />
            ) : (
              <MonthlySeriesChart
                data={data.revenueSeries}
                color="#10b981"
                variant="area"
                seriesLabel="Revenue"
                formatValue={formatMoney}
              />
            )}
          </ChartCard>

          {/* Revenue summary */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-rose-200/60 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] p-5 text-white shadow-xl shadow-rose-950/15 sm:p-6 lg:col-span-4"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-10 size-52 rounded-full bg-rose-300/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 left-8 size-44 rounded-full bg-amber-200/15 blur-3xl"
            />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-rose-200/90 uppercase">
                    Lifetime revenue
                  </p>
                  <p className="mt-2 font-heading text-4xl font-semibold sm:text-5xl">
                    {txReady ? formatMoney(t.revenue) : dash}
                  </p>
                </div>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                  <Coins className="size-6 text-amber-200" />
                </span>
              </div>
              <p className="mt-2 text-xs text-rose-100/80">
                {formatMoney(TRANSACTION_PRICE)} × {txReady ? t.transactions : dash}{" "}
                transactions
              </p>
            </div>

            <dl className="relative mt-6 space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-md">
                <dt className="text-rose-100/80">This month</dt>
                <dd className="font-heading text-base font-semibold">
                  {txReady ? formatMoney(t.thisMonthRevenue) : dash}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-md">
                <dt className="text-rose-100/80">Transactions this month</dt>
                <dd className="font-heading text-base font-semibold">
                  {txReady ? t.thisMonthTransactions : dash}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-md">
                <dt className="text-rose-100/80">vs last month</dt>
                <dd
                  className={cn(
                    "inline-flex items-center gap-1 font-semibold",
                    t.change === null
                      ? "text-rose-100/80"
                      : t.change >= 0
                        ? "text-emerald-300"
                        : "text-rose-200"
                  )}
                >
                  {t.change === null ? (
                    "—"
                  ) : (
                    <>
                      {t.change >= 0 ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                      {Math.abs(t.change)}%
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </motion.section>

          {/* Transactions */}
          <ChartCard
            title="Total transactions"
            description="Number of payments received each month, last 6 months."
            className="lg:col-span-8"
            delay={0.15}
          >
            {!txReady ? (
              <EmptyChart message="Transactions will appear here once they load." />
            ) : t.transactions === 0 ? (
              <EmptyChart message="No transactions yet. Payments will appear here as vendors subscribe." />
            ) : (
              <MonthlySeriesChart
                data={data.txSeries}
                color="#B76E79"
                variant="bar"
                seriesLabel="Transactions"
              />
            )}
          </ChartCard>

          {/* User mix */}
          <ChartCard
            title="User mix"
            description="Accounts by role."
            className="lg:col-span-4"
            delay={0.2}
          >
            <DonutChart
              total={t.users}
              centerLabel="Total users"
              items={[
                { key: "customers", label: "Customers", value: t.customers, color: "#B76E79" },
                { key: "vendors", label: "Vendors", value: t.vendors, color: "#10b981" },
                { key: "admins", label: "Admins", value: t.admins, color: "#f59e0b" },
              ]}
            />
          </ChartCard>

          {/* Growth */}
          <ChartCard
            title="Platform growth"
            description="New users vs new services, last 6 months."
            className="lg:col-span-7"
            delay={0.25}
            action={
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#B76E79]" />
                  New users
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  New services
                </span>
              </div>
            }
          >
            {t.users + t.services === 0 ? (
              <EmptyChart message="No platform activity yet. Growth will appear here as users and services are added." />
            ) : (
              <TrendChart
                data={data.growth}
                primaryLabel="New users"
                secondaryLabel="New services"
              />
            )}
          </ChartCard>

          {/* Categories */}
          <ChartCard
            title="Services by category"
            description="Top categories across the marketplace."
            className="lg:col-span-5"
            delay={0.3}
          >
            {data.categories.length === 0 ? (
              <EmptyChart message="No services listed yet." />
            ) : (
              <CategoryBars categories={data.categories} />
            )}
          </ChartCard>

          {/* Approval */}
          <ChartCard
            title="Service approval"
            description="Where listings stand in review."
            className="lg:col-span-6"
            delay={0.35}
          >
            {t.services === 0 ? (
              <EmptyChart message="No services submitted yet." />
            ) : (
              <StackedBar
                total={t.services}
                parts={[
                  { key: "approved", label: "Approved", value: t.approved, color: "bg-emerald-500" },
                  { key: "pending", label: "Pending", value: t.pending, color: "bg-amber-400" },
                  { key: "rejected", label: "Rejected", value: t.rejected, color: "bg-[#B76E79]" },
                ]}
              />
            )}
          </ChartCard>

          {/* Account health */}
          <ChartCard
            title="Account health"
            description="Verification, plans and moderation."
            className="lg:col-span-6"
            delay={0.4}
          >
            <ul className="space-y-4">
              {healthRows.map((row, index) => (
                <li key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 font-medium text-stone-700 dark:text-foreground">
                      <row.icon className="size-4 text-[#B76E79]" />
                      {row.label}
                    </span>
                    <span className="font-heading text-sm font-semibold text-stone-900 dark:text-foreground">
                      {row.value}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-rose-100/70 dark:bg-input/40">
                    <motion.div
                      className={cn("h-full rounded-full", row.bar)}
                      initial={{ width: 0 }}
                      animate={{ width: `${row.percent}%` }}
                      transition={{ duration: 0.9, delay: 0.1 * index, ease: "easeOut" }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>
      )}
    </>
  )
}