import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MapPinIcon, ShieldCheckIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_IMAGES } from "@/lib/constants"
import { formatPrice, getUserInitials } from "@/lib/format"
import type { Service, Vendor } from "@/lib/types"
import { cn } from "@/lib/utils"

type ServiceCardProps = {
  service: Service
  className?: string
  /** Set on the first cards above the fold for faster LCP. */
  priority?: boolean
}

function resolveVendor(service: Service): Vendor | null {
  const vendor = service.vendor ?? service.vendorId
  if (!vendor || typeof vendor === "string") return null
  if (typeof vendor === "object" && "name" in vendor) return vendor as Vendor
  return null
}

export function ServiceCard({
  service,
  className,
  priority,
}: ServiceCardProps) {
  const vendor = resolveVendor(service)
  const vendorName = vendor?.name ?? "Verified WedPlan vendor"
  const vendorImage = vendor?.image ?? undefined

  const images = Array.isArray(service.images) ? service.images : []
  const imageUrl =
    images[0] ??
    CATEGORY_IMAGES[service.category] ??
    CATEGORY_IMAGES["Photography & Videography"]

  return (
    <div
      className={cn(
        "group/card flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-champagne-500/40",
        className
      )}
    >
      <Link
        href={`/services/${service._id}`}
        className="flex h-full flex-col focus-visible:outline-none"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={service.serviceName}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover/card:scale-105"
          />
          <Badge className="pointer-events-none absolute top-3 left-3 border-border/40 bg-background/90 text-foreground shadow-xs backdrop-blur-sm">
            {service.category}
          </Badge>
          <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-sm font-semibold text-foreground shadow-xs backdrop-blur-sm">
            {formatPrice(service.price)}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-1">
            <h3 className="font-heading text-lg leading-snug font-semibold text-foreground">
              {service.serviceName}
            </h3>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPinIcon className="size-3.5 shrink-0 text-champagne-600" />
              <span className="truncate">{service.location}</span>
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="size-7">
                {vendorImage ? (
                  <AvatarImage src={vendorImage} alt={vendorName} />
                ) : null}
                <AvatarFallback className="bg-champagne-500/15 text-xs text-champagne-700">
                  {getUserInitials(vendorName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {vendorName}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheckIcon className="size-3 text-champagne-600" />
                  Verified vendor
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-champagne-700 transition-all group-hover/card:gap-2">
              View Details
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}
