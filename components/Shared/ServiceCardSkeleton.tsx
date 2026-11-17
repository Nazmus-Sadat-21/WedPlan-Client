import { Skeleton } from "@/components/ui/skeleton"

export function ServiceCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-rose-200/75 bg-white shadow-xs">
      <Skeleton className="aspect-[4/3] rounded-none bg-rose-100/60" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-md bg-rose-100/60" />
          <Skeleton className="h-4 w-1/2 rounded-md bg-rose-100/60" />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-rose-100 pt-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-full bg-rose-100/60" />
            <Skeleton className="h-4 w-24 rounded-md bg-rose-100/60" />
          </div>
          <Skeleton className="h-4 w-20 rounded-md bg-rose-100/60" />
        </div>
      </div>
    </div>
  )
}

export function ServiceCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <ServiceCardSkeleton key={index} />
      ))}
    </div>
  )
}