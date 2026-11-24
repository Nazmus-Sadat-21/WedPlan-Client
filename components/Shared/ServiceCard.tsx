"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import {
  ArrowUpRight,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_IMAGES, API_ENDPOINTS } from "@/lib/constants"
import { formatPrice, getUserInitials } from "@/lib/format"
import { springSoft } from "@/lib/motion"
import type { Service, Vendor } from "@/lib/types"
import { cn } from "@/lib/utils"

type ServiceCardProps = {
  service: Service
  className?: string
  /** Set on the first cards above the fold for faster LCP. */
  priority?: boolean
}

export function ServiceCard({
  service,
  className,
  priority,
}: ServiceCardProps) {
  const reduceMotion = useReducedMotion()
  const [vendorData, setVendorData] = useState<Vendor | null>(() => {
    const raw = service.vendor ?? service.vendorId
    if (raw && typeof raw === "object" && "name" in raw) {
      return raw as Vendor
    }
    return null
  })

  useEffect(() => {
    const raw = service.vendor ?? service.vendorId
    let vendorId: string | null = null

    if (typeof raw === "string") {
      vendorId = raw
    } else if (raw && typeof raw === "object" && "_id" in raw) {
      vendorId = String(raw._id)
    }

    if (vendorId && !vendorData) {
      const vendorLookupId = vendorId
      let isMounted = true
      async function fetchVendor() {
        try {
          const res = await fetch(API_ENDPOINTS.publicVendor(vendorLookupId), {
            cache: "no-store",
          })
          if (res.ok) {
            const json = await res.json()
            const resolved = json?.data ?? json
            if (isMounted && resolved) {
              setVendorData(resolved)
            }
          }
        } catch {
          // Fall back gracefully if request fails
        }
      }
      fetchVendor()
      return () => {
        isMounted = false
      }
    }
  }, [service.vendor, service.vendorId, vendorData])

  const vendorName = vendorData?.name ?? "Verified WedPlan Partner"
  const vendorImage = vendorData?.image ?? undefined

  const images = Array.isArray(service.images) ? service.images : []
  const imageUrl =
    images[0] ??
    CATEGORY_IMAGES[service.category] ??
    CATEGORY_IMAGES["Photography & Videography"]

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -8 }}
      transition={springSoft}
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-3xl border border-rose-200/75 bg-white shadow-sm transition-[border-color,box-shadow] duration-500 ease-out hover:border-[#B76E79]/50 hover:shadow-2xl hover:shadow-rose-950/10 dark:border-border dark:bg-card dark:hover:shadow-black/30",
        className
      )}
    >
      <Link
        href={`/browse-services/${service._id}`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B76E79]/40"
      >
        {/* Editorial Image Showcase */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-rose-50 dark:bg-rose-400/10">
          <Image
            src={imageUrl}
            alt={service.serviceName}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
          />

          {/* Subtle Atmospheric Gradient Vignette for crisp badge readability */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/55 via-stone-950/10 to-transparent opacity-80 transition-opacity duration-500 group-hover/card:opacity-90"
          />

          {/* Top Row: Frosted Category Pill & Photo Count */}
          <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between gap-2">
            <Badge className="pointer-events-none rounded-full border border-white/60 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#9F5863] shadow-sm backdrop-blur-md dark:bg-card/90 dark:text-rose-300">
              {service.category}
            </Badge>

            {images.length > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-stone-950/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                <SparklesIcon className="size-3 text-rose-300" />
                {images.length} photos
              </span>
            )}
          </div>

          {/* Bottom Row: Floating Price Tag & Quick Action Arrow */}
          <div className="absolute inset-x-3.5 bottom-3.5 flex items-end justify-between gap-2">
            <div className="rounded-2xl border border-white/70 bg-white/95 px-3.5 py-1.5 shadow-md backdrop-blur-md dark:bg-card/95">
              <span className="block text-[9px] font-semibold tracking-wider text-stone-400 uppercase dark:text-muted-foreground/80">
                Starting at
              </span>
              <span className="font-heading text-base font-bold text-stone-900 dark:text-foreground">
                {formatPrice(service.price)}
              </span>
            </div>

            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-full border border-white/40 bg-white/90 text-[#B76E79] shadow-md backdrop-blur-md transition-all duration-300 group-hover/card:scale-110 group-hover/card:bg-[#B76E79] group-hover/card:text-white dark:bg-card/90"
            >
              <ArrowUpRight className="size-4.5 transition-transform duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" />
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div className="space-y-2">
            <h3 className="line-clamp-1 font-heading text-xl leading-snug font-semibold text-stone-900 transition-colors duration-200 group-hover/card:text-[#9F5863] dark:text-foreground">
              {service.serviceName}
            </h3>

            <p className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-muted-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#B76E79] dark:bg-rose-400/10">
                <MapPinIcon className="size-3" />
              </span>
              <span className="truncate">{service.location}</span>
            </p>

            {service.description ? (
              <p className="line-clamp-2 pt-0.5 text-xs leading-relaxed text-stone-500/90 dark:text-muted-foreground">
                {service.description}
              </p>
            ) : null}
          </div>

          {/* Vendor Footer Bar */}
          <div className="flex items-center justify-between gap-3 border-t border-rose-100/90 pt-3.5 dark:border-border">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar className="size-8.5 shrink-0 ring-2 ring-rose-100 transition-all duration-300 group-hover/card:ring-[#B76E79]/40 dark:ring-border">
                {vendorImage ? (
                  <AvatarImage
                    src={vendorImage}
                    alt={vendorName}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-rose-100 to-rose-200/70 text-xs font-semibold text-[#9F5863] dark:from-rose-400/15 dark:to-rose-400/20 dark:text-rose-300">
                  {getUserInitials(vendorName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-800 dark:text-foreground">
                  {vendorName}
                </p>
                <p className="flex items-center gap-1 text-[11px] font-medium text-[#9F5863] dark:text-rose-300">
                  <ShieldCheckIcon className="size-3 shrink-0 text-[#B76E79]" />
                  <span>Verified Vendor</span>
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-rose-50/90 px-3 py-1 text-xs font-semibold text-[#9F5863] transition-colors duration-300 group-hover/card:bg-[#B76E79] group-hover/card:text-white dark:bg-rose-400/10 dark:text-rose-300">
              Explore
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
