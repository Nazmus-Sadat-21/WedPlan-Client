import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata = { title: "Browse Services" }

export default function BrowseServicesPage() {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-7xl flex-col items-center justify-center gap-4 px-4 py-20 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-semibold tracking-[0.2em] text-champagne-600 uppercase">
        Coming next
      </p>
      <h1 className="font-heading text-4xl font-semibold text-foreground">
        Browse Wedding Services
      </h1>
      <p className="max-w-md text-muted-foreground">
        Searching by name, category and location filters, and price sorting are
        on the way.
      </p>
      <Button variant="outline" render={<Link href="/" />}>
        Back to Home
      </Button>
    </main>
  )
}
