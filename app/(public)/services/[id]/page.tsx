import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata = { title: "Service Details" }

export default function ServiceDetailsPage() {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-7xl flex-col items-center justify-center gap-4 px-4 py-20 text-center sm:px-6 lg:px-8">
      <h1 className="font-heading text-4xl font-semibold text-foreground">
        Service Details
      </h1>
      <p className="max-w-md text-muted-foreground">
        The full service details page with gallery and booking form is on the
        way.
      </p>
      <Button variant="outline" render={<Link href="/browse-services" />}>
        Back to Browse Services
      </Button>
    </main>
  )
}
