import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  className?: string
}

/** Dashboard statistics card (rose theme, consistent with the site UI). */
export function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-200/70 bg-white p-5 shadow-xs shadow-rose-950/5 transition-shadow hover:shadow-md hover:shadow-rose-950/5 dark:border-input dark:bg-input/20",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-muted-foreground">
          {label}
        </p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100/80 text-[#B76E79] dark:bg-input/40">
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold text-stone-900 dark:text-foreground">
        {value}
      </p>
    </div>
  )
}
