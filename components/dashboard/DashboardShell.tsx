"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Heart, LogOut, Menu, ShieldX } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Logo } from "@/components/Shared/Logo"
import { DASHBOARD_NAV, type NavItem } from "@/components/dashboard/nav"
import { signOut, useSession } from "@/lib/auth-client"
import { getUserInitials } from "@/lib/format"
import { cn } from "@/lib/utils"

function isActive(pathname: string, item: NavItem, baseUrl: string) {
  if (pathname === item.href) return true
  // Sub-pages highlight their own item only (not the Overview link).
  return item.href !== baseUrl && pathname.startsWith(`${item.href}/`)
}

function SidebarNav({
  role,
  onNavigate,
  className,
}: {
  role: string
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const items = DASHBOARD_NAV[role] ?? DASHBOARD_NAV.customer

  return (
    <nav className={cn("flex flex-col gap-1.5", className)}>
      {items.map((item) => {
        const active = isActive(pathname, item, `/${role}`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#B76E79]/50",
              active
                ? "bg-rose-100/80 text-[#9F5863] shadow-2xs"
                : "text-stone-600 hover:bg-rose-50/80 hover:text-stone-900 dark:text-muted-foreground dark:hover:bg-input/30 dark:hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "size-4.5 shrink-0",
                active
                  ? "text-[#B76E79]"
                  : "text-stone-400 dark:text-muted-foreground"
              )}
            />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function UserCard() {
  const router = useRouter()
  const { data } = useSession()
  const user = data?.user

  async function handleSignOut() {
    try {
      await signOut()
      toast.success("Signed out successfully")
      router.push("/")
    } catch {
      toast.error("Could not sign out. Please try again.")
    }
  }

  return (
    <div className="border-t border-rose-100 p-4 dark:border-input">
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-rose-50 to-[#FDFBF7] p-3 ring-1 ring-rose-100/80 dark:from-input/30 dark:to-input/10 dark:ring-input/30">
        <Avatar className="size-9 ring-2 ring-rose-200">
          {user?.image ? (
            <AvatarImage src={user.image} alt={user.name ?? ""} />
          ) : null}
          <AvatarFallback className="bg-rose-100 text-xs font-medium text-[#B76E79]">
            {getUserInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-800 dark:text-foreground">
            {user?.name ?? "My account"}
          </p>
          {user?.role ? (
            <span className="mt-0.5 inline-flex items-center rounded-full bg-[#B76E79]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#9F5863] uppercase">
              {user.role}
            </span>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSignOut}
          aria-label="Log out"
          title="Log out"
          className="shrink-0 text-stone-500 hover:bg-rose-100/60 hover:text-rose-700"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  )
}

/** Full sidebar for one role — used on desktop and inside the mobile Sheet. */
function SidebarContent({
  role,
  onNavigate,
}: {
  role: string
  onNavigate?: () => void
}) {
  return (
    <>
      <div className="p-4 pb-2">
        <Logo />
      </div>
      <div className="px-3 pb-2">
        <p className="px-1.5 text-[10px] font-semibold tracking-[0.2em] text-stone-400 uppercase dark:text-muted-foreground">
          {role} dashboard
        </p>
        <SidebarNav role={role} onNavigate={onNavigate} className="mt-2" />
      </div>
      <div className="mt-auto">
        <Link
          href="/"
          onClick={onNavigate}
          className="mx-4 mb-2 flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-stone-500 transition-colors hover:bg-rose-50/80 hover:text-stone-800 dark:text-muted-foreground dark:hover:bg-input/30"
        >
          <Heart className="size-3.5 text-[#B76E79]" />
          Back to WedPlan
        </Link>
        <UserCard />
      </div>
    </>
  )
}

/**
 * Dashboard shell: fixed left sidebar on desktop, Sheet drawer on mobile,
 * with a sticky mobile top bar. Navigation is rendered from the signed-in
 * user's role.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = data?.user
  const role = (user?.role ?? "customer") as string

  // Unauthenticated visitors never see the shell.
  useEffect(() => {
    if (!isPending && !user) router.replace("/sign-in")
  }, [isPending, user, router])

  if (isPending || !user) return null

  // Blocked users cannot access protected platform features.
  if (user.isBlocked) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#FDFBF7] px-4 text-center dark:bg-background">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-[#B76E79] dark:bg-input/40">
          <ShieldX className="size-7" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
          Account blocked
        </h1>
        <p className="max-w-sm text-sm text-stone-600 dark:text-muted-foreground">
          Your account has been blocked by an administrator, so protected
          platform features are unavailable. Contact support if you believe this
          is a mistake.
        </p>
        <Button
          render={<Link href="/" />}
          className="rounded-full bg-[#B76E79] text-[#fffdf8] hover:bg-[#a25c67]"
        >
          Back to home
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-[#FDFBF7] dark:bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-rose-100 bg-white lg:flex dark:border-input dark:bg-card">
        <SidebarContent role={role} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-rose-100 bg-white/90 px-4 backdrop-blur-md lg:hidden dark:border-input dark:bg-card/90">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open dashboard menu"
                className="text-stone-700 hover:bg-rose-50 hover:text-[#B76E79]"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-80 border-r-rose-200/70 bg-white p-0 dark:border-input dark:bg-card"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Dashboard navigation</SheetTitle>
            </SheetHeader>
            <div className="flex h-full flex-col">
              <SidebarContent
                role={role}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-heading text-xl font-semibold text-stone-900 dark:text-foreground">
          Wed<span className="text-[#B76E79] italic">Plan</span>
        </span>
      </header>

      {/* Main content area */}
      <main className="px-4 py-6 sm:px-6 lg:py-8 lg:pr-8 lg:pl-[19.5rem]">
        {children}
      </main>
    </div>
  )
}
