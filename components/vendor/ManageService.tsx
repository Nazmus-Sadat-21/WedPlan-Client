"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertCircle,
  BadgeCheck,
  Clock,
  Eye,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "@/lib/auth-client"
import { isServiceActive } from "@/lib/api"
import { authFetch } from "@/lib/auth-fetch"
import {
  API_ENDPOINTS,
  CATEGORY_IMAGES,
  SERVICE_CATEGORIES,
} from "@/lib/constants"
import { formatPrice } from "@/lib/format"
import { uploadToImgbb } from "@/lib/imgbb"
import type { Service } from "@/lib/types"
import { cn } from "@/lib/utils"

type ApprovalFilter = "all" | "approved" | "pending" | "rejected"

type EditFormState = {
  serviceName: string
  category: string
  price: string
  location: string
  description: string
  images: string[] // existing image URLs
  availability: boolean
}

// A photo picked in the edit dialog that has not been uploaded yet.
type NewImage = { id: string; file: File; previewUrl: string }

const MAX_IMAGES = 8
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const controlClassName =
  "h-10 border-rose-200/90 bg-white/80 focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:border-input dark:bg-input/20 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

const focusRingClassName =
  "outline-none focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

function getApprovalStatus(service: Service): "approved" | "pending" | "rejected" {
  const raw = String(service.status ?? "pending").toLowerCase()
  if (raw === "approved") return "approved"
  if (raw === "rejected") return "rejected"
  return "pending"
}

function isServiceAvailable(service: Service): boolean {
  if (getApprovalStatus(service) === "rejected") return false
  return isServiceActive(service)
}

function resolveServiceVendorId(service: Service): string | null {
  const raw: unknown = service.vendorId ?? service.vendor
  if (!raw) return null
  if (typeof raw === "string") return raw
  if (typeof raw === "object") {
    if ("_id" in raw) return String((raw as { _id: unknown })._id)
    if ("id" in raw) return String((raw as { id: unknown }).id)
  }
  return null
}

