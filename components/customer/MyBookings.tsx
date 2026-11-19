"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertCircle,
  Ban,
  BadgeCheck,
  CalendarDays,
  CalendarHeart,
  CheckCircle2,
  Clock,
  Eye,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquare,
  RotateCcw,
  Search,
  Sparkles,
  Store,
  X,
  XCircle,
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
import { useSession } from "@/lib/auth-client"
import { API_ENDPOINTS, CATEGORY_IMAGES } from "@/lib/constants"
import { formatDate, getUserInitials } from "@/lib/format"
import type { Booking, Service } from "@/lib/types"
import { cn } from "@/lib/utils"

type BookingStatusKey = "pending" | "accepted" | "rejected" | "cancelled"
type StatusFilter = "all" | BookingStatusKey

const STATUS_FILTERS = [
  { id: "all", label: "All requests" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Declined" },
  { id: "cancelled", label: "Cancelled" },
] as const

const controlClassName =
  "h-10 border-rose-200/90 bg-white/85 text-sm focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:border-input dark:bg-input/20 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

const DEFAULT_COVER = CATEGORY_IMAGES["Photography & Videography"]

function getBookingStatus(booking: Booking): BookingStatusKey {
  const raw = String(booking.status ?? "pending").toLowerCase()
  if (raw === "accepted") return "accepted"
  if (raw === "rejected") return "rejected"
  if (raw === "cancelled") return "cancelled"
  return "pending"
}

function statusLabel(status: BookingStatusKey): string {
  if (status === "accepted") return "Accepted"
  if (status === "rejected") return "Declined"
  if (status === "cancelled") return "Cancelled"
  return "Pending"
}

function statusClasses(status: BookingStatusKey): string {
  if (status === "accepted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
  }
  if (status === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
  }
  if (status === "cancelled") {
    return "border-stone-200 bg-stone-100 text-stone-600 dark:border-input dark:bg-input/40 dark:text-muted-foreground"
  }
  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
}

function statusAccent(status: BookingStatusKey): string {
  if (status === "accepted") return "border-l-emerald-400"
  if (status === "rejected") return "border-l-rose-400"
  if (status === "cancelled") return "border-l-stone-300"
  return "border-l-amber-400"
}

function StatusBadge({ status }: { status: BookingStatusKey }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        statusClasses(status)
      )}
    >
      {status === "accepted" ? (
        <CheckCircle2 className="size-3.5" />
      ) : status === "rejected" ? (
        <XCircle className="size-3.5" />
      ) : status === "cancelled" ? (
        <Ban className="size-3.5" />
      ) : (
        <Clock className="size-3.5" />
      )}
      {statusLabel(status)}
    </span>
  )
}

function eventDateLabel(value: string): string {
  if (!value) return "—"
  // A plain YYYY-MM-DD date should render on the same calendar day everywhere.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)
}

function coverImage(service: Service | null | undefined): string {
  const images = Array.isArray(service?.images) ? service.images : []
  return (
    images.find((image) => typeof image === "string" && image.trim() !== "") ??
    CATEGORY_IMAGES[service?.category ?? ""] ??
    DEFAULT_COVER
  )
}

function vendorDisplay(booking: Booking) {
  const vendor = booking.vendor
  return {
    name: vendor?.businessName || vendor?.name || "WedPlan vendor",
    contact: vendor?.email || "Contact details unavailable",
    person: vendor?.name ?? null,
    business: vendor?.businessName ?? null,
    image: vendor?.image ?? null,
  }
}

