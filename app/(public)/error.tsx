"use client"

import { RouteError } from "@/components/Shared/RouteError"

export default function PublicError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <RouteError
      error={error}
      retry={retry}
      title="This page didn't load"
      description="Something interrupted the page while it was loading. Check your connection and try again."
      className="min-h-[60svh] py-24"
    />
  )
}
