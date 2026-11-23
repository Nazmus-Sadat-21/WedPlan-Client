"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type RouteErrorProps = {
  error: unknown
  retry: () => void
  title?: string
  description?: string
  className?: string
}

/**
 * Shared fallback for every `error.tsx` boundary. Next 16 passes `retry`
 * (not the older `reset`), which re-fetches and re-renders the segment.
 */
export function RouteError({
  error,
  retry,
  title = "Something went wrong",
  description = "We hit an unexpected problem while loading this page. Please try again — if it keeps happening, come back in a few minutes.",
  className,
}: RouteErrorProps) {
  useEffect(() => {
    // Keep the original error in the browser console for debugging without
    // exposing it in the UI (production messages are redacted by Next).
    console.error("Route error:", error)
  }, [error])

  const digest =
    error && typeof error === "object" && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "")
      : ""

  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 py-20 text-center",
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-[#B76E79] dark:border-rose-500/30 dark:bg-rose-500/10">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-heading text-3xl font-semibold text-stone-900 dark:text-foreground">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm text-pretty text-stone-600 dark:text-muted-foreground">
        {description}
      </p>
      {digest ? (
        <p className="mt-3 rounded-full bg-stone-100 px-3 py-1 font-mono text-[11px] text-stone-500 dark:bg-input/30 dark:text-muted-foreground">
          Reference: {digest}
        </p>
      ) : null}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          onClick={() => retry()}
          className="h-11 rounded-full px-6"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full px-6"
          render={<Link href="/" />}
        >
          <Home className="size-4" aria-hidden="true" />
          Back to home
        </Button>
      </div>
    </div>
  )
}
