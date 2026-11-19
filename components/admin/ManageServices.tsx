"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Clock,
  Eye,
  Filter,
  ImagePlus,
  LoaderCircle,
  MapPin,
  PauseCircle,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
  Trash2,
  UsersRound,
  Wallet,
  X,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { isServiceActive } from "@/lib/api"
import {
  API_ENDPOINTS,
  CATEGORY_IMAGES,
  SERVICE_CATEGORIES,
} from "@/lib/constants"
import { formatDate, formatPrice } from "@/lib/format"
import type { AdminUser, Service } from "@/lib/types"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | "pending" | "approved" | "rejected"
type AvailabilityFilter = "all" | "active" | "inactive"

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "Any availability" },
  { value: "active", label: "Live / active" },
  { value: "inactive", label: "Paused / inactive" },
] as const

const controlClassName =
  "h-10 border-rose-200/90 bg-white/85 text-sm focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:border-input dark:bg-input/20 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

const focusRingClassName =
  "outline-none focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

function getStatus(service: Service): "pending" | "approved" | "rejected" {
  const raw = String(service.status ?? "pending").toLowerCase()
  if (raw === "approved") return "approved"
  if (raw === "rejected") return "rejected"
  return "pending"
}

function resolveVendorId(service: Service): string | null {
  const raw: unknown = service.vendorId ?? service.vendor
  if (!raw) return null
  if (typeof raw === "string") return raw
  if (typeof raw === "object") {
    if ("_id" in raw) return String((raw as { _id: unknown })._id)
    if ("id" in raw) return String((raw as { id: unknown }).id)
  }
  return null
}

function statusClasses(status: "pending" | "approved" | "rejected") {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
  }
  if (status === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
  }
  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
}

function StatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        statusClasses(status)
      )}
    >
      {status === "approved" ? (
        <BadgeCheck className="size-3.5" />
      ) : status === "rejected" ? (
        <ShieldAlert className="size-3.5" />
      ) : (
        <Clock className="size-3.5" />
      )}
      {status === "approved"
        ? "Approved"
        : status === "rejected"
          ? "Rejected"
          : "Pending"}
    </span>
  )
}

function ServiceMetric({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: number | string
  hint: string
  icon: typeof Store
  tone: "plum" | "emerald" | "amber" | "rose" | "slate"
}) {
  const tones: Record<typeof tone, string> = {
    plum: "from-[#B76E79]/15 via-white to-white text-[#9F5863]",
    emerald: "from-emerald-100/70 via-white to-white text-emerald-700",
    amber: "from-amber-100/70 via-white to-white text-amber-700",
    rose: "from-rose-100/80 via-white to-white text-rose-700",
    slate: "from-slate-100/80 via-white to-white text-slate-600",
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

export function ManageServices() {
  const [services, setServices] = useState<Service[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all")

  const [viewServiceId, setViewServiceId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function load() {
      try {
        const servicesRes = await fetch(API_ENDPOINTS.services, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        })

        if (!servicesRes.ok) {
          const body = await servicesRes.json().catch(() => null)
          throw new Error(body?.message ?? "Could not load submitted services.")
        }

        const servicesJson = await servicesRes.json()
        const serviceList: Service[] = Array.isArray(servicesJson)
          ? servicesJson
          : Array.isArray(servicesJson?.data)
            ? servicesJson.data
            : []

        // Vendor names are a nice-to-have; never let this block the table.
        let userList: AdminUser[] = []
        try {
          const usersRes = await fetch(API_ENDPOINTS.users, {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          })
          if (usersRes.ok) {
            const usersJson = await usersRes.json()
            userList = Array.isArray(usersJson)
              ? usersJson
              : Array.isArray(usersJson?.data)
                ? usersJson.data
                : []
          }
        } catch {
          userList = []
        }

        if (!active) return
        setServices(serviceList)
        setUsers(userList)
        setError(null)
      } catch (err) {
        if (!active || controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : "Failed to load services."
        setError(message)
        toast.error(message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [reloadKey])

  const usersById = useMemo(() => {
    const map = new Map<string, AdminUser>()
    for (const user of users) map.set(user._id, user)
    return map
  }, [users])

  const stats = useMemo(() => {
    let pending = 0
    let approved = 0
    let rejected = 0
    let paused = 0

    for (const service of services) {
      const status = getStatus(service)
      if (status === "approved") approved++
      else if (status === "rejected") rejected++
      else pending++
      if (!isServiceActive(service)) paused++
    }

    return { total: services.length, pending, approved, rejected, paused }
  }, [services])

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return services.filter((service) => {
      const status = getStatus(service)
      if (statusFilter !== "all" && status !== statusFilter) return false
      if (categoryFilter !== "all" && service.category !== categoryFilter) {
        return false
      }

      const active = isServiceActive(service)
      if (availabilityFilter === "active" && !active) return false
      if (availabilityFilter === "inactive" && active) return false

      if (query) {
        const vendorId = resolveVendorId(service)
        const vendor = vendorId ? usersById.get(vendorId) : undefined
        const haystack = [
          service.serviceName,
          service.category,
          service.location,
          vendor?.name,
          vendor?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [
    services,
    statusFilter,
    categoryFilter,
    availabilityFilter,
    searchQuery,
    usersById,
  ])

  const viewService =
    services.find((service) => service._id === viewServiceId) ?? null

  function reload() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  async function updateStatus(
    service: Service,
    status: "pending" | "approved" | "rejected"
  ) {
    if (getStatus(service) === status) return

    setUpdatingId(service._id)
    try {
      const res = await fetch(API_ENDPOINTS.serviceStatus(service._id), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(body?.message ?? "Could not update the service status.")
      }

      const updated = body?.data ?? body
      setServices((prev) =>
        prev.map((item) =>
          item._id === service._id
            ? {
                ...item,
                status,
                ...(updated && typeof updated === "object" ? updated : {}),
              }
            : item
        )
      )

      toast.success(
        status === "approved"
          ? `"${service.serviceName}" is approved and live on Browse Services.`
          : status === "rejected"
            ? `"${service.serviceName}" has been rejected and hidden publicly.`
            : `"${service.serviceName}" is back in the review queue.`
      )
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update service status."
      )
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const res = await fetch(
        API_ENDPOINTS.adminServiceById(deleteTarget._id),
        {
          method: "DELETE",
          credentials: "include",
        }
      )

      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(body?.message ?? "Could not delete this service.")
      }

      setServices((prev) =>
        prev.filter((item) => item._id !== deleteTarget._id)
      )
      toast.success(`"${deleteTarget.serviceName}" was permanently deleted.`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete service."
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
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
              Moderate{" "}
              <span className="text-rose-200 italic">submitted services</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-100/80">
              Review vendor submissions, approve or reject listings and keep the
              public catalogue trustworthy. Only approved and active services
              appear on Browse Services.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
              <Store className="size-3.5 text-rose-200" />
              {loading ? "—" : stats.total} submissions
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3.5 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-md">
              <Clock className="size-3.5" />
              {loading ? "—" : stats.pending} pending
            </span>
          </div>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-5">
        <ServiceMetric
          label="All services"
          value={loading ? "—" : stats.total}
          hint="Every vendor submission"
          icon={Store}
          tone="plum"
        />
        <ServiceMetric
          label="Approved"
          value={loading ? "—" : stats.approved}
          hint="Visible when also active"
          icon={BadgeCheck}
          tone="emerald"
        />
        <ServiceMetric
          label="Pending"
          value={loading ? "—" : stats.pending}
          hint="Waiting for review"
          icon={Clock}
          tone="amber"
        />
        <ServiceMetric
          label="Rejected"
          value={loading ? "—" : stats.rejected}
          hint="Hidden from the public"
          icon={ShieldAlert}
          tone="rose"
        />
        <ServiceMetric
          label="Paused"
          value={loading ? "—" : stats.paused}
          hint="Inactive by the vendor"
          icon={PauseCircle}
          tone="slate"
        />
      </div>

      {/* Toolbar + status tabs */}
      <div className="space-y-3 rounded-2xl border border-rose-200/75 bg-white/90 p-4 shadow-2xs dark:border-input dark:bg-card/90">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: `All (${stats.total})` },
              { id: "pending", label: `Pending (${stats.pending})` },
              { id: "approved", label: `Approved (${stats.approved})` },
              { id: "rejected", label: `Rejected (${stats.rejected})` },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-[#B76E79] text-[#fffdf8] shadow-xs"
                    : "bg-[#FDFBF7] text-stone-600 hover:bg-rose-50 hover:text-stone-900 dark:bg-input/30 dark:text-muted-foreground dark:hover:bg-input/60 dark:hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search service, vendor, category or location..."
              aria-label="Search services"
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs font-medium text-stone-500 sm:flex dark:text-muted-foreground">
              <Filter className="size-3.5" />
              Filter
            </span>

            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(String(value))}
            >
              <SelectTrigger
                aria-label="Filter services by category"
                className={cn(
                  controlClassName,
                  "w-full justify-between sm:w-[13rem]"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {SERVICE_CATEGORIES.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={availabilityFilter}
              items={AVAILABILITY_OPTIONS}
              onValueChange={(value) =>
                setAvailabilityFilter(String(value) as AvailabilityFilter)
              }
            >
              <SelectTrigger
                aria-label="Filter services by availability"
                className={cn(
                  controlClassName,
                  "w-full justify-between sm:w-[12rem]"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-[5rem] w-full rounded-2xl bg-rose-100/60 dark:bg-input/30"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-200/80 bg-white/90 px-6 py-16 text-center shadow-2xs dark:border-input dark:bg-card/90">
          <AlertCircle className="size-10 text-rose-500" />
          <h2 className="mt-3 font-heading text-xl font-semibold text-stone-900 dark:text-foreground">
            Unable to load services
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
            Retry
          </Button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-rose-300/80 bg-white/80 px-6 py-16 text-center dark:border-input dark:bg-card/50">
          <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
            <Sparkles className="size-6" />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
            No services match your filters
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            Try a different search term, status tab or category filter.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("all")
              setCategoryFilter("all")
              setAvailabilityFilter("all")
            }}
            className="mt-5 rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white/90 shadow-xs dark:border-input dark:bg-card/90">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] text-left text-sm">
              <thead className="bg-gradient-to-r from-[#332025] via-[#543138] to-[#332025] text-[10px] font-semibold tracking-[0.16em] text-rose-100 uppercase">
                <tr>
                  <th className="py-4 pr-4 pl-6">Service</th>
                  <th className="px-4 py-4">Vendor</th>
                  <th className="px-4 py-4">Category &amp; location</th>
                  <th className="px-4 py-4">Price</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Live</th>
                  <th className="py-4 pr-6 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/70 dark:divide-input">
                {filteredServices.map((service) => {
                  const status = getStatus(service)
                  const active = isServiceActive(service)
                  const vendorId = resolveVendorId(service)
                  const vendor = vendorId ? usersById.get(vendorId) : undefined
                  const images = Array.isArray(service.images)
                    ? service.images
                    : []
                  const cover =
                    images[0] ??
                    CATEGORY_IMAGES[service.category] ??
                    CATEGORY_IMAGES["Photography & Videography"]
                  const isUpdating = updatingId === service._id

                  return (
                    <tr
                      key={service._id}
                      className={cn(
                        "group transition-colors hover:bg-rose-50/40 dark:hover:bg-input/10",
                        status === "rejected" &&
                          "bg-rose-50/25 dark:bg-rose-500/5",
                        status === "pending" &&
                          "bg-amber-50/20 dark:bg-amber-500/5"
                      )}
                    >
                      <td className="py-3.5 pr-4 pl-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-rose-100 bg-rose-50 dark:border-input dark:bg-input/30">
                            <Image
                              src={cover}
                              alt={service.serviceName}
                              fill
                              sizes="48px"
                              className={cn(
                                "object-cover",
                                status === "rejected" && "grayscale-[40%]"
                              )}
                            />
                          </div>
                          <div className="max-w-xs min-w-0">
                            <p className="truncate font-heading font-semibold text-stone-900 dark:text-foreground">
                              {service.serviceName}
                            </p>
                            <p className="truncate text-xs text-stone-500 dark:text-muted-foreground">
                              {service.description ||
                                "No description provided."}
                            </p>
                            <p className="mt-0.5 text-[11px] text-stone-400 dark:text-muted-foreground">
                              Submitted {formatDate(service.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="max-w-[12rem] truncate text-sm font-medium text-stone-800 dark:text-foreground">
                          {vendor?.name ?? "Unknown vendor"}
                        </p>
                        <p className="max-w-[12rem] truncate text-xs text-stone-500 dark:text-muted-foreground">
                          {vendor?.email ?? vendorId ?? "—"}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className="border-rose-200/80 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#9F5863] dark:border-input dark:bg-input/30 dark:text-champagne-400"
                          >
                            {service.category}
                          </Badge>
                          <p className="flex items-center gap-1 text-xs text-stone-500 dark:text-muted-foreground">
                            <MapPin className="size-3 shrink-0 text-[#B76E79]" />
                            <span className="truncate">{service.location}</span>
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-heading font-bold text-stone-900 dark:text-foreground">
                          <Wallet className="size-3.5 text-stone-400" />
                          {formatPrice(service.price)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Select
                            value={status}
                            items={STATUS_OPTIONS}
                            onValueChange={(value) =>
                              updateStatus(
                                service,
                                String(value) as
                                  "pending" | "approved" | "rejected"
                              )
                            }
                          >
                            <SelectTrigger
                              aria-label={`Change status for ${service.serviceName}`}
                              disabled={isUpdating}
                              className={cn(
                                "h-8 w-[9.5rem] justify-between rounded-full border px-2.5 text-[11px] font-semibold",
                                statusClasses(status)
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isUpdating ? (
                            <LoaderCircle className="size-3.5 animate-spin text-[#B76E79]" />
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            active
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-stone-100 text-stone-600 dark:bg-input/40 dark:text-muted-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              active ? "bg-emerald-500" : "bg-stone-400"
                            )}
                          />
                          {active ? "Active" : "Paused"}
                        </span>
                      </td>

                      <td className="py-3.5 pr-6 pl-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {status === "pending" ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(service, "approved")
                                }
                                title="Approve service"
                                className="h-8 gap-1 rounded-lg border-emerald-200 bg-white text-xs text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-input dark:bg-input/20 dark:hover:bg-emerald-500/10"
                              >
                                <Check className="size-3.5" />
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateStatus(service, "rejected")
                                }
                                title="Reject service"
                                className="h-8 gap-1 rounded-lg border-rose-200 bg-white text-xs text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-input dark:bg-input/20 dark:hover:bg-rose-500/10"
                              >
                                <XCircle className="size-3.5" />
                                Reject
                              </Button>
                            </>
                          ) : null}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setViewServiceId(service._id)}
                            className="h-8 gap-1 rounded-lg border-rose-200/80 bg-white text-xs text-stone-700 hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:text-foreground dark:hover:bg-input/50"
                          >
                            <Eye className="size-3.5 text-[#B76E79]" />
                            View
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(service)}
                            title="Delete service"
                            className="h-8 gap-1 rounded-lg border-rose-200/80 bg-white text-xs text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-input dark:bg-input/20 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-1 border-t border-rose-100 bg-rose-50/40 px-6 py-3 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between dark:border-input dark:bg-input/20 dark:text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-semibold text-stone-700 dark:text-foreground">
                {filteredServices.length}
              </span>{" "}
              of {services.length} submitted services
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-3.5 text-emerald-600" />
              Public catalogue shows approved + active services only.
            </span>
          </div>
        </div>
      )}

      {/* Service details dialog */}
      <Dialog
        open={Boolean(viewService)}
        onOpenChange={(open) => !open && setViewServiceId(null)}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl border-rose-200/80 bg-[#FDFBF7] p-0 sm:max-w-2xl dark:border-input dark:bg-card">
          {viewService ? (
            <>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-rose-100 dark:bg-input/30">
                <Image
                  src={
                    (Array.isArray(viewService.images) &&
                      viewService.images[0]) ||
                    CATEGORY_IMAGES[viewService.category] ||
                    CATEGORY_IMAGES["Photography & Videography"]
                  }
                  alt={viewService.serviceName}
                  fill
                  sizes="(min-width: 640px) 640px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/25 to-transparent" />
                <div className="absolute right-6 bottom-5 left-6 flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className="border-white/40 bg-white/90 text-xs font-semibold text-[#9F5863] dark:bg-input/80 dark:text-champagne-400">
                        {viewService.category}
                      </Badge>
                      <StatusBadge status={getStatus(viewService)} />
                    </div>
                    <DialogTitle className="font-heading text-2xl font-semibold text-white sm:text-3xl">
                      {viewService.serviceName}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-rose-100/80">
                      Submitted {formatDate(viewService.createdAt, "long")}
                    </DialogDescription>
                  </div>
                  <span className="rounded-2xl bg-white/95 px-4 py-1.5 font-heading text-xl font-bold text-stone-900 shadow-md dark:bg-card dark:text-foreground">
                    {formatPrice(viewService.price)}
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-6 sm:p-7">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-200/75 bg-white p-3.5 text-sm dark:border-input dark:bg-input/20">
                    <MapPin className="size-4 shrink-0 text-[#B76E79]" />
                    <span className="font-medium text-stone-800 dark:text-foreground">
                      {viewService.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-200/75 bg-white p-3.5 text-sm dark:border-input dark:bg-input/20">
                    <UsersRound className="size-4 shrink-0 text-[#B76E79]" />
                    <span className="truncate font-medium text-stone-800 dark:text-foreground">
                      {(() => {
                        const id = resolveVendorId(viewService)
                        return id
                          ? (usersById.get(id)?.name ?? id)
                          : "Unknown vendor"
                      })()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-rose-200/75 bg-white p-5 dark:border-input dark:bg-input/20">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-stone-400 uppercase dark:text-muted-foreground">
                    <ImagePlus className="size-3.5 text-[#B76E79]" />
                    Package description
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-stone-700 dark:text-foreground">
                    {viewService.description || "No description provided."}
                  </p>
                </div>

                {Array.isArray(viewService.images) &&
                viewService.images.length > 1 ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold tracking-wider text-stone-400 uppercase dark:text-muted-foreground">
                      Gallery ({viewService.images.length} photos)
                    </h4>
                    <div className="grid grid-cols-4 gap-2.5">
                      {viewService.images.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="relative aspect-[4/3] overflow-hidden rounded-xl border border-rose-200/70 dark:border-input"
                        >
                          <Image
                            src={url}
                            alt={`Gallery ${index + 1}`}
                            fill
                            sizes="150px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
                  <p className="mb-2 text-xs font-semibold tracking-wider text-stone-400 uppercase dark:text-muted-foreground">
                    Review decision
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      disabled={updatingId === viewService._id}
                      onClick={() => updateStatus(viewService, "approved")}
                      className={cn(
                        "gap-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700",
                        focusRingClassName
                      )}
                    >
                      <Check className="size-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      disabled={updatingId === viewService._id}
                      onClick={() => updateStatus(viewService, "rejected")}
                      variant="outline"
                      className={cn(
                        "gap-1.5 rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-input dark:hover:bg-rose-500/10",
                        focusRingClassName
                      )}
                    >
                      <XCircle className="size-4" />
                      Reject
                    </Button>
                    <Button
                      type="button"
                      disabled={updatingId === viewService._id}
                      onClick={() => updateStatus(viewService, "pending")}
                      variant="outline"
                      className={cn(
                        "gap-1.5 rounded-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-input dark:hover:bg-amber-500/10",
                        focusRingClassName
                      )}
                    >
                      <Clock className="size-4" />
                      Send to review
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-stone-500 dark:text-muted-foreground">
                    Availability is controlled by the vendor. A service appears
                    publicly only when approved and active.
                  </p>
                </div>

                <DialogFooter className="gap-2 pt-1 sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const target = viewService
                      setViewServiceId(null)
                      setDeleteTarget(target)
                    }}
                    className={cn(
                      "gap-1.5 rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-input dark:hover:bg-rose-500/10",
                      focusRingClassName
                    )}
                  >
                    <Trash2 className="size-4" />
                    Delete service
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setViewServiceId(null)}
                    className={cn(
                      "rounded-full bg-[#B76E79] text-[#fffdf8] hover:bg-[#a25c67]",
                      focusRingClassName
                    )}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="rounded-3xl border-rose-200/80 bg-[#FDFBF7] sm:max-w-md dark:border-input dark:bg-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
              Delete this service?
            </DialogTitle>
            <DialogDescription className="text-stone-600 dark:text-muted-foreground">
              <span className="font-semibold text-stone-900 dark:text-foreground">
                {deleteTarget?.serviceName}
              </span>{" "}
              will be permanently removed from the platform and the public
              catalogue. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              className={cn(
                "rounded-full border-rose-200 dark:border-input",
                focusRingClassName
              )}
            >
              Keep service
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className={cn(
                "gap-2 rounded-full bg-rose-600 text-white hover:bg-rose-700",
                focusRingClassName
              )}
            >
              {deleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManageServices
