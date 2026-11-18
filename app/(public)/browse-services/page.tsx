import type { Metadata } from "next"

import { BrowseServices } from "@/components/services/BrowseServices"

export const metadata: Metadata = { title: "Browse Services" }

export default async function BrowseServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>
}) {
  const { category } = await searchParams
  const initialCategory = Array.isArray(category) ? category[0] : category

  return (
    <BrowseServices
      key={initialCategory ?? "all"}
      initialCategory={initialCategory}
    />
  )
}
