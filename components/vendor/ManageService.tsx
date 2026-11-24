"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Clock,
  Eye,
  Flower2,
  Images,
  ImagePlus,
  Landmark,
  Layers,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Shirt,
  Sparkles,
  Trash2,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
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
import { EASE_OUT } from "@/lib/motion"
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

type CategoryMeta = {
  icon: LucideIcon
  /** Icon tile + chip colors. */
  chip: string
  /** Soft gradient used on the card's category rail. */
  rail: string
  /** Accent colour for the cover overlay. */
  glow: string
}

const MAX_IMAGES = 8
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const CATEGORY_META: Record<string, CategoryMeta> = {
  "Photography & Videography": {
    icon: Camera,
    chip: "border-rose-200/80 bg-rose-50 text-[#9F5863] dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-300",
    rail: "from-rose-500/20 via-rose-400/5 to-transparent",
    glow: "bg-rose-400/20",
  },
  "Wedding Venues": {
    icon: Landmark,
    chip: "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300",
    rail: "from-amber-500/20 via-amber-400/5 to-transparent",
    glow: "bg-amber-300/20",
  },
  "Decoration & Florist": {
    icon: Flower2,
    chip: "border-pink-200/80 bg-pink-50 text-pink-700 dark:border-pink-400/25 dark:bg-pink-400/10 dark:text-pink-300",
    rail: "from-pink-500/20 via-pink-400/5 to-transparent",
    glow: "bg-pink-300/20",
  },
  "Catering Services": {
    icon: UtensilsCrossed,
    chip: "border-orange-200/80 bg-orange-50 text-orange-800 dark:border-orange-400/25 dark:bg-orange-400/10 dark:text-orange-300",
    rail: "from-orange-500/20 via-orange-400/5 to-transparent",
    glow: "bg-orange-300/20",
  },
  "Makeup & Styling": {
    icon: Sparkles,
    chip: "border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-300",
    rail: "from-violet-500/20 via-violet-400/5 to-transparent",
    glow: "bg-violet-300/20",
  },
  "Wedding Fashion": {
    icon: Shirt,
    chip: "border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300",
    rail: "from-sky-500/20 via-sky-400/5 to-transparent",
    glow: "bg-sky-300/20",
  },
}

const FALLBACK_META: CategoryMeta = {
  icon: Sparkles,
  chip: "border-rose-200/80 bg-rose-50 text-[#9F5863] dark:border-input dark:bg-input/30 dark:text-champagne-400",
  rail: "from-rose-500/20 via-rose-400/5 to-transparent",
  glow: "bg-rose-300/20",
}

function categoryMeta(category?: string): CategoryMeta {
  return (category && CATEGORY_META[category]) || FALLBACK_META
}

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

const APPROVAL_META = {
  approved: {
    label: "Approved",
    icon: BadgeCheck,
    className:
      "border-emerald-200/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  pending: {
    label: "Pending review",
    icon: Clock,
    className:
      "border-amber-200/80 bg-amber-50/90 text-amber-800 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-300",
  },
  rejected: {
    label: "Rejected",
    icon: ShieldAlert,
    className:
      "border-rose-200/80 bg-rose-50/90 text-rose-800 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-300",
  },
} as const

