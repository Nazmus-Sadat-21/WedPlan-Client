import Link from "next/link"
import { Construction, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ComingSoonProps = {
  title: string
  description: string
  backHref: string
  backLabel: string
  className?: string
}

/** Temporary placeholder page used until each real dashboard view is built. */
export function ComingSoon({
  title,
  description,
  backHref,
  backLabel,
  className,
}: ComingSoonProps) {
  return (
    <main
      className={cn(
        "relative isolate flex min-h-[80svh] items-center justify-center overflow-hidden bg-[#FDFBF7] px-4 py-20 dark:bg-background",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-rose-100/60 blur-3xl dark:bg-rose-950/30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-amber-100/50 blur-3xl dark:bg-rose-900/20"
      />

      <div className="relative max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 shadow-rose-900/5 ring-rose-200/80 dark:bg-input/30 dark:ring-input/40">
          <Construction className="size-7 text-[#B76E79]" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-semibold text-balance text-stone-900 dark:text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm text-pretty text-stone-600 dark:text-muted-foreground">
          {description}
        </p>
        <Button
          render={<Link href={backHref} />}
          className="mt-8 gap-2 rounded-full bg-[#B76E79] shadow-md shadow-rose-900/10 hover:bg-[#a25c67]"
        >
          <Heart className="size-4 fill-white/20" />
          {backLabel}
        </Button>
      </div>
    </main>
  )
}
