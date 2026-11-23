"use client"

import { RouteError } from "@/components/Shared/RouteError"

export default function DashboardError({
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
      title="We couldn't load this dashboard"
      description="Your data is safe. This is usually a temporary connection problem with the WedPlan API — retry to load the page again."
      className="py-16"
    />
  )
}
