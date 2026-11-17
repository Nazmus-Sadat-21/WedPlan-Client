"use client"

import { useSession } from "@/lib/auth-client"

/** Greeting header shown at the top of each dashboard overview page. */
export function OverviewHeader({ subtitle }: { subtitle: string }) {
  const { data } = useSession()
  const user = data?.user

  return (
    <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#B76E79] uppercase">
          Dashboard
        </p>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-balance text-stone-900 sm:text-3xl dark:text-foreground">
          Welcome back,
          <span className="text-[#B76E79] italic">
            {" "}
            {user?.name?.split(" ")[0] ?? "there"}
          </span>
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {user?.role ? (
        <span className="inline-flex w-fit items-center rounded-full bg-rose-100/80 px-3 py-1 text-xs font-semibold tracking-wide text-[#9F5863] uppercase">
          {user.role} account
        </span>
      ) : null}
    </header>
  )
}
