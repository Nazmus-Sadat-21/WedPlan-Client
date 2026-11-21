"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  ArrowRight,
  BadgeCheck,
  CloudOff,
  Crown,
  ImagePlus,
  Info,
  LoaderCircle,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Wallet,
  XCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { createService, fetchVendorServices, isServiceActive } from "@/lib/api"
import { useSession } from "@/lib/auth-client"
import {
  CATEGORY_IMAGES,
  SERVICE_CATEGORIES,
} from "@/lib/constants"
import { formatDate, formatPrice } from "@/lib/format"
import { uploadToImgbb } from "@/lib/imgbb"
import type { Service } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Free vendors may have at most this many approved + available services. */
const FREE_ACTIVE_LIMIT = 3
const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const controlClassName =
  "h-10 border-rose-200/90 bg-white/80 focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:border-input dark:bg-input/20 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

const focusRingClassName =
  "outline-none focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

type FieldErrors = {
  serviceName?: string | null
  category?: string | null
  description?: string | null
  price?: string | null
  location?: string | null
  images?: string | null
}

type PickedImage = { file: File; url: string }

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending review",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: BadgeCheck,
  },
  rejected: {
    label: "Rejected",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    icon: XCircle,
  },
}

function validate({
  serviceName,
  category,
  description,
  price,
  location,
  imageCount,
}: {
  serviceName: string
  category: string
  description: string
  price: string
  location: string
  imageCount: number
}): FieldErrors {
  const errors: FieldErrors = {}
  if (!serviceName.trim()) errors.serviceName = "Service name is required."
  else if (serviceName.trim().length < 3) {
    errors.serviceName = "Use at least 3 characters."
  }

  if (!category) errors.category = "Choose a service category."

  if (!description.trim()) errors.description = "Description is required."
  else if (description.trim().length < 30) {
    errors.description = "Describe the service in at least 30 characters."
  }

  const numericPrice = Number(price)
  if (!price.trim()) errors.price = "Price is required."
  else if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    errors.price = "Enter a price greater than 0."
  }

  if (!location.trim()) errors.location = "Location is required."

  if (imageCount === 0) {
    errors.images = "Upload at least one service image."
  }

  return errors
}

function ServiceStatusBadge({ status }: { status?: string }) {
  const meta = STATUS_META[status ?? "pending"] ?? STATUS_META.pending
  const Icon = meta.icon
  return (
    <Badge className={cn("gap-1 border", meta.className)}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  )
}

