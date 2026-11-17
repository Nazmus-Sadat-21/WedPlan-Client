import type { Metadata } from "next"

export const metadata: Metadata = { title: "Vendor Overview" }

/** Full-page skeleton shown while the dashboard session and stats resolve. */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-64 rounded-lg bg-rose-100/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-rose-200/70 bg-white p-5 dark:border-input dark:bg-input/20"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-rose-100/80" />
              <div className="size-9 rounded-xl bg-rose-100/80" />
            </div>
            <div className="mt-4 h-8 w-16 rounded bg-rose-100/80" />
          </div>
        ))}
      </div>
      <div className="h-40 rounded-2xl border border-rose-200/70 bg-white/60 dark:border-input dark:bg-input/10" />
    </div>
  )
}
