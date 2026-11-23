import Link from "next/link"
import { Compass, Home, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70svh] w-full max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-[#B76E79] dark:border-rose-500/30 dark:bg-rose-500/10">
        <SearchX className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-[#B76E79] uppercase">
        404
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold text-stone-900 dark:text-foreground">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-2 max-w-md text-sm text-pretty text-stone-600 dark:text-muted-foreground">
        The link may be broken, or the page may have moved. Check the address or
        head back to the parts of WedPlan that still work.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button className="h-11 rounded-full px-6" render={<Link href="/" />}>
          <Home className="size-4" aria-hidden="true" />
          Back to home
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full px-6"
          render={<Link href="/browse-services" />}
        >
          <Compass className="size-4" aria-hidden="true" />
          Browse services
        </Button>
      </div>
    </div>
  )
}