function SubmittedServiceCard({ service }: { service: Service }) {
  const image =
    (Array.isArray(service.images) ? service.images[0] : undefined) ??
    CATEGORY_IMAGES[service.category] ??
    CATEGORY_IMAGES["Photography & Videography"]

  return (
    <div className="flex gap-3 rounded-xl border border-rose-100 bg-white/80 p-3 dark:border-input dark:bg-input/10">
      {/* eslint-disable-next-line @next/next/no-img-element -- vendor images can come from any ImgBB URL */}
      <img
        src={image}
        alt={service.serviceName}
        className="size-20 shrink-0 rounded-lg object-cover ring-1 ring-rose-100 dark:ring-input"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="truncate font-medium text-stone-800 dark:text-foreground">
            {service.serviceName}
          </p>
          <ServiceStatusBadge status={service.status} />
        </div>
        <p className="mt-0.5 truncate text-xs text-stone-500 dark:text-muted-foreground">
          {service.category} · {service.location}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-muted-foreground">
          <span className="font-semibold text-[#B76E79] dark:text-champagne-400">
            {formatPrice(service.price)}
          </span>
          <span>Submitted {formatDate(service.createdAt)}</span>
          {service.status === "approved" && !isServiceActive(service) ? (
            <span className="text-amber-600 dark:text-amber-400">
              Hidden from customers
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function AddServiceForm() {
  const { data: session } = useSession()
  const user = session?.user

  const [serviceName, setServiceName] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [location, setLocation] = useState("")
  const [images, setImages] = useState<PickedImage[]>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [myServices, setMyServices] = useState<Service[]>([])
  const [listStatus, setListStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  )
  const [listError, setListError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const imagesRef = useRef<PickedImage[]>([])
  useEffect(() => {
    imagesRef.current = images
  }, [images])
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url))
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const controller = new AbortController()

    fetchVendorServices(user.id, { signal: controller.signal })
      .then((services) => {
        setMyServices(
          [...services].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return bTime - aTime
          })
        )
        setListStatus("ready")
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setListError(
          error instanceof Error
            ? error.message
            : "Could not load your services right now."
        )
        setListStatus("error")
      })

    return () => controller.abort()
  }, [user?.id, reloadKey])

  const isPremium = user?.subscriptionPlan === "premium"
  const activeCount = useMemo(
    () =>
      myServices.filter(
        (service) =>
          service.status === "approved" && isServiceActive(service)
      ).length,
    [myServices]
  )
  const pendingCount = useMemo(
    () => myServices.filter((service) => service.status === "pending").length,
    [myServices]
  )
  const limitReached =
    listStatus === "ready" && !isPremium && activeCount >= FREE_ACTIVE_LIMIT
  const usagePercent = isPremium
    ? 100
    : Math.min(100, (activeCount / FREE_ACTIVE_LIMIT) * 100)

  function pickImages(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (selected.length === 0) return

    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      toast.error(`You can upload up to ${MAX_IMAGES} images.`)
      return
    }

    const accepted: PickedImage[] = []
    for (const file of selected.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file.`)
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name} is larger than 5 MB.`)
        continue
      }
      accepted.push({ file, url: URL.createObjectURL(file) })
    }

    if (selected.length > remaining) {
      toast.error(`Only ${MAX_IMAGES} images are allowed per service.`)
    }

    if (accepted.length > 0) {
      setImages((current) => [...current, ...accepted])
      setFieldErrors((errors) => ({ ...errors, images: null }))
    }
  }

  function removeImage(url: string) {
    URL.revokeObjectURL(url)
    setImages((current) => current.filter((image) => image.url !== url))
  }

  function retryLoadingServices() {
    setListStatus("loading")
    setListError(null)
    setReloadKey((key) => key + 1)
  }

  function resetForm() {
    setServiceName("")
    setCategory("")
    setDescription("")
    setPrice("")
    setLocation("")
    setFieldErrors({})
    images.forEach((image) => URL.revokeObjectURL(image.url))
    setImages([])
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const errors = validate({
      serviceName,
      category,
      description,
      price,
      location,
      imageCount: images.length,
    })
    setFieldErrors(errors)

    if (Object.values(errors).some(Boolean)) {
      toast.error("Please fix the highlighted fields.")
      return
    }

    if (!user?.id) {
      toast.error("Your session expired. Please sign in again.")
      return
    }

    if (limitReached) {
      toast.error(
        "Your free plan has reached its 3 active services limit. Upgrade to Premium to publish more."
      )
      return
    }

    submittingRef.current = true
    setSubmitting(true)

    try {
      const imageUrls = await Promise.all(
        images.map((image) => uploadToImgbb(image.file))
      )

      const created = await createService({
        serviceName: serviceName.trim(),
        category,
        description: description.trim(),
        price: Number(price),
        location: location.trim(),
        images: imageUrls,
        status: "pending",
        availability: "active",
        createdAt: new Date().toISOString(),
      })

      toast.success(
        "Service submitted — it will appear publicly once an admin approves it."
      )
      setMyServices((current) => [created, ...current])
      resetForm()
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not submit the service. Please try again."
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B76E79] uppercase dark:text-[#B76E79]">
          Vendor studio
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-balance text-stone-900 sm:text-3xl dark:text-foreground">
          Add a new{" "}
          <span className="text-[#B76E79] italic dark:text-[#B76E79]">
            service
          </span>
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-muted-foreground">
          Publish photography, venues, décor, catering and more. New services
          stay pending until an admin approves them.
        </p>
      </header>

      {/* Plan usage */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-rose-200/70 bg-gradient-to-r from-rose-50 via-[#FDFBF7] to-champagne-100/40 p-4 shadow-xs dark:border-input dark:from-input/30 dark:via-input/10 dark:to-input/20 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#B76E79] shadow-xs ring-1 ring-rose-100 dark:bg-input/40 dark:text-champagne-400 dark:ring-input">
              {isPremium ? (
                <Crown className="size-5" />
              ) : (
                <Sparkles className="size-5" />
              )}
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold text-stone-800 dark:text-foreground">
                {isPremium ? "Premium plan" : "Free plan"}
                <Badge
                  variant="outline"
                  className="border-rose-200 bg-white/70 text-[10px] tracking-wide text-[#9F5863] uppercase dark:border-input dark:bg-input/30 dark:text-champagne-400"
                >
                  {isPremium ? "Unlimited" : `${activeCount}/${FREE_ACTIVE_LIMIT} active`}
                </Badge>
              </p>
              <p className="mt-0.5 text-xs text-stone-600 dark:text-muted-foreground">
                {isPremium
                  ? "Publish as many active services as you like."
                  : "Free vendors can publish up to 3 active services."}
                {pendingCount > 0
                  ? ` ${pendingCount} service${pendingCount === 1 ? "" : "s"} awaiting review.`
                  : ""}
              </p>
            </div>
          </div>

          {!isPremium ? (
            <Button
              render={<Link href="/vendor/subscription" />}
              className={cn(
                "h-9 shrink-0 gap-1.5 rounded-full bg-[#B76E79] text-[#fffdf8] hover:bg-[#a25c67]",
                focusRingClassName
              )}
            >
              <Crown className="size-4" />
              Upgrade to Premium
            </Button>
          ) : null}
        </div>

        {!isPremium ? (
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-100/90 dark:bg-input/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#B76E79] to-champagne-400 transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {limitReached ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            You have reached the free plan limit of {FREE_ACTIVE_LIMIT} active
            services. Upgrade to Premium to publish more, or update your
            existing services instead.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-white/90 shadow-xs ring-rose-200/70 dark:bg-card/80 dark:ring-input">
            <CardHeader className="border-b border-rose-100 dark:border-input">
              <CardTitle className="flex items-center gap-2 font-heading text-xl font-semibold">
                <span className="flex size-8 items-center justify-center rounded-lg bg-rose-100/80 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
                  <Tag className="size-4" />
                </span>
                Service details
              </CardTitle>
              <CardDescription>
                All fields are required. Your service will be reviewed before
                it goes live.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
                aria-busy={submitting}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="serviceName">Service name</Label>
                    <Input
                      id="serviceName"
                      value={serviceName}
                      onChange={(event) => setServiceName(event.target.value)}
                      placeholder="e.g. Sunset Rooftop Wedding Photography"
                      autoComplete="off"
                      aria-invalid={Boolean(fieldErrors.serviceName)}
                      className={controlClassName}
                      disabled={submitting}
                    />
                    {fieldErrors.serviceName ? (
                      <p className="text-xs text-destructive">
                        {fieldErrors.serviceName}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="serviceCategory">Category</Label>
                    <Select
                      value={category || null}
                      onValueChange={(value) => {
                        setCategory(typeof value === "string" ? value : "")
                        setFieldErrors((errors) => ({
                          ...errors,
                          category: null,
                        }))
                      }}
                      disabled={submitting}
                    >
                      <SelectTrigger
                        id="serviceCategory"
                        aria-invalid={Boolean(fieldErrors.category)}
                        className={cn(
                          controlClassName,
                          "w-full justify-between px-3 data-[size=default]:h-10"
                        )}
                      >
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map((item) => (
                          <SelectItem key={item.name} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.category ? (
                      <p className="text-xs text-destructive">
                        {fieldErrors.category}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="servicePrice">Starting price (USD)</Label>
                    <div className="relative">
                      <Wallet className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="servicePrice"
                        type="number"
                        inputMode="decimal"
                        min={1}
                        step={1}
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        placeholder="1500"
                        aria-invalid={Boolean(fieldErrors.price)}
                        className={cn(controlClassName, "pl-9")}
                        disabled={submitting}
                      />
                    </div>
                    {fieldErrors.price ? (
                      <p className="text-xs text-destructive">
                        {fieldErrors.price}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="serviceLocation">Location</Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="serviceLocation"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="e.g. Dhaka, Bangladesh"
                        autoComplete="address-level2"
                        aria-invalid={Boolean(fieldErrors.location)}
                        className={cn(controlClassName, "pl-9")}
                        disabled={submitting}
                      />
                    </div>
                    {fieldErrors.location ? (
                      <p className="text-xs text-destructive">
                        {fieldErrors.location}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="serviceDescription">Description</Label>
                      <span className="text-xs text-muted-foreground">
                        {description.length}/1200
                      </span>
                    </div>
                    <Textarea
                      id="serviceDescription"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe what is included, your experience, package highlights and anything couples should know."
                      rows={5}
                      maxLength={1200}
                      aria-invalid={Boolean(fieldErrors.description)}
                      className={cn(controlClassName, "h-auto min-h-28 py-2.5")}
                      disabled={submitting}
                    />
                    {fieldErrors.description ? (
                      <p className="text-xs text-destructive">
                        {fieldErrors.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="serviceImages">Service images</Label>
                    <span className="text-xs text-muted-foreground">
                      {images.length}/{MAX_IMAGES}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {images.map((image) => (
                      <div
                        key={image.url}
                        className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-rose-100 dark:ring-input"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                        <img
                          src={image.url}
                          alt={image.file.name}
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.url)}
                          aria-label={`Remove ${image.file.name}`}
                          className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-rose-700 shadow-sm transition-colors outline-none hover:bg-rose-600 hover:text-white focus-visible:ring-2 focus-visible:ring-[#B76E79] dark:bg-input/80 dark:text-rose-300"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}

                    {images.length < MAX_IMAGES ? (
                      <label
                        htmlFor="serviceImages"
                        className={cn(
                          "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-rose-300/80 bg-rose-50/40 text-center text-[11px] font-medium text-[#9F5863] transition-colors hover:border-[#B76E79] hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:text-champagne-400",
                          focusRingClassName,
                          submitting && "pointer-events-none opacity-60"
                        )}
                      >
                        <ImagePlus className="size-5" />
                        Add image
                      </label>
                    ) : null}
                  </div>

                  <input
                    ref={fileInputRef}
                    id="serviceImages"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={pickImages}
                    className="sr-only"
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload up to {MAX_IMAGES} photos (PNG, JPG or WebP, max 5 MB
                    each). Images are hosted on ImgBB.
                  </p>
                  {fieldErrors.images ? (
                    <p className="text-xs text-destructive">
                      {fieldErrors.images}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-rose-100 pt-4 dark:border-input sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    <ShieldCheck className="mr-1 inline size-3.5 text-[#B76E79] dark:text-champagne-400" />
                    Reviewed by the WedPlan team before publishing.
                  </p>
                  <Button
                    type="submit"
                    disabled={submitting || limitReached}
                    className={cn(
                      "h-10 gap-2 bg-[#B76E79] px-5 text-[#fffdf8] hover:bg-[#a25c67]",
                      focusRingClassName
                    )}
                  >
                    {submitting ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <ImagePlus className="size-4" />
                    )}
                    {submitting ? "Uploading & submitting…" : "Submit Service"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Guidance */}
        <aside className="space-y-4">
          <Card className="bg-white/90 ring-rose-200/70 dark:bg-card/80 dark:ring-input">
            <CardHeader>
              <CardTitle className="font-heading text-lg">What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                {
                  title: "Submit for review",
                  description:
                    "Your service is saved with a pending status and stays private.",
                  icon: Clock,
                },
                {
                  title: "Admin review",
                  description:
                    "Our team checks the details and images for quality.",
                  icon: ShieldCheck,
                },
                {
                  title: "Go live",
                  description:
                    "Approved services appear on Browse Services for couples.",
                  icon: Sparkles,
                },
              ].map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-100/80 text-xs font-semibold text-[#9F5863] dark:bg-input/40 dark:text-champagne-400">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-stone-800 dark:text-foreground">
                      {step.title}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-champagne-100/30 ring-champagne-200/70 dark:bg-input/20 dark:ring-input">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <Sparkles className="size-4 text-champagne-600 dark:text-champagne-400" />
                Tips for approval
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-stone-600 dark:text-muted-foreground">
              <p>• Use bright, high-resolution photos of your actual work.</p>
              <p>• Be specific about what your package includes.</p>
              <p>• Keep pricing honest and mention any add-on costs.</p>
              <p>• Double-check your city and service area.</p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Submitted services */}
      <section className="mt-8" aria-labelledby="submitted-services-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="submitted-services-heading"
              className="font-heading text-xl font-semibold text-stone-900 dark:text-foreground"
            >
              Your submitted services
            </h2>
            <p className="text-xs text-stone-500 dark:text-muted-foreground">
              Track approval status and availability at a glance.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/vendor/my-services" />}
            className="gap-1.5 rounded-full border-rose-200 text-stone-700 hover:bg-rose-50 dark:border-input dark:text-foreground"
          >
            Manage services
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {listStatus === "loading" ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-28 w-full rounded-xl bg-rose-100/60 dark:bg-input/30"
              />
            ))}
          </div>
        ) : listStatus === "error" ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200/70 bg-white/80 p-8 text-center dark:border-input dark:bg-input/10">
            <CloudOff className="size-7 text-[#B76E79]" />
            <p className="text-sm text-stone-600 dark:text-muted-foreground">
              {listError ?? "Could not load your services."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={retryLoadingServices}
              className="gap-1.5 rounded-full border-rose-200 hover:bg-rose-50 dark:border-input"
            >
              <RotateCcw className="size-3.5" />
              Try again
            </Button>
          </div>
        ) : myServices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rose-200/80 bg-white/60 p-8 text-center dark:border-input dark:bg-input/10">
            <p className="text-sm font-medium text-stone-700 dark:text-foreground">
              No services yet
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-muted-foreground">
              Use the form above to add your first wedding service.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myServices.map((service) => (
              <SubmittedServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