export function ManageService() {
  const { data: sessionData, isPending: sessionLoading } = useSession()
  const user = sessionData?.user

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ApprovalFilter>("all")

  // Modals & Action States
  const [viewService, setViewService] = useState<Service | null>(null)
  const [editService, setEditService] = useState<Service | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const userId = user?.id

  const [editForm, setEditForm] = useState<EditFormState>({
    serviceName: "",
    category: SERVICE_CATEGORIES[0]?.name ?? "Wedding Venues",
    price: "",
    location: "",
    description: "",
    images: [],
    availability: true,
  })

  // Newly picked (not yet uploaded) photos for the edit dialog
  const [newImages, setNewImages] = useState<NewImage[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  function clearNewImages() {
    newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    setNewImages([])
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  function closeEditModal() {
    clearNewImages()
    setEditService(null)
  }

  function handleImageFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (files.length === 0) return

    const accepted: NewImage[] = []
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not an image file.`)
        continue
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`"${file.name}" is larger than 5 MB.`)
        continue
      }
      if (
        editForm.images.length + newImages.length + accepted.length >=
        MAX_IMAGES
      ) {
        toast.error(`You can add up to ${MAX_IMAGES} photos.`)
        break
      }
      accepted.push({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }

    if (accepted.length > 0) setNewImages((prev) => [...prev, ...accepted])
  }

  function removeExistingImage(url: string) {
    setEditForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))
  }

  function removeNewImage(id: string) {
    setNewImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((img) => img.id !== id)
    })
  }

  useEffect(() => {
    if (sessionLoading || !userId) return

    const controller = new AbortController()
    let active = true

    async function loadServices() {
      try {
        const res = await authFetch(API_ENDPOINTS.vendorServices, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(
            body?.message ?? "Could not load your wedding services."
          )
        }

        const json = await res.json()
        const list: Service[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : []

        if (!active) return

        setServices(
          list.filter(
            (item) => resolveServiceVendorId(item) === String(userId)
          )
        )
        setError(null)
      } catch (err) {
        if (!active || controller.signal.aborted) return
        const msg =
          err instanceof Error ? err.message : "Failed to load your services."
        setError(msg)
        toast.error(msg)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadServices()

    return () => {
      active = false
      controller.abort()
    }
  }, [sessionLoading, userId, reloadKey])

  function reloadServices() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  const showLoading = sessionLoading || (loading && Boolean(userId))

  const stats = useMemo(() => {
    let approved = 0
    let pending = 0
    let rejected = 0

    for (const s of services) {
      const status = getApprovalStatus(s)
      if (status === "approved") {
        approved++
      } else if (status === "rejected") {
        rejected++
      } else {
        pending++
      }
    }

    return {
      total: services.length,
      approved,
      pending,
      rejected,
    }
  }, [services])

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const status = getApprovalStatus(s)
      if (statusFilter !== "all" && status !== statusFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = s.serviceName?.toLowerCase().includes(q)
        const matchCat = s.category?.toLowerCase().includes(q)
        const matchLoc = s.location?.toLowerCase().includes(q)
        return matchName || matchCat || matchLoc
      }

      return true
    })
  }, [services, statusFilter, searchQuery])

  function openEditModal(service: Service) {
    const status = getApprovalStatus(service)
    clearNewImages()
    setEditService(service)
    setEditForm({
      serviceName: service.serviceName ?? "",
      category: service.category ?? SERVICE_CATEGORIES[0]?.name ?? "Wedding Venues",
      price: String(service.price ?? ""),
      location: service.location ?? "",
      description: service.description ?? "",
      images: Array.isArray(service.images) ? service.images : [],
      availability: status === "rejected" ? false : isServiceAvailable(service),
    })
  }

  async function handleToggleAvailability(service: Service) {
    const status = getApprovalStatus(service)
    if (status === "rejected") {
      toast.error(
        "Rejected services cannot be made available or visible to customers."
      )
      return
    }

    const currentAvail = isServiceAvailable(service)
    const nextAvail = !currentAvail
    const nextAvailability = nextAvail ? "active" : "inactive"

    if (!userId) {
      toast.error("Your session expired. Please sign in again.")
      return
    }

    setTogglingId(service._id)
    try {
      const res = await authFetch(API_ENDPOINTS.serviceById(service._id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: nextAvailability }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? "Could not update service availability.")
      }

      setServices((prev) =>
        prev.map((item) =>
          item._id === service._id
            ? { ...item, availability: nextAvailability }
            : item
        )
      )

      toast.success(
        nextAvail
          ? `"${service.serviceName}" is now available for bookings.`
          : `"${service.serviceName}" is paused and hidden from customers.`
      )
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle availability."
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editService) return

    const parsedPrice = Number(editForm.price)
    if (!editForm.serviceName.trim() || !editForm.location.trim()) {
      toast.error("Service name and location are required.")
      return
    }
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Please enter a valid positive package price.")
      return
    }

    const status = getApprovalStatus(editService)
    const enforcedAvailability =
      status === "rejected" ? false : editForm.availability

    if (!userId) {
      toast.error("Your session expired. Please sign in again.")
      return
    }

    setSavingEdit(true)
    try {
      // Upload any newly picked photos first, then save the combined list.
      let uploadedUrls: string[] = []
      if (newImages.length > 0) {
        try {
          uploadedUrls = await Promise.all(
            newImages.map((img) => uploadToImgbb(img.file))
          )
        } catch (uploadError) {
          toast.error(
            uploadError instanceof Error
              ? uploadError.message
              : "Image upload failed."
          )
          return
        }
      }

      const payload = {
        serviceName: editForm.serviceName.trim(),
        category: editForm.category,
        price: parsedPrice,
        location: editForm.location.trim(),
        description: editForm.description.trim(),
        images: [...editForm.images, ...uploadedUrls],
        availability: enforcedAvailability ? "active" : "inactive",
      }

      const res = await authFetch(API_ENDPOINTS.serviceById(editService._id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.message ?? "Failed to update service.")
      }

      const updatedJson = await res.json().catch(() => null)
      const updatedRecord = updatedJson?.data ?? updatedJson

      setServices((prev) =>
        prev.map((item) =>
          item._id === editService._id
            ? { ...item, ...payload, ...(updatedRecord ?? {}) }
            : item
        )
      )

      toast.success("Service details updated successfully!")
      closeEditModal()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save changes."
      )
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return

    if (!userId) {
      toast.error("Your session expired. Please sign in again.")
      return
    }

    setDeleting(true)
    try {
      const res = await authFetch(API_ENDPOINTS.serviceById(deleteTarget._id), {
        method: "DELETE",
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? "Could not delete this service.")
      }

      setServices((prev) =>
        prev.filter((item) => item._id !== deleteTarget._id)
      )
      toast.success(`"${deleteTarget.serviceName}" has been deleted.`)
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
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Top Editorial Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-rose-200/80 bg-gradient-to-br from-white via-[#FDFBF7] to-rose-50/60 p-6 shadow-2xs dark:border-input dark:from-card/90 dark:via-card dark:to-input/20 sm:flex-row sm:items-center sm:p-8">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#B76E79] uppercase dark:text-[#B76E79]">
            Vendor studio
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-foreground">
            Manage my{" "}
            <span className="text-[#B76E79] italic dark:text-[#B76E79]">
              services
            </span>
          </h1>
          <p className="max-w-xl text-sm text-stone-600 dark:text-muted-foreground">
            View, edit, toggle availability, or remove your wedding listings in a clear tabular overview.
          </p>
        </div>

        <Button
          render={<Link href="/vendor/add-service" />}
          className={cn(
            "h-11 shrink-0 gap-2 rounded-full bg-[#B76E79] px-6 text-sm font-medium text-[#fffdf8] shadow-md shadow-rose-900/10 transition-all hover:bg-[#a25c67] hover:shadow-lg",
            focusRingClassName
          )}
        >
          <Plus className="size-4" />
          Add New Service
        </Button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
        {[
          {
            label: "Total Services",
            value: stats.total,
            accent: "text-stone-900 dark:text-foreground",
            bg: "bg-white/90 dark:bg-card/90",
          },
          {
            label: "Approved & Live",
            value: stats.approved,
            accent: "text-emerald-700 dark:text-emerald-400",
            bg: "bg-emerald-50/40 dark:bg-emerald-500/10",
          },
          {
            label: "Pending Review",
            value: stats.pending,
            accent: "text-amber-700 dark:text-amber-400",
            bg: "bg-amber-50/40 dark:bg-amber-500/10",
          },
          {
            label: "Rejected (Hidden)",
            value: stats.rejected,
            accent: "text-rose-700 dark:text-rose-400",
            bg: "bg-rose-50/50 dark:bg-rose-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-2xl border border-rose-200/75 p-4 shadow-2xs dark:border-input sm:p-5",
              stat.bg
            )}
          >
            <p className="text-xs font-medium text-stone-500 dark:text-muted-foreground">
              {stat.label}
            </p>
            <p
              className={cn(
                "mt-1.5 font-heading text-2xl font-bold sm:text-3xl",
                stat.accent
              )}
            >
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-rose-200/75 bg-white/90 p-4 shadow-2xs dark:border-input dark:bg-card/90 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: `All (${stats.total})` },
              { id: "approved", label: `Approved (${stats.approved})` },
              { id: "pending", label: `Pending (${stats.pending})` },
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

        <div className="relative w-full sm:w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, category, location..."
            className={cn(controlClassName, "pr-9 pl-4 text-sm")}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:text-muted-foreground dark:hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Table Content Area */}
      {showLoading ? (
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
            Unable to Load Services
          </h2>
          <p className="mt-1 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            {error}
          </p>
          <Button
            onClick={reloadServices}
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
            {services.length === 0
              ? "No Services Created Yet"
              : "No Matching Services"}
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            {services.length === 0
              ? "Start showcasing your wedding packages to couples across WedPlan by creating your first service."
              : "Try clearing your search filter or switching approval status tabs."}
          </p>
          {services.length === 0 ? (
            <Button
              render={<Link href="/vendor/add-service" />}
              className={cn(
                "mt-6 gap-2 rounded-full bg-[#B76E79] px-6 text-[#fffdf8] hover:bg-[#a25c67]",
                focusRingClassName
              )}
            >
              <Plus className="size-4" />
              Create First Service
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
              className="mt-5 rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white/90 shadow-xs dark:border-input dark:bg-card/90">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rose-100 bg-rose-50/50 text-xs font-semibold tracking-wider text-stone-500 uppercase dark:border-input dark:bg-input/20 dark:text-muted-foreground">
                <tr>
                  <th className="py-3.5 pr-4 pl-5">Service</th>
                  <th className="px-4 py-3.5">Category &amp; Location</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Approval Status</th>
                  <th className="px-4 py-3.5">Availability</th>
                  <th className="py-3.5 pr-5 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/70 dark:divide-input">
                {filteredServices.map((service) => {
                  const approval = getApprovalStatus(service)
                  const available = isServiceAvailable(service)
                  const isRejected = approval === "rejected"
                  const isToggling = togglingId === service._id

                  const imgs = Array.isArray(service.images) ? service.images : []
                  const coverImg =
                    imgs[0] ??
                    CATEGORY_IMAGES[service.category] ??
                    CATEGORY_IMAGES["Photography & Videography"]

                  return (
                    <tr
                      key={service._id}
                      className={cn(
                        "transition-colors hover:bg-rose-50/30 dark:hover:bg-input/10",
                        isRejected && "bg-rose-50/20 dark:bg-rose-500/5"
                      )}
                    >
                      {/* Service Info */}
                      <td className="py-4 pr-4 pl-5">
                        <div className="flex items-center gap-3.5">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-rose-100 bg-rose-50 dark:border-input dark:bg-input/30">
                            <Image
                              src={coverImg}
                              alt={service.serviceName}
                              fill
                              sizes="48px"
                              className={cn(
                                "object-cover",
                                isRejected && "grayscale-[35%]"
                              )}
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="truncate font-heading font-semibold text-stone-900 dark:text-foreground">
                              {service.serviceName}
                            </p>
                            <p className="truncate text-xs text-stone-500 dark:text-muted-foreground">
                              {service.description || "No description provided."}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="px-4 py-4">
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

                      {/* Price */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-heading font-bold text-stone-900 dark:text-foreground">
                          {formatPrice(service.price)}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {approval === "approved" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <BadgeCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            Approved
                          </span>
                        )}
                        {approval === "pending" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                            <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                            Pending Review
                          </span>
                        )}
                        {approval === "rejected" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" title="A rejected service is hidden from customers">
                            <ShieldAlert className="size-3.5 text-rose-600 dark:text-rose-400" />
                            Rejected (Hidden)
                          </span>
                        )}
                      </td>

                      {/* Availability Toggle */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={available && !isRejected}
                            disabled={isRejected || isToggling}
                            onClick={() => handleToggleAvailability(service)}
                            aria-label={`Toggle availability for ${service.serviceName}`}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B76E79]/40 disabled:cursor-not-allowed disabled:opacity-45",
                              available && !isRejected
                                ? "bg-[#B76E79]"
                                : "bg-stone-300 dark:bg-input"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200",
                                available && !isRejected
                                  ? "translate-x-5"
                                  : "translate-x-0"
                              )}
                            />
                          </button>
                          <span className="text-xs font-medium text-stone-600 dark:text-muted-foreground">
                            {isRejected
                              ? "Locked"
                              : available
                                ? "Available"
                                : "Paused"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-5 pl-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setViewService(service)}
                            className="h-8 gap-1 rounded-lg border-rose-200/80 bg-white text-xs text-stone-700 hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:text-foreground dark:hover:bg-input/50"
                          >
                            <Eye className="size-3.5 text-[#B76E79]" />
                            View
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(service)}
                            className="h-8 gap-1 rounded-lg border-rose-200/80 bg-white text-xs text-stone-700 hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:text-foreground dark:hover:bg-input/50"
                          >
                            <Pencil className="size-3.5 text-[#B76E79]" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(service)}
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
        </div>
      )}

      {/* VIEW SERVICE DETAILS DIALOG */}
      <Dialog
        open={Boolean(viewService)}
        onOpenChange={(open) => !open && setViewService(null)}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl border-rose-200/80 bg-[#FDFBF7] p-0 dark:border-input dark:bg-card sm:max-w-2xl">
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
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent" />
                <div className="absolute right-6 bottom-5 left-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <Badge className="mb-2 border-white/40 bg-white/90 text-xs font-semibold text-[#9F5863] dark:bg-input/80 dark:text-champagne-400">
                      {viewService.category}
                    </Badge>
                    <DialogTitle className="font-heading text-2xl font-semibold text-white sm:text-3xl">
                      {viewService.serviceName}
                    </DialogTitle>
                  </div>
                  <span className="rounded-2xl bg-white/95 px-4 py-1.5 font-heading text-xl font-bold text-stone-900 shadow-md dark:bg-card dark:text-foreground">
                    {formatPrice(viewService.price)}
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-6 sm:p-7">
                <DialogDescription className="sr-only">
                  Detailed overview of {viewService.serviceName}
                </DialogDescription>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/75 bg-white p-4 dark:border-input dark:bg-input/20">
                  <div className="flex items-center gap-2 text-sm text-stone-700 dark:text-foreground">
                    <MapPin className="size-4 text-[#B76E79]" />
                    <span className="font-medium">{viewService.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#9F5863] capitalize dark:bg-input/50 dark:text-champagne-400">
                      Status: {getApprovalStatus(viewService)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        isServiceAvailable(viewService)
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-stone-100 text-stone-600 dark:bg-input/40 dark:text-muted-foreground"
                      )}
                    >
                      {isServiceAvailable(viewService)
                        ? "Available"
                        : "Unavailable"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-rose-200/75 bg-white p-5 dark:border-input dark:bg-input/20">
                  <h4 className="text-xs font-semibold tracking-wider text-stone-400 uppercase dark:text-muted-foreground">
                    Package Description
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
                      {viewService.images.map((url, i) => (
                        <div
                          key={`${url}-${i}`}
                          className="relative aspect-[4/3] overflow-hidden rounded-xl border border-rose-200/70 dark:border-input"
                        >
                          <Image
                            src={url}
                            alt={`Gallery ${i + 1}`}
                            fill
                            sizes="150px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <DialogFooter className="gap-2 pt-2 sm:justify-between">
                  {getApprovalStatus(viewService) === "approved" &&
                  isServiceAvailable(viewService) ? (
                    <Button
                      render={<Link href={`/browse-services/${viewService._id}`} />}
                      variant="outline"
                      className={cn(
                        "rounded-full border-rose-200 text-stone-700 hover:bg-rose-50 dark:border-input dark:text-foreground dark:hover:bg-input/50",
                        focusRingClassName
                      )}
                    >
                      Open Public Page
                    </Button>
                  ) : (
                    <span className="text-xs text-stone-500 dark:text-muted-foreground">
                      {getApprovalStatus(viewService) === "rejected"
                        ? "Hidden from public listings due to rejection."
                        : "Public link active once approved & available."}
                    </span>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setViewService(null)}
                      className={cn("rounded-full border-rose-200 dark:border-input", focusRingClassName)}
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        const target = viewService
                        setViewService(null)
                        openEditModal(target)
                      }}
                      className={cn(
                        "gap-1.5 rounded-full bg-[#B76E79] text-[#fffdf8] hover:bg-[#a25c67]",
                        focusRingClassName
                      )}
                    >
                      <Pencil className="size-3.5" />
                      Edit Service
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* UPDATE / EDIT SERVICE DIALOG */}
      <Dialog
        open={Boolean(editService)}
        onOpenChange={(open) => !open && !savingEdit && closeEditModal()}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl border-rose-200/80 bg-[#FDFBF7] dark:border-input dark:bg-card sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
              Update Service Details
            </DialogTitle>
            <DialogDescription className="text-stone-600 dark:text-muted-foreground">
              Modify your package pricing, description, photos, or booking
              availability.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSubmit} className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Service Name *</Label>
              <Input
                id="edit-name"
                required
                value={editForm.serviceName}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, serviceName: e.target.value }))
                }
                className={controlClassName}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(val) =>
                    setEditForm((f) => ({ ...f, category: String(val) }))
                  }
                >
                  <SelectTrigger id="edit-category" className={cn(controlClassName, "w-full justify-between")}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-price">Package Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min={1}
                  required
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, price: e.target.value }))
                  }
                  className={controlClassName}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-location">Location *</Label>
              <Input
                id="edit-location"
                required
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, location: e.target.value }))
                }
                className={controlClassName}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={4}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                className={cn(controlClassName, "h-auto py-2")}
              />
            </div>

            {/* Service images: file input with previews */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImagePlus className="size-3.5 text-[#B76E79]" />
                Service Images
              </Label>

              {editForm.images.length + newImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {editForm.images.map((url, i) => (
                    <div
                      key={`${url}-${i}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-rose-200/70 dark:border-input"
                    >
                      <Image
                        src={url}
                        alt={`Service photo ${i + 1}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                      {i === 0 ? (
                        <span className="absolute bottom-1 left-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#9F5863]">
                          Cover
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        aria-label="Remove photo"
                        className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-stone-900/70 text-white transition-colors hover:bg-stone-900"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {newImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-[#B76E79]/60"
                    >
                      <Image
                        src={img.previewUrl}
                        alt={img.file.name}
                        fill
                        unoptimized
                        sizes="120px"
                        className="object-cover"
                      />
                      <span className="absolute bottom-1 left-1 rounded-full bg-[#B76E79] px-2 py-0.5 text-[10px] font-semibold text-white">
                        New
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNewImage(img.id)}
                        aria-label="Remove photo"
                        className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-stone-900/70 text-white transition-colors hover:bg-stone-900"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <label
                htmlFor="edit-images"
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-rose-200/90 bg-white/70 px-3 text-sm font-medium text-foreground transition-colors hover:bg-rose-50/70 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
                  focusRingClassName
                )}
              >
                <ImagePlus className="size-4" />
                Upload photos
              </label>
              <input
                ref={imageInputRef}
                id="edit-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFiles}
                className="sr-only"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG or WebP, up to 5 MB each ({MAX_IMAGES} photos max). The
                first photo is the cover.
              </p>
            </div>

            {editService && getApprovalStatus(editService) !== "rejected" ? (
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-rose-200/80 bg-white p-3.5 dark:border-input dark:bg-input/20">
                <div>
                  <p className="text-sm font-medium text-stone-800 dark:text-foreground">
                    Service Available for Booking
                  </p>
                  <p className="text-xs text-stone-500 dark:text-muted-foreground">
                    Toggle off to temporarily pause new requests
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.availability}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      availability: e.target.checked,
                    }))
                  }
                  className="size-4 accent-[#B76E79]"
                />
              </label>
            ) : null}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={savingEdit}
                onClick={closeEditModal}
                className={cn("rounded-full border-rose-200 dark:border-input", focusRingClassName)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className={cn(
                  "gap-2 rounded-full bg-[#B76E79] px-6 text-[#fffdf8] hover:bg-[#a25c67]",
                  focusRingClassName
                )}
              >
                {savingEdit ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="rounded-3xl border-rose-200/80 bg-[#FDFBF7] dark:border-input dark:bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
              Delete Service?
            </DialogTitle>
            <DialogDescription className="text-stone-600 dark:text-muted-foreground">
              Are you sure you want to permanently remove{" "}
              <span className="font-semibold text-stone-900 dark:text-foreground">
                {deleteTarget?.serviceName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              className={cn("rounded-full border-rose-200 dark:border-input", focusRingClassName)}
            >
              Keep Service
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className={cn(
                "gap-2 rounded-full bg-rose-600 text-white hover:bg-rose-700",
                focusRingClassName
              )}
            >
              {deleting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManageService