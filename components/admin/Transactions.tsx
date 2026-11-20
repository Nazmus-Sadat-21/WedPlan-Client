"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Crown,
  Eye,
  Mail,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
  X,
  XCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { API_ENDPOINTS } from "@/lib/constants"
import { formatDate, getUserInitials } from "@/lib/format"
import type { Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

type PaymentStatus = "paid" | "pending" | "failed"
type StatusFilter = "all" | PaymentStatus

const STATUS_FILTERS = [
  { id: "all", label: "All payments" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
] as const

const controlClassName =
  "h-10 border-rose-200/90 bg-white/85 text-sm focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:border-input dark:bg-input/20 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

function normalizeStatus(status: unknown): PaymentStatus {
  const raw = String(status ?? "").toLowerCase()
  if (raw === "paid" || raw === "succeeded" || raw === "success") return "paid"
  if (raw === "failed" || raw === "unpaid" || raw === "canceled") return "failed"
  return "pending"
}

function statusLabel(status: PaymentStatus): string {
  if (status === "paid") return "Paid"
  if (status === "failed") return "Failed"
  return "Pending"
}

function statusClasses(status: PaymentStatus): string {
  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
  }
  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
  }
  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        statusClasses(status)
      )}
    >
      {status === "paid" ? (
        <BadgeCheck className="size-3.5" />
      ) : status === "failed" ? (
        <XCircle className="size-3.5" />
      ) : (
        <Clock className="size-3.5" />
      )}
      {statusLabel(status)}
    </span>
  )
}

