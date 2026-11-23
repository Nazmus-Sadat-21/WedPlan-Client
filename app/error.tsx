"use client"

import { RouteError } from "@/components/Shared/RouteError"

export default function AppError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return <RouteError error={error} retry={retry} />
}
