import { Skeleton } from "@/components/ui/skeleton"

export function ServiceDetailsSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading service details"
      className="min-h-screen bg-[#FDFBF7] pb-24"
    >
      {/* Top Breadcrumb & Action Bar Skeleton */}
      <div className="border-b border-rose-200/60 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-44 rounded-full bg-rose-100/70" />
          <Skeleton className="h-8 w-24 rounded-full bg-rose-100/70" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        {/* Service Header Skeleton */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Skeleton className="h-6 w-36 rounded-full bg-rose-100/80" />
            <Skeleton className="h-6 w-28 rounded-full bg-rose-100/60" />
          </div>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-3">
              <Skeleton className="h-9 w-72 rounded-xl bg-rose-100/80 sm:h-11 sm:w-[28rem]" />
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-full bg-rose-200/70" />
                <Skeleton className="h-4 w-48 rounded-lg bg-rose-100/70" />
              </div>
            </div>

            {/* Starting Package Pill Skeleton */}
            <div className="w-fit space-y-2 rounded-2xl border border-rose-200/70 bg-white px-5 py-3.5 shadow-2xs md:min-w-44">
              <Skeleton className="h-3 w-24 rounded-md bg-rose-100/70" />
              <Skeleton className="h-8 w-32 rounded-lg bg-rose-100/90" />
            </div>
          </div>
        </div>

        {/* Two-Column Editorial Grid Skeleton */}
        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* LEFT COLUMN (7 cols): Gallery, Description & Vendor Card */}
          <div className="space-y-8 lg:col-span-7">
            {/* Gallery Skeleton */}
            <div className="space-y-3.5">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-rose-200/70 bg-white p-1">
                <Skeleton className="h-full w-full rounded-[1.25rem] bg-rose-100/65" />
                <Skeleton className="absolute right-4 bottom-4 h-6 w-14 rounded-full bg-white/80" />
              </div>

              {/* Thumbnail Strip Skeleton */}
              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 sm:gap-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Skeleton
                    key={item}
                    className="aspect-[4/3] w-full rounded-2xl bg-rose-100/65"
                  />
                ))}
              </div>
            </div>

            {/* About This Service Card Skeleton */}
            <section className="space-y-5 rounded-3xl border border-rose-200/70 bg-white p-6 shadow-2xs sm:p-8">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-5 rounded-full bg-rose-200/70" />
                <Skeleton className="h-7 w-48 rounded-lg bg-rose-100/80" />
              </div>

              <div className="space-y-2.5">
                <Skeleton className="h-4 w-full rounded-md bg-rose-100/60" />
                <Skeleton className="h-4 w-11/12 rounded-md bg-rose-100/60" />
                <Skeleton className="h-4 w-full rounded-md bg-rose-100/60" />
                <Skeleton className="h-4 w-4/5 rounded-md bg-rose-100/60" />
                <Skeleton className="h-4 w-3/5 rounded-md bg-rose-100/60" />
              </div>

              {/* 3 Service Highlights Skeleton */}
              <div className="grid gap-4 border-t border-rose-100 pt-6 sm:grid-cols-3">
                {[1, 2, 3].map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-3 rounded-2xl bg-[#FDFBF7] p-3.5 ring-1 ring-rose-100"
                  >
                    <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full bg-rose-200/70" />
                    <div className="w-full space-y-1.5">
                      <Skeleton className="h-3.5 w-24 rounded-md bg-rose-100/80" />
                      <Skeleton className="h-3 w-20 rounded-md bg-rose-100/60" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Vendor Information Card Skeleton */}
            <section className="rounded-3xl border border-rose-200/70 bg-white p-6 shadow-2xs sm:p-8">
              <div className="space-y-2">
                <Skeleton className="h-3 w-32 rounded-md bg-rose-100/80" />
                <Skeleton className="h-7 w-48 rounded-lg bg-rose-100/80" />
              </div>

              <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-16 shrink-0 rounded-full bg-rose-100/80" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-40 rounded-lg bg-rose-100/80" />
                      <Skeleton className="h-5 w-24 rounded-full bg-rose-100/70" />
                    </div>
                    <Skeleton className="h-4 w-52 rounded-md bg-rose-100/60" />
                  </div>
                </div>
                <Skeleton className="h-9 w-40 rounded-xl bg-rose-100/70" />
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (5 cols): Sticky Booking Card Skeleton */}
          <aside className="lg:sticky lg:top-24 lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white shadow-xl shadow-rose-950/5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/50 px-6 py-5 sm:px-7">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32 rounded-md bg-rose-200/60" />
                  <Skeleton className="h-8 w-36 rounded-lg bg-rose-200/70" />
                </div>
                <Skeleton className="size-10 rounded-full bg-rose-100/90" />
              </div>

              {/* Form Fields */}
              <div className="space-y-5 p-6 sm:p-7">
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-36 rounded-md bg-rose-100/80" />
                  <Skeleton className="h-11 w-full rounded-xl bg-rose-100/60" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-40 rounded-md bg-rose-100/80" />
                  <Skeleton className="h-11 w-full rounded-xl bg-rose-100/60" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-36 rounded-md bg-rose-100/80" />
                  <Skeleton className="h-24 w-full rounded-xl bg-rose-100/60" />
                </div>

                {/* Price Summary Box */}
                <div className="space-y-2.5 rounded-2xl border border-rose-100 bg-[#FDFBF7] p-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-28 rounded-md bg-rose-100/70" />
                    <Skeleton className="h-3.5 w-16 rounded-md bg-rose-100/70" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-32 rounded-md bg-rose-100/70" />
                    <Skeleton className="h-3.5 w-12 rounded-md bg-rose-100/70" />
                  </div>
                  <div className="flex justify-between border-t border-rose-200/60 pt-2.5">
                    <Skeleton className="h-4 w-28 rounded-md bg-rose-200/70" />
                    <Skeleton className="h-4 w-20 rounded-md bg-rose-200/70" />
                  </div>
                </div>

                {/* CTA Button */}
                <Skeleton className="h-12 w-full rounded-full bg-rose-200/80" />
                <Skeleton className="mx-auto h-3 w-48 rounded-md bg-rose-100/60" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default ServiceDetailsSkeleton