export function ManageService() {
  const { data: sessionData, isPending: sessionLoading } = useSession()
  const user = sessionData?.user
  const reduceMotion = useReducedMotion()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ApprovalFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

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

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const service of services) {
      const key = service.category || "Other"
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [services])

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const status = getApprovalStatus(s)
      if (statusFilter !== "all" && status !== statusFilter) return false
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = s.serviceName?.toLowerCase().includes(q)
        const matchCat = s.category?.toLowerCase().includes(q)
        const matchLoc = s.location?.toLowerCase().includes(q)
        return matchName || matchCat || matchLoc
      }

      return true
    })
  }, [services, statusFilter, categoryFilter, searchQuery])

  const hasActiveFilters =
    statusFilter !== "all" || categoryFilter !== "all" || searchQuery.trim() !== ""

  function resetFilters() {
    setSearchQuery("")
    setStatusFilter("all")
    setCategoryFilter("all")
  }

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

  const statusTabs: { id: ApprovalFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: stats.total },
    { id: "approved", label: "Live", count: stats.approved },
    { id: "pending", label: "Pending", count: stats.pending },
    { id: "rejected", label: "Rejected", count: stats.rejected },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* ------------------------------------------------------------------ */}
      {/* Editorial hero                                                      */}
      {/* ------------------------------------------------------------------ */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative isolate overflow-hidden rounded-[2rem] border border-rose-200/70 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] px-6 py-7 text-white shadow-xl shadow-rose-950/15 sm:px-8 sm:py-9"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-rose-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-amber-200/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.26em] text-rose-200/90 uppercase">
              <Sparkles className="size-3.5" />
              Vendor studio
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.05]">
              Every service, styled to its{" "}
              <span className="bg-gradient-to-r from-rose-200 via-amber-100 to-rose-200 bg-clip-text text-transparent italic">
                own story
              </span>
            </h1>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-rose-100/80">
              Manage venues, photography, florals, catering, styling and fashion
              in one editorial workspace. Track approvals, tune availability and
              keep every listing ready for couples.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-md">
                <TrendingUp className="size-3.5 text-emerald-200" />
                {stats.approved} live
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-md">
                <Clock className="size-3.5 text-amber-200" />
                {stats.pending} awaiting review
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-md">
                <Layers className="size-3.5 text-rose-200" />
                {stats.total} total
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 sm:flex-row lg:flex-col lg:items-end">
            <Button
              render={<Link href="/vendor/add-service" />}
              className={cn(
                "group h-12 gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#7c3f49] shadow-lg shadow-rose-950/30 transition-all hover:bg-rose-50 hover:shadow-xl",
                focusRingClassName
              )}
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-[#B76E79] text-white transition-transform duration-300 group-hover:rotate-90">
                <Plus className="size-4" />
              </span>
              Add new service
            </Button>
            <p className="text-[11px] text-rose-100/70 lg:text-right">
              New listings go live after admin review.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ------------------------------------------------------------------ */}
      {/* Metric cards                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-4">
        {[
          {
            label: "Total services",
            value: stats.total,
            icon: Layers,
            tint: "bg-rose-100/80 text-[#B76E79] dark:bg-rose-400/10 dark:text-rose-300",
            hint: "Across all categories",
          },
          {
            label: "Live & approved",
            value: stats.approved,
            icon: BadgeCheck,
            tint: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
            hint: "Visible to couples",
          },
          {
            label: "Pending review",
            value: stats.pending,
            icon: Clock,
            tint: "bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
            hint: "With the admin team",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: ShieldAlert,
            tint: "bg-rose-100/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
            hint: "Hidden from the public",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{
              delay: 0.06 * index,
              duration: 0.45,
              ease: EASE_OUT,
            }}
            whileHover={reduceMotion ? undefined : { y: -4 }}
            className="group rounded-2xl border border-rose-200/70 bg-white/90 p-4 shadow-2xs transition-shadow hover:shadow-lg hover:shadow-rose-950/5 dark:border-input dark:bg-card/90 sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold tracking-wide text-stone-500 uppercase dark:text-muted-foreground">
                {stat.label}
              </p>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                  stat.tint
                )}
              >
                <stat.icon className="size-4" />
              </span>
            </div>
            <p className="mt-2 font-heading text-2xl font-bold text-stone-900 sm:text-3xl dark:text-foreground">
              {showLoading ? "—" : stat.value}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-400 dark:text-muted-foreground">
              {stat.hint}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Search, category rail, status tabs                                  */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: EASE_OUT }}
        className="space-y-3 rounded-3xl border border-rose-200/70 bg-white/90 p-4 shadow-2xs dark:border-input dark:bg-card/90 sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400 dark:text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your services, categories or cities..."
              className={cn(controlClassName, "h-11 pr-9 pl-10 text-sm")}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-700 dark:text-muted-foreground dark:hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full border border-rose-200/70 bg-[#FDFBF7] p-1 dark:border-input dark:bg-input/20">
              {statusTabs.map((tab) => {
                const active = statusFilter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    aria-pressed={active}
                    className={cn(
                      "relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "text-white"
                        : "text-stone-600 hover:text-stone-900 dark:text-muted-foreground dark:hover:text-foreground"
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="my-services-status-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#B76E79] to-[#C58970] shadow-sm shadow-rose-900/20"
                      />
                    ) : null}
                    <span className="relative">
                      {tab.label}
                      <span
                        className={cn(
                          "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                          active
                            ? "bg-white/20 text-white"
                            : "bg-rose-100/80 text-[#9F5863] dark:bg-input/40 dark:text-muted-foreground"
                        )}
                      >
                        {tab.count}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

          </div>
        </div>

        {/* Category rail — themed for every wedding service type */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
              categoryFilter === "all"
                ? "border-[#B76E79] bg-[#B76E79] text-white shadow-sm shadow-rose-900/15"
                : "border-rose-200/70 bg-[#FDFBF7] text-stone-600 hover:border-rose-300 hover:text-stone-900 dark:border-input dark:bg-input/20 dark:text-muted-foreground dark:hover:text-foreground"
            )}
          >
            <Layers className="size-3.5" />
            All categories
            <span className="opacity-70">{stats.total}</span>
          </button>
          {SERVICE_CATEGORIES.map((category) => {
            const meta = categoryMeta(category.name)
            const active = categoryFilter === category.name
            return (
              <button
                key={category.name}
                type="button"
                onClick={() =>
                  setCategoryFilter(active ? "all" : category.name)
                }
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "border-[#B76E79] bg-[#B76E79] text-white shadow-sm shadow-rose-900/15"
                    : "border-rose-200/70 bg-[#FDFBF7] text-stone-600 hover:border-rose-300 hover:text-stone-900 dark:border-input dark:bg-input/20 dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                <meta.icon className="size-3.5" />
                {category.name}
                <span className="opacity-70">
                  {categoryCounts.get(category.name) ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rose-100 pt-3 dark:border-input">
            <p className="text-xs text-stone-500 dark:text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-stone-800 dark:text-foreground">
                {filteredServices.length}
              </span>{" "}
              of {services.length} services
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#9F5863] hover:underline dark:text-champagne-400"
            >
              <RotateCcw className="size-3" />
              Reset filters
            </button>
          </div>
        ) : null}
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                             */}
      {/* ------------------------------------------------------------------ */}
      {showLoading ? (
        <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white/90 shadow-2xs dark:border-input dark:bg-card/90">
          <div className="border-b border-rose-100 bg-rose-50/60 px-5 py-3 dark:border-input dark:bg-input/20">
            <Skeleton className="h-4 w-1/3 bg-rose-100/80 dark:bg-input/40" />
          </div>
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="flex items-center gap-4 border-b border-rose-100 px-5 py-3.5 last:border-0 dark:border-input"
            >
              <Skeleton className="size-12 shrink-0 rounded-xl bg-rose-100/60 dark:bg-input/30" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5 bg-rose-100/60 dark:bg-input/30" />
                <Skeleton className="h-3 w-1/4 bg-rose-100/60 dark:bg-input/30" />
              </div>
              <Skeleton className="hidden h-6 w-24 rounded-full bg-rose-100/60 md:block dark:bg-input/30" />
              <Skeleton className="h-8 w-28 rounded-lg bg-rose-100/60 dark:bg-input/30" />
            </motion.div>
          ))}
        </div>
      ) : error ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="flex flex-col items-center justify-center rounded-3xl border border-rose-200/80 bg-white/90 px-6 py-16 text-center shadow-2xs dark:border-input dark:bg-card/90"
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
            <AlertCircle className="size-7" />
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold text-stone-900 dark:text-foreground">
            Unable to load services
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
        </motion.div>
      ) : filteredServices.length === 0 ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="relative overflow-hidden rounded-3xl border border-dashed border-rose-300/80 bg-white/80 px-6 py-16 text-center dark:border-input dark:bg-card/50"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 left-1/2 size-56 -translate-x-1/2 rounded-full bg-rose-100/50 blur-3xl dark:bg-rose-500/10"
          />
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : { rotate: [0, 6, -6, 0], scale: [1, 1.05, 1] }
              }
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-amber-50 text-[#B76E79] ring-1 ring-rose-200/70 dark:from-input/40 dark:to-input/20 dark:text-champagne-400 dark:ring-input"
            >
              <Sparkles className="size-7" />
            </motion.div>
            <h2 className="mt-4 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
              {services.length === 0
                ? "Your studio is waiting for its first story"
                : "No services match these filters"}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
              {services.length === 0
                ? "Add a venue, photographer, florist or any other wedding service. Once approved, couples can discover and book you."
                : "Try a different category, approval status or search term."}
            </p>
            {services.length === 0 ? (
              <Button
                render={<Link href="/vendor/add-service" />}
                className={cn(
                  "mt-6 h-11 gap-2 rounded-full bg-[#B76E79] px-6 text-[#fffdf8] shadow-md shadow-rose-900/15 hover:bg-[#a25c67]",
                  focusRingClassName
                )}
              >
                <Plus className="size-4" />
                Create your first service
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="mt-5 gap-2 rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
              >
                <RotateCcw className="size-4" />
                Clear filters
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white/90 shadow-2xs dark:border-input dark:bg-card/90"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b border-rose-100 bg-rose-50/60 text-left text-[11px] font-semibold tracking-wider text-stone-500 uppercase dark:border-input dark:bg-input/20 dark:text-muted-foreground">
                  <th scope="col" className="w-10 px-4 py-3 text-center">#</th>
                  <th scope="col" className="px-4 py-3">Service</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Price</th>
                  <th scope="col" className="px-4 py-3">Approval</th>
                  <th scope="col" className="px-4 py-3">Availability</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filteredServices.map((service, index) => (
                    <ServiceTableRow
                      key={service._id}
                      service={service}
                      index={index}
                      reduceMotion={Boolean(reduceMotion)}
                      isToggling={togglingId === service._id}
                      onView={() => setViewService(service)}
                      onEdit={() => openEditModal(service)}
                      onDelete={() => setDeleteTarget(service)}
                      onToggle={() => handleToggleAvailability(service)}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className="border-t border-rose-100 px-5 py-3 text-xs text-stone-500 dark:border-input dark:text-muted-foreground">
            {filteredServices.length} of {services.length} services
          </div>
        </motion.div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* VIEW SERVICE DIALOG                                                 */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={Boolean(viewService)}
        onOpenChange={(open) => !open && setViewService(null)}
      >
        <DialogContent className="max-h-[92svh] overflow-y-auto rounded-[1.75rem] border-rose-200/80 bg-[#FDFBF7] p-0 dark:border-input dark:bg-card sm:max-w-2xl">
          {viewService ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
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
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent" />

                <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-md",
                      APPROVAL_META[getApprovalStatus(viewService)].className
                    )}
                  >
                    {(() => {
                      const meta = APPROVAL_META[getApprovalStatus(viewService)]
                      return <meta.icon className="size-3.5" />
                    })()}
                    {APPROVAL_META[getApprovalStatus(viewService)].label}
                  </span>
                  {(() => {
                    const meta = categoryMeta(viewService.category)
                    return (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                        <meta.icon className="size-3.5" />
                        {viewService.category}
                      </span>
                    )
                  })()}
                </div>

                <div className="absolute right-5 bottom-5 left-5 flex flex-wrap items-end justify-between gap-3">
                  <DialogTitle className="max-w-md font-heading text-2xl font-semibold text-white sm:text-3xl">
                    {viewService.serviceName}
                  </DialogTitle>
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
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        isServiceAvailable(viewService)
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-stone-100 text-stone-600 dark:bg-input/40 dark:text-muted-foreground"
                      )}
                    >
                      {isServiceAvailable(viewService)
                        ? "Available for bookings"
                        : "Paused / unavailable"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-rose-200/75 bg-white p-5 dark:border-input dark:bg-input/20">
                  <h4 className="text-xs font-semibold tracking-wider text-stone-400 uppercase dark:text-muted-foreground">
                    Package description
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-stone-700 dark:text-foreground">
                    {viewService.description || "No description provided."}
                  </p>
                </div>

                {Array.isArray(viewService.images) &&
                viewService.images.length > 1 ? (
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-stone-400 uppercase dark:text-muted-foreground">
                      <Images className="size-3.5" />
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
                      <ArrowUpRight className="size-4" />
                      Open public page
                    </Button>
                  ) : (
                    <span className="max-w-[16rem] text-xs text-stone-500 dark:text-muted-foreground">
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
                      className={cn(
                        "rounded-full border-rose-200 dark:border-input",
                        focusRingClassName
                      )}
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
                      Edit service
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </motion.div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* UPDATE / EDIT SERVICE DIALOG                                        */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={Boolean(editService)}
        onOpenChange={(open) => !open && !savingEdit && closeEditModal()}
      >
        <DialogContent className="max-h-[92svh] overflow-y-auto rounded-[1.75rem] border-rose-200/80 bg-[#FDFBF7] dark:border-input dark:bg-card sm:max-w-xl">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
                Update service details
              </DialogTitle>
              <DialogDescription className="text-stone-600 dark:text-muted-foreground">
                Refine your package pricing, description, photos and booking
                availability.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Service name *</Label>
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
                    <SelectTrigger
                      id="edit-category"
                      className={cn(controlClassName, "w-full justify-between")}
                    >
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
                  <Label htmlFor="edit-price">Package price *</Label>
                  <div className="relative">
                    <Wallet className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="edit-price"
                      type="number"
                      min={1}
                      required
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, price: e.target.value }))
                      }
                      className={cn(controlClassName, "pl-9")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-location">Location *</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="edit-location"
                    required
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, location: e.target.value }))
                    }
                    className={cn(controlClassName, "pl-9")}
                  />
                </div>
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
                  Service images
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
                  PNG, JPG or WebP, up to 5 MB each ({MAX_IMAGES} photos max).
                  The first photo is the cover.
                </p>
              </div>

              {editService && getApprovalStatus(editService) !== "rejected" ? (
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-rose-200/80 bg-white p-3.5 dark:border-input dark:bg-input/20">
                  <div>
                    <p className="text-sm font-medium text-stone-800 dark:text-foreground">
                      Service available for booking
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
                  className={cn(
                    "rounded-full border-rose-200 dark:border-input",
                    focusRingClassName
                  )}
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
                    "Save changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* DELETE CONFIRMATION DIALOG                                          */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="rounded-[1.75rem] border-rose-200/80 bg-[#FDFBF7] dark:border-input dark:bg-card sm:max-w-md">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <DialogHeader>
              <motion.span
                initial={reduceMotion ? false : { rotate: -8, scale: 0.8 }}
                animate={reduceMotion ? undefined : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="flex size-12 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
              >
                <Trash2 className="size-5" />
              </motion.span>
              <DialogTitle className="mt-2 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
                Delete service?
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
                className={cn(
                  "rounded-full border-rose-200 dark:border-input",
                  focusRingClassName
                )}
              >
                Keep service
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
                    Delete permanently
                  </>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Service table row                                                         */
/* -------------------------------------------------------------------------- */

type ServiceTableRowProps = {
  service: Service
  index: number
  reduceMotion: boolean
  isToggling: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}

function ServiceTableRow({
  service,
  index,
  reduceMotion,
  isToggling,
  onView,
  onEdit,
  onDelete,
  onToggle,
}: ServiceTableRowProps) {
  const approval = getApprovalStatus(service)
  const available = isServiceAvailable(service)
  const isRejected = approval === "rejected"
  const meta = categoryMeta(service.category)
  const CategoryIcon = meta.icon
  const approvalMeta = APPROVAL_META[approval]
  const ApprovalIcon = approvalMeta.icon

  const images = Array.isArray(service.images) ? service.images : []
  const coverImg =
    images[0] ??
    CATEGORY_IMAGES[service.category] ??
    CATEGORY_IMAGES["Photography & Videography"]

  return (
    <motion.tr
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.3, ease: EASE_OUT }}
      className="border-b border-rose-100 align-middle transition-colors last:border-0 hover:bg-rose-50/50 dark:border-input dark:hover:bg-input/20"
    >
      <td className="px-4 py-3 text-center text-xs font-medium text-stone-400 dark:text-muted-foreground">
        {index + 1}
      </td>

      {/* Service */}
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-rose-50 ring-1 ring-rose-200/70 dark:bg-input/30 dark:ring-input">
            <Image
              src={coverImg}
              alt={service.serviceName}
              fill
              sizes="48px"
              className={cn("object-cover", isRejected && "grayscale-[45%]")}
            />
          </div>
          <div className="min-w-0 max-w-[16rem]">
            <p className="truncate font-semibold text-stone-900 dark:text-foreground">
              {service.serviceName}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500 dark:text-muted-foreground">
              <MapPin className="size-3 shrink-0 text-[#B76E79]" />
              <span className="truncate">{service.location}</span>
            </p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
            meta.chip
          )}
        >
          <CategoryIcon className="size-3" />
          {service.category}
        </span>
      </td>

      {/* Price */}
      <td className="px-4 py-3 font-heading font-semibold whitespace-nowrap text-stone-900 dark:text-foreground">
        {formatPrice(service.price)}
      </td>

      {/* Approval */}
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
            approvalMeta.className
          )}
        >
          <ApprovalIcon className="size-3" />
          {approvalMeta.label}
        </span>
      </td>

      {/* Availability */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={available && !isRejected}
            disabled={isRejected || isToggling}
            onClick={onToggle}
            aria-label={`Toggle availability for ${service.serviceName}`}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#B76E79]/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45",
              available && !isRejected
                ? "bg-[#B76E79]"
                : "bg-stone-300 dark:bg-input"
            )}
          >
            <motion.span
              animate={{ x: available && !isRejected ? 20 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0"
            />
          </button>
          <span
            className={cn(
              "text-xs font-medium whitespace-nowrap",
              isRejected
                ? "text-rose-600 dark:text-rose-300"
                : available
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-stone-500 dark:text-muted-foreground"
            )}
          >
            {isRejected ? "Hidden" : available ? "Visible" : "Paused"}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onView}
            aria-label={`View ${service.serviceName}`}
            title="View"
            className="size-8 rounded-lg border-rose-200/80 bg-white text-[#B76E79] hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:hover:bg-input/50"
          >
            <Eye className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${service.serviceName}`}
            title="Edit"
            className="size-8 rounded-lg border-rose-200/80 bg-white text-[#B76E79] hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:hover:bg-input/50"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onDelete}
            aria-label={`Delete ${service.serviceName}`}
            title="Delete"
            className="size-8 rounded-lg border-rose-200/80 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-input dark:bg-input/20 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </motion.tr>
  )
}

export default ManageService