function BookingMetric({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: number | string
  hint: string
  icon: typeof CalendarHeart
  tone: "plum" | "amber" | "emerald" | "rose" | "slate"
}) {
  const tones: Record<typeof tone, string> = {
    plum: "from-[#B76E79]/15 via-white to-white text-[#9F5863]",
    amber: "from-amber-100/70 via-white to-white text-amber-700",
    emerald: "from-emerald-100/70 via-white to-white text-emerald-700",
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

function statusNote(status: BookingStatusKey): string {
  if (status === "accepted") {
    return "The vendor accepted this request. Message them directly if you need to adjust the event details."
  }
  if (status === "rejected") {
    return "The vendor declined this request. Browse other services to find an alternative for your date."
  }
  if (status === "cancelled") {
    return "You cancelled this request. It stays here for your records and can no longer be changed."
  }
  return "This request is waiting for the vendor. You can cancel it any time before they respond."
}

function rowStatusNote(status: BookingStatusKey): string {
  if (status === "accepted") return "Confirmed by the vendor."
  if (status === "rejected") return "The vendor declined this request."
  if (status === "cancelled") return "You cancelled this request."
  return "You can still cancel this request."
}

export function MyBookings() {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.id

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewBookingId, setViewBookingId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState(false)

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
            body?.message ?? "Could not load your booking requests."
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
        const message =
          err instanceof Error
            ? err.message
            : "Could not load your booking requests."
        setError(message)
        toast.error(message)
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
    const counts: Record<BookingStatusKey, number> = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      cancelled: 0,
    }
    for (const booking of bookings) counts[getBookingStatus(booking)]++
    return { total: bookings.length, ...counts }
  }, [bookings])

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return bookings.filter((booking) => {
      const status = getBookingStatus(booking)
      if (statusFilter !== "all" && status !== statusFilter) return false
      if (!query) return true

      const vendor = vendorDisplay(booking)
      const haystack = [
        booking.service?.serviceName,
        booking.service?.category,
        booking.eventLocation,
        vendor.name,
        vendor.contact,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [bookings, searchQuery, statusFilter])

  const viewBooking =
    bookings.find((booking) => booking._id === viewBookingId) ?? null

  function reload() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  function resetFilters() {
    setSearchQuery("")
    setStatusFilter("all")
  }

  async function handleCancelBooking() {
    if (!cancelTarget || !userId) return

    setCancelling(true)
    try {
      const response = await fetch(
        API_ENDPOINTS.cancelBooking(cancelTarget._id),
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ customerId: userId }),
        }
      )

      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message ?? "Could not cancel this booking.")
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === cancelTarget._id
            ? { ...booking, status: "cancelled" }
            : booking
        )
      )
      setCancelTarget(null)
      setViewBookingId(null)
      toast.success("Booking request cancelled.")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not cancel this booking."
      )
    } finally {
      setCancelling(false)
    }
  }

  const filterCounts: Record<StatusFilter, number> = {
    all: stats.total,
    pending: stats.pending,
    accepted: stats.accepted,
    rejected: stats.rejected,
    cancelled: stats.cancelled,
  }

  const viewStatus = viewBooking ? getBookingStatus(viewBooking) : null
  const viewVendor = viewBooking ? vendorDisplay(viewBooking) : null
  const viewCover = coverImage(viewBooking?.service)
  const cancelVendor = cancelTarget ? vendorDisplay(cancelTarget) : null

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
              Customer studio
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              My <span className="text-rose-200 italic">booking requests</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-100/80">
              Follow every enquiry from the first request to the vendor&apos;s
              reply. Pending requests can be cancelled in a click, without
              touching anyone else&apos;s plans.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
              <CalendarHeart className="size-3.5 text-rose-200" />
              {loading ? "—" : stats.total} requests
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/15 px-3.5 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-md">
              <Clock className="size-3.5" />
              {loading ? "—" : stats.pending} pending
            </span>
          </div>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
        <BookingMetric
          label="All requests"
          value={loading ? "—" : stats.total}
          hint="Every booking you have sent"
          icon={CalendarHeart}
          tone="plum"
        />
        <BookingMetric
          label="Pending"
          value={loading ? "—" : stats.pending}
          hint="Awaiting a vendor reply"
          icon={Clock}
          tone="amber"
        />
        <BookingMetric
          label="Accepted"
          value={loading ? "—" : stats.accepted}
          hint="Confirmed by the vendor"
          icon={BadgeCheck}
          tone="emerald"
        />
        <BookingMetric
          label="Declined"
          value={loading ? "—" : stats.rejected}
          hint="Not available for your date"
          icon={XCircle}
          tone="rose"
        />
        <BookingMetric
          label="Cancelled"
          value={loading ? "—" : stats.cancelled}
          hint="Withdrawn by you"
          icon={Ban}
          tone="slate"
        />
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
            placeholder="Search by service, vendor or event location..."
            aria-label="Search your bookings"
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
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-[11.5rem] w-full rounded-2xl bg-rose-100/60 sm:h-[9.5rem] dark:bg-input/30"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-200/80 bg-white/90 px-6 py-16 text-center shadow-2xs dark:border-input dark:bg-card/90">
          <AlertCircle className="size-10 text-rose-500" />
          <h2 className="mt-3 font-heading text-xl font-semibold text-stone-900 dark:text-foreground">
            Unable to load your bookings
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
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-rose-300/80 bg-white/80 px-6 py-16 text-center dark:border-input dark:bg-card/50">
          <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
            <CalendarHeart className="size-6" />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
            No booking requests yet
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            When you request a date from a vendor, it will appear here so you
            can track every reply in one place.
          </p>
          <Button
            render={<Link href="/browse-services" />}
            className="mt-5 gap-2 rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
          >
            <Search className="size-4" />
            Browse services
          </Button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-rose-300/80 bg-white/80 px-6 py-16 text-center dark:border-input dark:bg-card/50">
          <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
            <Search className="size-6" />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
            No bookings match your filters
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            Try another status tab or search term to find the request you are
            looking for.
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
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const status = getBookingStatus(booking)
            const vendor = vendorDisplay(booking)
            const cover = coverImage(booking.service)
            const serviceName =
              booking.service?.serviceName ?? "Service no longer listed"
            const category = booking.service?.category ?? "Unavailable"
            const canCancel = status === "pending"

            return (
              <article
                key={booking._id}
                className={cn(
                  "group overflow-hidden rounded-2xl border border-l-4 border-rose-200/75 bg-white/90 shadow-xs transition-shadow hover:shadow-md hover:shadow-rose-950/5 dark:border-input dark:bg-card/90",
                  statusAccent(status)
                )}
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl border border-rose-100 bg-rose-50 sm:h-auto sm:w-44 dark:border-input dark:bg-input/30">
                    <Image
                      src={cover}
                      alt={serviceName}
                      fill
                      sizes="(min-width: 640px) 176px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-rose-200/80 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#9F5863] dark:border-input dark:bg-input/30 dark:text-champagne-400"
                          >
                            {category}
                          </Badge>
                          <span className="text-[11px] font-medium tracking-wide text-stone-400 uppercase dark:text-muted-foreground">
                            Request #{booking._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <h2 className="mt-1.5 truncate font-heading text-lg font-semibold text-stone-900 sm:text-xl dark:text-foreground">
                          {serviceName}
                        </h2>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-stone-600 dark:text-muted-foreground">
                          <Store className="size-3.5 shrink-0 text-[#B76E79]" />
                          <span className="font-medium text-stone-700 dark:text-foreground">
                            {vendor.name}
                          </span>
                          <span className="text-stone-300 dark:text-input">
                            •
                          </span>
                          <span className="truncate">{vendor.contact}</span>
                        </p>
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
                          <CalendarDays className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase dark:text-muted-foreground">
                            Event date
                          </dt>
                          <dd className="truncate font-medium text-stone-800 dark:text-foreground">
                            {eventDateLabel(booking.eventDate)}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
                          <MapPin className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase dark:text-muted-foreground">
                            Event location
                          </dt>
                          <dd className="truncate font-medium text-stone-800 dark:text-foreground">
                            {booking.eventLocation || "—"}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
                          <Clock className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase dark:text-muted-foreground">
                            Requested
                          </dt>
                          <dd className="truncate font-medium text-stone-800 dark:text-foreground">
                            {formatDate(booking.createdAt)}
                          </dd>
                        </div>
                      </div>
                    </dl>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-rose-100 pt-3 dark:border-input">
                      <p className="text-[11px] text-stone-500 dark:text-muted-foreground">
                        {rowStatusNote(status)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setViewBookingId(booking._id)}
                          className="h-8 gap-1 rounded-lg border-rose-200/80 bg-white text-xs text-stone-700 hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:text-foreground dark:hover:bg-input/50"
                        >
                          <Eye className="size-3.5 text-[#B76E79]" />
                          View details
                        </Button>
                        {canCancel ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelTarget(booking)}
                            className="h-8 gap-1 rounded-lg border-rose-200/80 bg-white text-xs text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-input dark:bg-input/20 dark:hover:bg-rose-500/10"
                          >
                            <Ban className="size-3.5" />
                            Cancel request
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}

          <div className="flex flex-col gap-1 px-1 py-2 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between dark:text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-semibold text-stone-700 dark:text-foreground">
                {filteredBookings.length}
              </span>{" "}
              of {bookings.length} booking requests
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-amber-600" />
              Only pending requests can be cancelled.
            </span>
          </div>
        </div>
      )}

      {/* Booking details */}
      <Dialog
        open={Boolean(viewBooking)}
        onOpenChange={(open) => !open && setViewBookingId(null)}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl border-rose-200/80 bg-[#FDFBF7] p-0 sm:max-w-2xl dark:border-input dark:bg-card">
          {viewBooking && viewStatus && viewVendor ? (
            <>
              <div className="relative aspect-[16/8] w-full overflow-hidden bg-rose-100 dark:bg-input/30">
                <Image
                  src={viewCover}
                  alt={viewBooking.service?.serviceName ?? "Booking service"}
                  fill
                  sizes="(min-width: 640px) 640px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />
                <div className="absolute right-6 bottom-5 left-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="border-white/40 bg-white/90 text-xs font-semibold text-[#9F5863] dark:bg-input/80 dark:text-champagne-400">
                      {viewBooking.service?.category ?? "Unavailable"}
                    </Badge>
                    <StatusBadge status={viewStatus} />
                  </div>
                  <DialogTitle className="font-heading text-2xl font-semibold text-white sm:text-3xl">
                    {viewBooking.service?.serviceName ??
                      "Service no longer listed"}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-rose-100/85">
                    Requested from {viewVendor.name}
                  </DialogDescription>
                </div>
              </div>

              <div className="space-y-5 p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-12 ring-2 ring-rose-100 dark:ring-input">
                      {viewVendor.image ? (
                        <AvatarImage
                          src={viewVendor.image}
                          alt={viewVendor.name}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-[#B76E79] to-[#C58970] text-sm font-semibold text-white">
                        {getUserInitials(viewVendor.person ?? viewVendor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-base font-semibold text-stone-900 dark:text-foreground">
                        {viewVendor.business ||
                          viewVendor.person ||
                          viewVendor.name}
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-stone-500 dark:text-muted-foreground">
                        <Mail className="size-3.5 shrink-0 text-[#B76E79]" />
                        {viewVendor.contact}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-rose-200/80 bg-rose-50 text-[11px] font-semibold text-[#9F5863] dark:border-input dark:bg-input/30 dark:text-champagne-400"
                  >
                    <Store className="size-3" />
                    Vendor
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase dark:text-muted-foreground">
                      <CalendarDays className="size-3.5 text-[#B76E79]" />
                      Event date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-foreground">
                      {eventDateLabel(viewBooking.eventDate)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase dark:text-muted-foreground">
                      <MapPin className="size-3.5 text-[#B76E79]" />
                      Event location
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-foreground">
                      {viewBooking.eventLocation || "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase dark:text-muted-foreground">
                      <Clock className="size-3.5 text-[#B76E79]" />
                      Requested on
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-900 dark:text-foreground">
                      {formatDate(viewBooking.createdAt, "long")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase dark:text-muted-foreground">
                      <BadgeCheck className="size-3.5 text-[#B76E79]" />
                      Booking reference
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-stone-900 dark:text-foreground">
                      #{viewBooking._id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase dark:text-muted-foreground">
                    <MessageSquare className="size-3.5 text-[#B76E79]" />
                    Your message
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-stone-700 dark:text-muted-foreground">
                    {viewBooking.message?.trim() ||
                      "No extra notes were added."}
                  </p>
                </div>

                <p
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-xs leading-relaxed",
                    statusClasses(viewStatus)
                  )}
                >
                  {statusNote(viewStatus)}
                </p>

                <DialogFooter className="gap-2 border-t border-rose-100 pt-4 sm:justify-between dark:border-input">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewBookingId(null)}
                    className="rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
                  >
                    Close
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    {viewBooking.service ? (
                      <Button
                        variant="outline"
                        render={
                          <Link
                            href={`/browse-services/${viewBooking.service._id}`}
                          />
                        }
                        className="rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
                      >
                        View service
                      </Button>
                    ) : null}
                    {viewStatus === "pending" ? (
                      <Button
                        type="button"
                        onClick={() => {
                          setCancelTarget(viewBooking)
                          setViewBookingId(null)
                        }}
                        className="gap-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                      >
                        <Ban className="size-4" />
                        Cancel request
                      </Button>
                    ) : null}
                  </div>
                </DialogFooter>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && !cancelling && setCancelTarget(null)}
      >
        <DialogContent className="rounded-3xl border-rose-200/80 bg-[#FDFBF7] sm:max-w-md dark:border-input dark:bg-card">
          <DialogHeader>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <Ban className="size-5" />
            </span>
            <DialogTitle className="font-heading text-xl font-semibold text-stone-900 dark:text-foreground">
              Cancel this booking request?
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-stone-600 dark:text-muted-foreground">
              This cannot be undone. The vendor will see this request as
              cancelled, and you will need to send a new request if you change
              your mind.
            </DialogDescription>
          </DialogHeader>

          {cancelTarget && cancelVendor ? (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-200/75 bg-white p-3.5 dark:border-input dark:bg-input/20">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-rose-100 bg-rose-50 dark:border-input dark:bg-input/30">
                <Image
                  src={coverImage(cancelTarget.service)}
                  alt={cancelTarget.service?.serviceName ?? "Booking service"}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-stone-900 dark:text-foreground">
                  {cancelTarget.service?.serviceName ??
                    "Service no longer listed"}
                </p>
                <p className="truncate text-xs text-stone-500 dark:text-muted-foreground">
                  {cancelVendor.name} • {eventDateLabel(cancelTarget.eventDate)}
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={cancelling}
              onClick={() => setCancelTarget(null)}
              className="rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
            >
              Keep booking
            </Button>
            <Button
              type="button"
              disabled={cancelling}
              onClick={handleCancelBooking}
              className="gap-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700"
            >
              {cancelling ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                <>
                  <Ban className="size-4" />
                  Cancel request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
