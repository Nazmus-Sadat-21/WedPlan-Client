export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-4 py-20"
    >
      <span className="relative flex size-14 items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-4 border-rose-100 dark:border-input"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#B76E79] border-r-[#C58970]"
        />
        <span className="size-4 rounded-full bg-gradient-to-br from-[#B76E79] to-[#C58970]" />
      </span>
      <p className="text-sm font-medium text-stone-600 dark:text-muted-foreground">
        Loading WedPlan…
      </p>
      <span className="sr-only">Please wait</span>
    </div>
  )
}