function formatAmount(amount: number, currency: string): string {
  const code = String(currency || "usd").toUpperCase()
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

function vendorInfo(transaction: Transaction) {
  const vendor = transaction.vendor
  return {
    name: vendor?.businessName || vendor?.name || "Unknown vendor",
    person: vendor?.name ?? null,
    business: vendor?.businessName ?? null,
    email: vendor?.email || transaction.vendorEmail || "Email unavailable",
    image: vendor?.image ?? null,
  }
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: number | string
  hint: string
  icon: typeof Wallet
  tone: "plum" | "emerald" | "amber" | "rose" | "sky"
}) {
  const tones: Record<typeof tone, string> = {
    plum: "from-[#B76E79]/15 via-white to-white text-[#9F5863]",
    emerald: "from-emerald-100/70 via-white to-white text-emerald-700",
    amber: "from-amber-100/70 via-white to-white text-amber-700",
    rose: "from-rose-100/80 via-white to-white text-rose-700",
    sky: "from-sky-100/70 via-white to-white text-sky-700",
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-200/70 bg-gradient-to-br p-4 shadow-2xs transition-shadow hover:shadow-md hover:shadow-rose-950/5 sm:p-5 dark:border-input dark:from-input/20 dark:via-card dark:to-card",
        tones[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase dark:text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-stone-900 sm:text-3xl dark:text-foreground">
            {value}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/80 shadow-2xs dark:border-input dark:bg-input/40">
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-2 text-[11px] text-stone-500 dark:text-muted-foreground">
        {hint}
      </p>
    </div>
  )
}

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewId, setViewId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function loadTransactions() {
      try {
        const response = await fetch(API_ENDPOINTS.transactions, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        })

        const body = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(
            body?.message ?? "Could not load platform transactions."
          )
        }

        if (!active) return
        const list: Transaction[] = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : []
        setTransactions(list)
      } catch (err) {
        if (!active || controller.signal.aborted) return
        const message =
          err instanceof Error
            ? err.message
            : "Could not load platform transactions."
        setError(message)
        toast.error(message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadTransactions()

    return () => {
      active = false
      controller.abort()
    }
  }, [reloadKey])

  const stats = useMemo(() => {
    let paid = 0
    let pending = 0
    let failed = 0
    let revenue = 0
    const vendors = new Set<string>()

    for (const transaction of transactions) {
      const status = normalizeStatus(transaction.status)
      if (status === "paid") {
        paid++
        revenue += Number(transaction.amount) || 0
      } else if (status === "failed") {
        failed++
      } else {
        pending++
      }
      if (transaction.vendorId) vendors.add(String(transaction.vendorId))
    }

    return {
      total: transactions.length,
      paid,
      pending,
      failed,
      revenue,
      vendors: vendors.size,
    }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const status = normalizeStatus(transaction.status)
      if (statusFilter !== "all" && status !== statusFilter) return false
      if (!query) return true

      const vendor = vendorInfo(transaction)
      const haystack = [
        vendor.name,
        vendor.person,
        vendor.email,
        transaction.plan,
        transaction.stripeSessionId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [transactions, searchQuery, statusFilter])

  const viewTransaction =
    transactions.find((transaction) => transaction._id === viewId) ?? null

  function reload() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  function resetFilters() {
    setSearchQuery("")
    setStatusFilter("all")
  }

  const filterCounts: Record<StatusFilter, number> = {
    all: stats.total,
    paid: stats.paid,
    pending: stats.pending,
    failed: stats.failed,
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Editorial header */}
      <header className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] px-6 py-7 text-white shadow-xl shadow-rose-950/15 sm:px-8 sm:py-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-rose-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-amber-200/15 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-rose-200/90 uppercase">
              <Sparkles className="size-3.5" />
              Admin console
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Platform <span className="text-rose-200 italic">transactions</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-100/80">
              Every Premium payment recorded by a verified Stripe webhook. This
              ledger is read-only — payment records cannot be edited or marked
              successful by hand.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
              <ReceiptText className="size-3.5 text-rose-200" />
              {loading ? "—" : stats.total} transactions
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-md">
              <Wallet className="size-3.5" />
              {loading
                ? "—"
                : formatAmount(stats.revenue, "usd")}{" "}
              collected
            </span>
          </div>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
        <Metric
          label="All transactions"
          value={loading ? "—" : stats.total}
          hint="Every recorded payment"
          icon={ReceiptText}
          tone="plum"
        />
        <Metric
          label="Total revenue"
          value={
            loading ? "—" : formatAmount(stats.revenue, "usd")
          }
          hint="Verified paid payments"
          icon={Wallet}
          tone="emerald"
        />
        <Metric
          label="Paid"
          value={loading ? "—" : stats.paid}
          hint="Confirmed by Stripe"
          icon={BadgeCheck}
          tone="sky"
        />
        <Metric
          label="Pending"
          value={loading ? "—" : stats.pending}
          hint="Awaiting confirmation"
          icon={Clock}
          tone="amber"
        />
        <Metric
          label="Vendors"
          value={loading ? "—" : stats.vendors}
          hint="Premium subscribers"
          icon={Store}
          tone="rose"
        />
      </div>

      {/* Read-only notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <ShieldCheck className="mt-0.5 size-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-xs leading-relaxed text-emerald-900/80 dark:text-emerald-200/80">
          Payment records are created only by verified Stripe webhook events.
          Admins can review them here but cannot modify an unsuccessful payment
          to mark it successful.
        </p>
      </div>

      {/* Filters + search */}
      <div className="space-y-3 rounded-2xl border border-rose-200/75 bg-white/90 p-4 shadow-2xs dark:border-input dark:bg-card/90">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((tab) => {
            const active = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-[#B76E79] text-[#fffdf8] shadow-xs"
                    : "bg-[#FDFBF7] text-stone-600 hover:bg-rose-50 hover:text-stone-900 dark:bg-input/30 dark:text-muted-foreground dark:hover:bg-input/60 dark:hover:text-foreground"
                )}
              >
                {tab.label} ({loading ? "—" : filterCounts[tab.id]})
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by vendor, email, plan or Stripe session..."
            aria-label="Search transactions"
            className={cn(controlClassName, "pr-9 pl-10")}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-20 w-full rounded-2xl bg-rose-100/60 dark:bg-input/30"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-200/80 bg-white/90 px-6 py-16 text-center shadow-2xs dark:border-input dark:bg-card/90">
          <AlertCircle className="size-10 text-rose-500" />
          <h2 className="mt-3 font-heading text-xl font-semibold text-stone-900 dark:text-foreground">
            Unable to load transactions
          </h2>
          <p className="mt-1 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            {error}
          </p>
          <Button
            onClick={reload}
            variant="outline"
            className="mt-5 gap-2 rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
          >
            <RotateCcw className="size-4" />
            Try again
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-rose-300/80 bg-white/80 px-6 py-16 text-center dark:border-input dark:bg-card/50">
          <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
            <ReceiptText className="size-6" />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
            No transactions yet
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            Premium subscription payments will appear here as soon as Stripe
            confirms them through the verified webhook.
          </p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-rose-300/80 bg-white/80 px-6 py-16 text-center dark:border-input dark:bg-card/50">
          <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
            <Search className="size-6" />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
            No payments match your filters
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            Try another status tab or search term to find the transaction you
            are looking for.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="mt-5 rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white/90 shadow-xs dark:border-input dark:bg-card/90">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rose-100 bg-rose-50/50 text-xs font-semibold tracking-wider text-stone-500 uppercase dark:border-input dark:bg-input/20 dark:text-muted-foreground">
                <tr>
                  <th className="py-3.5 pr-4 pl-5">Vendor</th>
                  <th className="px-4 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Payment status</th>
                  <th className="px-4 py-3.5">Transaction date</th>
                  <th className="py-3.5 pr-5 pl-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/70 dark:divide-input">
                {filteredTransactions.map((transaction) => {
                  const vendor = vendorInfo(transaction)
                  const status = normalizeStatus(transaction.status)

                  return (
                    <tr
                      key={transaction._id}
                      className="transition-colors hover:bg-rose-50/30 dark:hover:bg-input/10"
                    >
                      <td className="py-4 pr-4 pl-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 ring-2 ring-rose-100 dark:ring-input">
                            {vendor.image ? (
                              <AvatarImage
                                src={vendor.image}
                                alt={vendor.name}
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-[#B76E79] to-[#C58970] text-[11px] font-semibold text-white">
                              {getUserInitials(vendor.person ?? vendor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 max-w-[15rem]">
                            <p className="truncate font-heading font-semibold text-stone-900 dark:text-foreground">
                              {vendor.name}
                            </p>
                            <p className="flex items-center gap-1 truncate text-xs text-stone-500 dark:text-muted-foreground">
                              <Mail className="size-3 shrink-0 text-[#B76E79]" />
                              {vendor.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 capitalize dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                        >
                          <Crown className="size-3" />
                          {transaction.plan || "Premium"}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-heading font-bold text-stone-900 dark:text-foreground">
                          {formatAmount(
                            Number(transaction.amount) || 0,
                            transaction.currency
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={status} />
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-muted-foreground">
                          <CalendarDays className="size-3.5 text-[#B76E79]" />
                          {formatDate(transaction.createdAt)}
                        </span>
                      </td>

                      <td className="py-4 pr-5 pl-4 text-right whitespace-nowrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setViewId(transaction._id)}
                          className="h-8 gap-1 rounded-lg border-rose-200/80 bg-white text-xs text-stone-700 hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:text-foreground dark:hover:bg-input/50"
                        >
                          <Eye className="size-3.5 text-[#B76E79]" />
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction details */}
      <Dialog
        open={Boolean(viewTransaction)}
        onOpenChange={(open) => !open && setViewId(null)}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl border-rose-200/80 bg-[#FDFBF7] sm:max-w-lg dark:border-input dark:bg-card">
          {viewTransaction ? (
            <>
              <DialogHeader>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E9C99B] to-[#C58970] text-[#3a2328]">
                  <ReceiptText className="size-5" />
                </span>
                <DialogTitle className="font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
                  Transaction details
                </DialogTitle>
                <DialogDescription className="text-sm text-stone-600 dark:text-muted-foreground">
                  A read-only record created by the verified Stripe webhook.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-3 rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
                <Avatar className="size-12 ring-2 ring-rose-100 dark:ring-input">
                  {viewTransaction.vendor?.image ? (
                    <AvatarImage
                      src={viewTransaction.vendor.image}
                      alt={vendorInfo(viewTransaction).name}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-[#B76E79] to-[#C58970] text-sm font-semibold text-white">
                    {getUserInitials(
                      vendorInfo(viewTransaction).person ??
                        vendorInfo(viewTransaction).name
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-semibold text-stone-900 dark:text-foreground">
                    {vendorInfo(viewTransaction).name}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-stone-500 dark:text-muted-foreground">
                    <Mail className="size-3.5 shrink-0 text-[#B76E79]" />
                    {vendorInfo(viewTransaction).email}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-rose-100 rounded-2xl border border-rose-200/75 bg-white px-4 dark:divide-input dark:border-input dark:bg-input/20">
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-stone-500 dark:text-muted-foreground">
                    Subscription plan
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-900 capitalize dark:text-foreground">
                    <Crown className="size-3.5 text-amber-600" />
                    {viewTransaction.plan || "Premium"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-stone-500 dark:text-muted-foreground">
                    Payment amount
                  </span>
                  <span className="font-heading text-base font-bold text-stone-900 dark:text-foreground">
                    {formatAmount(
                      Number(viewTransaction.amount) || 0,
                      viewTransaction.currency
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-stone-500 dark:text-muted-foreground">
                    Payment status
                  </span>
                  <StatusBadge
                    status={normalizeStatus(viewTransaction.status)}
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-stone-500 dark:text-muted-foreground">
                    Transaction date
                  </span>
                  <span className="text-xs font-semibold text-stone-900 dark:text-foreground">
                    {formatDate(viewTransaction.createdAt, "long")}
                  </span>
                </div>
                <div className="py-3">
                  <p className="text-xs text-stone-500 dark:text-muted-foreground">
                    Stripe session
                  </p>
                  <p className="mt-1 font-mono text-[11px] break-all text-stone-800 dark:text-foreground">
                    {viewTransaction.stripeSessionId || "—"}
                  </p>
                </div>
                <div className="py-3">
                  <p className="text-xs text-stone-500 dark:text-muted-foreground">
                    Subscription reference
                  </p>
                  <p className="mt-1 font-mono text-[11px] break-all text-stone-800 dark:text-foreground">
                    {viewTransaction.stripeSubscriptionId || "One-time payment"}
                  </p>
                </div>
              </div>

              <p className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-stone-500 dark:border-input dark:bg-input/20 dark:text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                This record cannot be edited. Only a verified Stripe event can
                create or confirm a payment.
              </p>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewId(null)}
                  className="rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
