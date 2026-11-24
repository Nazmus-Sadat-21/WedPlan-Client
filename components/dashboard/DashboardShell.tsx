"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
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
import { BackButton } from "@/components/Shared/BackButton"
import { Logo } from "@/components/Shared/Logo"
import { ThemeToggle } from "@/components/Shared/ThemeToggle"
import { DASHBOARD_NAV, type NavItem } from "@/components/dashboard/nav"
import { DashboardLoader } from "@/components/dashboard/RoleGate"
import { signOut, useSession } from "@/lib/auth-client"
import { getUserInitials } from "@/lib/format"
import { EASE_OUT } from "@/lib/motion"
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
  const reduceMotion = useReducedMotion()

  return (
    <nav className={cn("flex flex-col gap-1.5", className)}>
      {items.map((item, index) => {
        const active = isActive(pathname, item, `/${role}`)
        return (
          <motion.div
            key={item.href}
            initial={reduceMotion ? false : { opacity: 0, x: -12 }}
            animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35, ease: EASE_OUT }}
          >
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#B76E79]/50",
                active
                  ? "text-[#9F5863]"
                  : "text-stone-600 hover:bg-rose-50/80 hover:text-stone-900 dark:text-muted-foreground dark:hover:bg-input/30 dark:hover:text-foreground"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="dashboard-nav-active"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-rose-100/80 shadow-2xs dark:bg-rose-400/10"
                />
              ) : null}
              <item.icon
                className={cn(
                  "relative size-4.5 shrink-0",
                  active
                    ? "text-[#B76E79]"
                    : "text-stone-400 dark:text-muted-foreground"
                )}
              />
              <span className="relative">{item.label}</span>
            </Link>
          </motion.div>
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
      <div className="flex items-center justify-between gap-2 p-4 pb-2">
        <Logo />
        <ThemeToggle />
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
 *
 * The shell also enforces the role itself: the first URL segment
 * (/vendor, /customer, /admin) must match the signed-in user's role, otherwise
 * the visitor is sent to /unauthorized without ever seeing the shell.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = data?.user
  const role = (user?.role ?? "customer") as string

  // /vendor, /customer or /admin: the first URL segment names the dashboard
  const routeRole = pathname.split("/")[1]
  const isRoleRoute = ["admin", "vendor", "customer"].includes(routeRole)
  const wrongRole =
    Boolean(user) &&
    isRoleRoute &&
    routeRole !== String(user?.role ?? "").toLowerCase()

  useEffect(() => {
    if (isPending) return

    // Unauthenticated visitors never see the shell.
    if (!user) {
      router.replace("/sign-in")
      return
    }

    if (user.isBlocked) {
  router.replace("/blocked")
  return
}
    // Signed-in user opening another role's dashboard by URL.
    if (wrongRole) {
      router.replace("/unauthorized")
    }
  }, [isPending, user, wrongRole, router])

  if (isPending || !user) return <DashboardLoader />

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

  // Wrong dashboard for this role: show nothing of the shell while redirecting
  if (wrongRole) return <DashboardLoader label="Redirecting…" />

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
          <span className="text-stone-900 dark:text-white">wed</span>
          <span className="text-[#B76E79] italic">Plan</span>
        </span>
        <ThemeToggle className="ml-auto size-9" />
      </header>

      {/* Main content area */}
      <main className="px-4 py-6 sm:px-6 lg:py-8 lg:pr-8 lg:pl-[19.5rem]">
        <BackButton fallbackHref={`/${role}`} className="mb-5" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}