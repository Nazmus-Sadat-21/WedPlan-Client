"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarHeart,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquare,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "@/lib/auth-client"
import { isPublicService } from "@/lib/api"
import { CATEGORY_IMAGES } from "@/lib/constants"
import { formatPrice, getUserInitials } from "@/lib/format"
import type { Service, Vendor } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function BrowseServiceDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: sessionData, isPending: sessionLoading } = useSession()
  const user = sessionData?.user

  const [service, setService] = useState<Service | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Gallery state
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Booking form state
  const [eventDate, setEventDate] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [message, setMessage] = useState("")
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookedSuccess, setBookedSuccess] = useState(false)

  useEffect(() => {
    if (!params?.id) return

    let isMounted = true
    async function fetchServiceAndVendor() {
      setLoading(true)
      setError(null)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_API ?? ""
        const res = await fetch(`${baseUrl}/services/${params.id}`, {
          cache: "no-store",
        })

        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "This wedding service could not be found."
              : "Failed to load service details."
          )
        }

        const json = await res.json()
        const resolvedService: Service = json?.data ?? json

        // Pending, rejected, paused or inactive services stay hidden from the
        // public details page, not just the browse listing.
        if (!resolvedService || !isPublicService(resolvedService)) {
          throw new Error("This wedding service is not available right now.")
        }

        if (isMounted) {
          setService(resolvedService)
        }

        // Extract vendor identifier or object from service
        const rawVendor = resolvedService.vendor ?? resolvedService.vendorId
        let vendorIdToFetch: string | null = null

        if (typeof rawVendor === "string") {
          vendorIdToFetch = rawVendor
        } else if (
          rawVendor &&
          typeof rawVendor === "object" &&
          "_id" in rawVendor
        ) {
          vendorIdToFetch = String(rawVendor._id)
        }

        if (vendorIdToFetch) {
          try {
            const vendorRes = await fetch(
              `${baseUrl}/users/${vendorIdToFetch}`,
              {
                cache: "no-store",
              }
            )
            if (vendorRes.ok) {
              const vendorJson = await vendorRes.json()
              const resolvedVendor = vendorJson?.data ?? vendorJson
              if (isMounted && resolvedVendor) {
                setVendor(resolvedVendor)
              }
            }
          } catch {
            // Fallback gracefully if separate user endpoint call fails
            if (
              isMounted &&
              typeof rawVendor === "object" &&
              rawVendor !== null
            ) {
              setVendor(rawVendor as Vendor)
            }
          }
        } else if (rawVendor && typeof rawVendor === "object") {
          if (isMounted) {
            setVendor(rawVendor as Vendor)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load service details right now."
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchServiceAndVendor()
    return () => {
      isMounted = false
    }
  }, [params?.id])

  // Loading State Skeleton
  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] py-10">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-9 w-44 rounded-full bg-rose-100/70" />
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <Skeleton className="aspect-[16/10] w-full rounded-3xl bg-rose-100/60" />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton
                    key={n}
                    className="aspect-[4/3] rounded-2xl bg-rose-100/60"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-6 lg:col-span-5">
              <Skeleton className="h-96 w-full rounded-3xl bg-rose-100/60" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Error / Not Found State
  if (error || !service) {
    return (
      <main className="flex min-h-[70svh] flex-col items-center justify-center bg-[#FDFBF7] px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="max-w-md space-y-5 rounded-3xl border border-rose-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-50 text-[#B76E79]">
            <Sparkles className="size-6" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-stone-900">
            Service Unavailable
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            {error ??
              "The wedding service you are looking for may have been removed or is temporarily unavailable."}
          </p>
          <Button
            render={<Link href="/browse-services" />}
            className="rounded-full bg-[#B76E79] px-6 text-white hover:bg-[#a25c67]"
          >
            Back to Browse Services
          </Button>
        </div>
      </main>
    )
  }

  // Resolve multiple images with safe fallback
  const rawImages = Array.isArray(service.images)
    ? service.images.filter(Boolean)
    : []
  const fallbackImg =
    CATEGORY_IMAGES[service.category] ??
    CATEGORY_IMAGES["Photography & Videography"]
  const galleryImages = rawImages.length > 0 ? rawImages : [fallbackImg]
  const currentImage = galleryImages[activeImageIdx] ?? galleryImages[0]

  // Resolved vendor details from fetched API data
  const vendorName = vendor?.name ?? "Verified WedPlan Partner"
  const vendorEmail = vendor?.email ?? null
  const vendorImage = vendor?.image ?? undefined

  function handlePrevImage() {
    setActiveImageIdx((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    )
  }

  function handleNextImage() {
    setActiveImageIdx((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    )
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Service link copied to clipboard!")
    } catch {
      toast.error("Could not copy link.")
    }
  }

  async function handleBookingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!service) {
      toast.error("This service is no longer available.")
      return
    }

    if (!user) {
      toast.info("Please sign in as a customer to request a booking.")
      router.push("/sign-in")
      return
    }

    if (user.isBlocked) {
      toast.error(
        "Your account is blocked, so booking requests are unavailable. Contact support for help."
      )
      return
    }

    if (user.role && user.role !== "customer") {
      toast.error("Only customer accounts can submit service bookings.")
      return
    }

    if (!user.id) {
      toast.error("We could not verify your account. Please sign in again.")
      return
    }

    if (!eventDate) {
      toast.error("Please select your wedding or event date.")
      return
    }

    if (!eventLocation.trim()) {
      toast.error("Please share where the event will take place.")
      return
    }

    setBookingSubmitting(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_API ?? ""
      const response = await fetch(`${baseUrl}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          serviceId: service._id,
          customerId: user.id,
          eventDate,
          eventLocation: eventLocation.trim(),
          message: message.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(
          errData?.message ?? "Could not submit your booking request."
        )
      }

      setBookedSuccess(true)
      toast.success("Booking request sent to the vendor!")
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong while booking."
      )
    } finally {
      setBookingSubmitting(false)
    }
  }

  // Minimum selectable date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDateStr = tomorrow.toISOString().split("T")[0]

  return (
    <main className="min-h-screen bg-[#FDFBF7] pb-24">
      {/* Top Breadcrumb & Action Bar */}
      <div className="border-b border-rose-200/60 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/browse-services"
            className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white px-4 py-1.5 text-xs font-medium text-stone-700 shadow-2xs transition-all hover:border-[#B76E79] hover:bg-rose-50/70 hover:text-[#9F5863]"
          >
            <ArrowLeft className="size-3.5 text-[#B76E79]" />
            Back to Browse Services
          </Link>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 rounded-full border-rose-200/80 bg-white text-xs text-stone-700 hover:border-rose-300 hover:bg-rose-50"
            >
              <Share2 className="size-3.5 text-[#B76E79]" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        {/* Service Header Info */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge className="rounded-full border border-rose-200 bg-rose-50/90 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#9F5863] uppercase">
              {service.category}
            </Badge>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Verified Listing
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
                {service.serviceName}
              </h1>
              <p className="mt-2.5 flex items-center gap-2 text-sm text-stone-600 sm:text-base">
                <MapPin className="size-4 shrink-0 text-[#B76E79]" />
                <span>{service.location}</span>
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-rose-200/80 bg-white px-5 py-3 shadow-2xs md:text-right">
              <p className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                Starting Package
              </p>
              <p className="font-heading text-2xl font-bold text-[#9F5863] sm:text-3xl">
                {formatPrice(service.price)}
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Editorial Grid */}
        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* LEFT COLUMN (7 cols): Multi-Image Gallery, Description & Vendor Card */}
          <div className="space-y-8 lg:col-span-7">
            {/* Primary Showcase Image */}
            <div className="space-y-3.5">
              <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-rose-200/80 bg-rose-50 shadow-md">
                <Image
                  src={currentImage}
                  alt={`${service.serviceName} - Photo ${activeImageIdx + 1}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  onClick={() => setLightboxOpen(true)}
                  className="cursor-zoom-in object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />

                {/* Image Counter Pill */}
                <div className="absolute right-4 bottom-4 rounded-full border border-white/30 bg-stone-950/65 px-3.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                  {activeImageIdx + 1} / {galleryImages.length}
                </div>

                {/* Prev / Next Controls if multiple images exist */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous image"
                      className="absolute top-1/2 left-3.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/85 text-stone-800 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next image"
                      className="absolute top-1/2 right-3.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/85 text-stone-800 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip for Multiple Service Images */}
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 sm:gap-3">
                  {galleryImages.map((imgUrl, idx) => {
                    const isSelected = idx === activeImageIdx
                    return (
                      <button
                        key={`${imgUrl}-${idx}`}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={cn(
                          "relative aspect-[4/3] overflow-hidden rounded-2xl border-2 transition-all duration-200",
                          isSelected
                            ? "border-[#B76E79] shadow-sm ring-2 ring-[#B76E79]/30"
                            : "border-transparent opacity-70 hover:opacity-100"
                        )}
                      >
                        <Image
                          src={imgUrl}
                          alt={`${service.serviceName} thumbnail ${idx + 1}`}
                          fill
                          sizes="(min-width: 640px) 15vw, 25vw"
                          className="object-cover"
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Service Highlights Section (Replaced generic bullet points) */}
            <section className="rounded-3xl border border-rose-200/75 bg-white p-6 shadow-2xs sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="size-4 text-[#B76E79]" />
                <h2 className="font-heading text-2xl font-semibold text-stone-900">
                  Service Highlights &amp; Inclusions
                </h2>
              </div>

              <div className="prose prose-stone max-w-none text-sm leading-relaxed whitespace-pre-line text-stone-600 sm:text-base">
                {service.description ||
                  "Tailored wedding service crafted with meticulous attention to detail to make your celebration unforgettable."}
              </div>

              {/* Curated Wedding Feature Pills */}
              <div className="mt-7 grid gap-4 border-t border-rose-100 pt-6 sm:grid-cols-3">
                <div className="flex items-start gap-3 rounded-2xl bg-[#FDFBF7] p-3.5 ring-1 ring-rose-100">
                  <CalendarHeart className="mt-0.5 size-5 shrink-0 text-[#B76E79]" />
                  <div>
                    <p className="text-xs font-semibold text-stone-800">
                      Tailored Planning
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Customized to your vision
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-[#FDFBF7] p-3.5 ring-1 ring-rose-100">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#B76E79]" />
                  <div>
                    <p className="text-xs font-semibold text-stone-800">
                      Secure Booking
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Direct vendor confirmation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-[#FDFBF7] p-3.5 ring-1 ring-rose-100">
                  <Clock className="mt-0.5 size-5 shrink-0 text-[#B76E79]" />
                  <div>
                    <p className="text-xs font-semibold text-stone-800">
                      Priority Support
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Dedicated wedding concierge
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Vendor Information Card (Fetched live from /users/:id) */}
            <section className="rounded-3xl border border-rose-200/75 bg-gradient-to-br from-white via-white to-rose-50/40 p-6 shadow-2xs sm:p-8">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#B76E79] uppercase">
                Hosted &amp; Managed By
              </p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-stone-900">
                Vendor Information
              </h2>

              <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 shadow-xs ring-2 ring-rose-200">
                    {vendorImage ? (
                      <AvatarImage
                        src={vendorImage}
                        alt={vendorName}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#B76E79] to-[#C58970] text-lg font-semibold text-white">
                      {getUserInitials(vendorName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-xl font-semibold text-stone-900">
                        {vendorName}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#9F5863]">
                        <ShieldCheck className="size-3 text-[#B76E79]" />
                        Verified Vendor
                      </span>
                    </div>

                    {vendorEmail ? (
                      <p className="flex items-center gap-1.5 text-sm text-stone-500">
                        <Mail className="size-3.5 text-[#B76E79]" />
                        <span>{vendorEmail}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-stone-500">
                        Official WedPlan Partner in {service.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500 sm:text-right">
                  <span className="rounded-xl border border-rose-200/70 bg-white px-3.5 py-2 font-medium text-stone-700">
                    Category: {service.category}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (5 cols): Sticky Luxury Booking Card */}
          <aside className="lg:sticky lg:top-24 lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-rose-200/90 bg-white shadow-xl shadow-rose-950/5">
              {/* Top Rose-Gold Accent Header */}
              <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50/90 via-[#FDFBF7] to-amber-50/40 px-6 py-5 sm:px-7">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold tracking-wider text-[#9F5863] uppercase">
                      Reserve This Service
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-heading text-3xl font-bold text-stone-900">
                        {formatPrice(service.price)}
                      </span>
                      <span className="text-xs text-stone-500">
                        / full package
                      </span>
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-full bg-white text-[#B76E79] shadow-2xs ring-1 ring-rose-200/70">
                    <Heart className="size-5 fill-rose-100" />
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7">
                {bookedSuccess ? (
                  <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-stone-900">
                      Booking Request Sent!
                    </h3>
                    <p className="text-sm leading-relaxed text-stone-600">
                      Your request for{" "}
                      <span className="font-medium text-stone-800">
                        {service.serviceName}
                      </span>{" "}
                      on <span className="font-medium">{eventDate}</span> has
                      been submitted to {vendorName}.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        render={<Link href="/customer/my-bookings" />}
                        className="w-full rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
                      >
                        View My Bookings
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setBookedSuccess(false)
                          setEventDate("")
                          setEventLocation("")
                          setMessage("")
                        }}
                        className="w-full rounded-full text-xs text-stone-600 hover:bg-rose-50"
                      >
                        Request Another Date
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {/* Event Date Input */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="eventDate"
                        className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-stone-700 uppercase"
                      >
                        <CalendarHeart className="size-3.5 text-[#B76E79]" />
                        Wedding / Event Date *
                      </Label>
                      <Input
                        id="eventDate"
                        type="date"
                        min={minDateStr}
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="h-11 rounded-xl border-rose-200/90 bg-[#FDFBF7]/60 text-stone-800 focus-visible:border-[#B76E79] focus-visible:ring-[#B76E79]/25"
                      />
                    </div>

                    {/* Event Location Input */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="eventLocation"
                        className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-stone-700 uppercase"
                      >
                        <MapPin className="size-3.5 text-[#B76E79]" />
                        Event Location *
                      </Label>
                      <Input
                        id="eventLocation"
                        type="text"
                        required
                        placeholder="e.g. Rosewood Lakeside, Dhaka"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="h-11 rounded-xl border-rose-200/90 bg-[#FDFBF7]/60 text-stone-800 focus-visible:border-[#B76E79] focus-visible:ring-[#B76E79]/25"
                      />
                    </div>

                    {/* Message for Vendor */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="message"
                        className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-stone-700 uppercase"
                      >
                        <MessageSquare className="size-3.5 text-[#B76E79]" />
                        Message for Vendor (Optional)
                      </Label>
                      <Textarea
                        id="message"
                        rows={3}
                        placeholder="Tell the vendor about your guest count, theme or any special requests..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="resize-none rounded-xl border-rose-200/90 bg-[#FDFBF7]/60 text-sm text-stone-800 focus-visible:border-[#B76E79] focus-visible:ring-[#B76E79]/25"
                      />
                    </div>

                    {/* Price Breakdown Summary */}
                    <div className="space-y-2 rounded-2xl border border-rose-100 bg-[#FDFBF7] p-4 text-sm">
                      <div className="flex items-center justify-between text-stone-600">
                        <span>Service Package</span>
                        <span className="font-medium text-stone-800">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600">
                        <span>WedPlan Booking Fee</span>
                        <span className="font-medium text-emerald-700">
                          Free
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-rose-200/60 pt-2 text-base font-semibold text-stone-900">
                        <span>Estimated Total</span>
                        <span className="text-[#9F5863]">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    </div>

                    {/* Role-aware CTA Button */}
                    {!sessionLoading && !user ? (
                      <div className="space-y-2.5 pt-1">
                        <Button
                          type="button"
                          render={<Link href="/sign-in" />}
                          className="h-12 w-full rounded-full bg-[#B76E79] text-base font-medium text-white shadow-md shadow-rose-900/10 hover:bg-[#a25c67]"
                        >
                          Sign In to Book Service
                        </Button>
                        <p className="text-center text-xs text-stone-500">
                          You won&apos;t be charged until the vendor confirms
                          availability.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1">
                        <Button
                          type="submit"
                          disabled={bookingSubmitting}
                          className="h-12 w-full gap-2 rounded-full bg-[#B76E79] text-base font-medium text-white shadow-md shadow-rose-900/10 transition-all hover:bg-[#a25c67] hover:shadow-lg"
                        >
                          {bookingSubmitting ? (
                            <>
                              <LoaderCircle className="size-4 animate-spin" />
                              Sending Request…
                            </>
                          ) : (
                            <>
                              <CalendarHeart className="size-4" />
                              Request Booking
                            </>
                          )}
                        </Button>
                        <p className="text-center text-xs text-stone-500">
                          Direct request sent to{" "}
                          <span className="font-medium text-stone-700">
                            {vendorName}
                          </span>
                          .
                        </p>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal for Gallery Inspection */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-4 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close fullscreen gallery"
            className="absolute top-5 right-5 z-10 flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <X className="size-5" />
          </button>

          <div
            className="relative aspect-[16/10] w-full max-w-5xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage}
              alt={service.serviceName}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevImage()
                }}
                aria-label="Previous image"
                className="absolute left-4 flex size-12 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNextImage()
                }}
                aria-label="Next image"
                className="absolute right-4 flex size-12 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>
      )}
    </main>
  )
}
