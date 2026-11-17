import Link from "next/link"
import { Heart } from "lucide-react"

import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="WedPlan home"
      className={cn("flex items-center gap-2", className)}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-champagne-400 to-champagne-600 text-white shadow-xs">
        <Heart className="size-4.5 fill-current" />
      </span>
      <span className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        Wed<span className="text-champagne-600 italic">Plan</span>
      </span>
    </Link>
  )
}
