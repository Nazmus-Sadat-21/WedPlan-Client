"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  ChevronDown,
  Compass,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Logo } from "@/components/Shared/Logo"
import { signOut, useSession } from "@/lib/auth-client"
import { dashboardPathForRole } from "@/lib/roles"
import { getUserInitials } from "@/lib/format"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse-services", label: "Browse Services" },
] as const

const menuItemClassName =
  "group cursor-pointer gap-3 rounded-xl px-2.5 py-2 text-stone-700 transition-colors focus:bg-rose-50/90 focus:text-[#9F5863] data-highlighted:bg-rose-50/90 data-highlighted:text-[#9F5863]"

const menuIconClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#B76E79] ring-1 ring-rose-100 transition-all duration-200 group-focus:bg-[#B76E79] group-focus:text-white group-focus:ring-[#B76E79] group-data-highlighted:bg-[#B76E79] group-data-highlighted:text-white group-data-highlighted:ring-[#B76E79]"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data, isPending } = useSession()
  const user = data?.user
  const isAuthed = Boolean(user)
  const dashboardHref = dashboardPathForRole(user?.role)

  // Soften the bar and add depth once the page scrolls
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function closeMobile() {
    setMobileOpen(false)
  }

  async function handleSignOut() {
    try {
      await signOut()
      closeMobile()
      toast.success("Signed out successfully")
      router.push("/")
    } catch {
      toast.error("Could not sign out. Please try again.")
    }
  }

  function activeClass(href: string) {
    return pathname === href
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-rose-200/70 bg-[#FDFBF7]/80 shadow-lg shadow-rose-950/5 backdrop-blur-xl"
          : "border-rose-200/50 bg-[#FDFBF7]/95 shadow-none backdrop-blur-md"
      )}
    >
      {/* Thin rose accent line along the top edge */}
      <div
        aria-hidden="true"
        className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#B76E79]/70 to-transparent"
      />

      <nav
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-[height] duration-300 sm:px-6 lg:px-8",
          scrolled ? "h-14 lg:h-16" : "h-16 lg:h-18"
        )}
      >
        {/* Left: Brand & Navigation Links */}
        <div className="flex items-center gap-8 lg:gap-10">
          <Logo />

          <ul className="hidden items-center gap-1 rounded-full border border-rose-200/60 bg-white/60 p-1 shadow-2xs backdrop-blur-sm md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = activeClass(link.href)
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative block rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "text-white"
                        : "text-stone-600 hover:bg-rose-50 hover:text-stone-900"
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="navbar-active-pill"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#B76E79] to-[#C58970] shadow-md shadow-rose-900/15"
                      />
                    ) : null}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Right: Desktop & Tablet Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <Skeleton className="h-10 w-44 rounded-full bg-rose-100/60" />
          ) : isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="group h-11 gap-2.5 rounded-full border border-rose-200/80 bg-white/90 pr-3.5 pl-1.5 text-stone-700 shadow-2xs transition-all duration-200 hover:border-[#B76E79]/50 hover:bg-white hover:text-stone-900 hover:shadow-md hover:shadow-rose-950/5 data-[state=open]:border-[#B76E79]/60 data-[state=open]:shadow-md"
                  />
                }
              >
                <Avatar className="size-8 ring-2 ring-rose-100 transition-all duration-200 group-hover:ring-[#B76E79]/40">
                  {user?.image ? (
                    <AvatarImage
                      src={user.image}
                      alt={user.name ?? "Profile"}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-[#B76E79] to-[#C58970] text-xs font-semibold text-white">
                    {getUserInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="max-w-28 truncate text-sm leading-none font-semibold text-stone-800">
                    {user?.name ?? "My account"}
                  </span>
                  {user?.role ? (
                    <span className="mt-1 text-[10px] leading-none font-medium tracking-wider text-[#B76E79] uppercase">
                      {user.role}
                    </span>
                  ) : null}
                </div>
                <ChevronDown className="size-4 text-stone-400 transition-transform duration-200 group-hover:text-[#B76E79] group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-80 overflow-hidden rounded-2xl border border-rose-200/80 bg-white/95 p-2 shadow-2xl shadow-rose-950/15 backdrop-blur-xl"
              >
                {/* Profile header card */}
                <div className="relative mb-2 overflow-hidden rounded-xl border border-rose-200/60 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] p-4 text-white">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full bg-rose-300/25 blur-2xl"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-12 left-6 size-28 rounded-full bg-amber-200/15 blur-2xl"
                  />
                  <div className="relative flex items-center gap-3.5">
                    <Avatar className="size-14 shrink-0 shadow-lg ring-2 ring-white/70">
                      {user?.image ? (
                        <AvatarImage
                          src={user.image}
                          alt={user.name ?? "Profile"}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-[#B76E79] to-[#C58970] text-base font-semibold text-white">
                        {getUserInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-lg leading-tight font-semibold">
                        {user?.name ?? "My account"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-rose-100/80">
                        {user?.email ?? ""}
                      </p>
                      {user?.role ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-rose-50 uppercase backdrop-blur-md">
                          <Sparkles className="size-2.5 text-amber-200" />
                          {user.role}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Menu navigation actions */}
                <div className="space-y-0.5">
                  {user?.role ? (
                    <DropdownMenuItem
                      onClick={() => router.push(dashboardHref)}
                      className={menuItemClassName}
                    >
                      <span className={menuIconClassName}>
                        <LayoutDashboard className="size-4" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Dashboard</span>
                        <span className="text-[11px] text-stone-400 group-focus:text-[#9F5863]/80 group-data-highlighted:text-[#9F5863]/80">
                          Manage bookings &amp; overview
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuItem
                    onClick={() => router.push("/browse-services")}
                    className={menuItemClassName}
                  >
                    <span className={menuIconClassName}>
                      <Compass className="size-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        Browse Services
                      </span>
                      <span className="text-[11px] text-stone-400 group-focus:text-[#9F5863]/80 group-data-highlighted:text-[#9F5863]/80">
                        Find venues, photographers &amp; more
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`${dashboardHref}/profile-settings`)
                    }
                    className={menuItemClassName}
                  >
                    <span className={menuIconClassName}>
                      <Settings className="size-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        Profile Settings
                      </span>
                      <span className="text-[11px] text-stone-400 group-focus:text-[#9F5863]/80 group-data-highlighted:text-[#9F5863]/80">
                        Account details &amp; preferences
                      </span>
                    </div>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-2 bg-rose-100/80" />

                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleSignOut}
                  className="group cursor-pointer gap-3 rounded-xl px-2.5 py-2 text-rose-600 transition-colors focus:bg-rose-50 focus:text-rose-700 data-highlighted:bg-rose-50 data-highlighted:text-rose-700"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 transition-all duration-200 group-focus:bg-rose-600 group-focus:text-white group-data-highlighted:bg-rose-600 group-data-highlighted:text-white">
                    <LogOut className="size-4" />
                  </span>
                  <span className="text-sm font-semibold">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                render={<Link href="/sign-in" />}
                className="rounded-full px-5 text-sm font-medium text-stone-700 hover:bg-rose-50/90 hover:text-stone-900"
              >
                Sign In
              </Button>
              <Button
                render={<Link href="/sign-up" />}
                className="gap-2 rounded-full bg-gradient-to-r from-[#B76E79] to-[#C58970] px-5 text-sm font-medium text-white shadow-md shadow-rose-900/15 transition-all hover:shadow-lg hover:brightness-105"
              >
                <Heart className="size-4 fill-white/25" />
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Drawer */}
        <div className="flex items-center gap-2 md:hidden">
          {!isPending && isAuthed ? (
            <Link
              href={`${dashboardHref}/profile-settings`}
              aria-label="Profile Settings"
              className="rounded-full p-0.5 ring-2 ring-rose-200 transition-transform active:scale-95"
            >
              <Avatar className="size-8">
                {user?.image ? (
                  <AvatarImage
                    src={user.image}
                    alt={user.name ?? "Profile"}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#B76E79] to-[#C58970] text-xs font-semibold text-white">
                  {getUserInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : null}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-rose-200/80 bg-white/80 text-stone-700 hover:bg-rose-50 hover:text-[#B76E79]"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex w-[85vw] max-w-sm flex-col border-l-rose-200/70 bg-[#FDFBF7] p-0"
            >
              <SheetHeader className="border-b border-rose-100/80 px-5 py-4 text-left">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                {/* Mobile User Profile Card (when authenticated) */}
                {!isPending && isAuthed ? (
                  <div className="relative mb-6 overflow-hidden rounded-2xl border border-rose-200/60 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] p-4 text-white shadow-lg shadow-rose-950/10">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full bg-rose-300/25 blur-2xl"
                    />
                    <div className="relative flex items-center gap-3.5">
                      <Avatar className="size-13 shrink-0 shadow-lg ring-2 ring-white/70">
                        {user?.image ? (
                          <AvatarImage
                            src={user.image}
                            alt={user.name ?? "Profile"}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-[#B76E79] to-[#C58970] text-sm font-semibold text-white">
                          {getUserInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-base font-semibold">
                          {user?.name ?? "My account"}
                        </p>
                        <p className="truncate text-xs text-rose-100/80">
                          {user?.email ?? ""}
                        </p>
                        {user?.role ? (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-rose-50 uppercase">
                            <Sparkles className="size-2.5 text-amber-200" />
                            {user.role}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Primary Links */}
                <div className="space-y-1">
                  <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                    Navigation
                  </p>
                  {NAV_LINKS.map((link) => {
                    const isActive = activeClass(link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMobile}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-gradient-to-r from-[#B76E79] to-[#C58970] text-white shadow-md shadow-rose-900/10"
                            : "text-stone-600 hover:bg-rose-50/80 hover:text-stone-900"
                        )}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </div>

                {/* Account Quick Links on Mobile */}
                {!isPending && isAuthed ? (
                  <div className="mt-6 space-y-1">
                    <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                      Account
                    </p>
                    {user?.role ? (
                      <Link
                        href={dashboardHref}
                        onClick={closeMobile}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                          activeClass(dashboardHref)
                            ? "bg-rose-100/80 text-[#9F5863]"
                            : "text-stone-600 hover:bg-rose-50/80 hover:text-stone-900"
                        )}
                      >
                        <LayoutDashboard className="size-4 text-[#B76E79]" />
                        Dashboard
                      </Link>
                    ) : null}
                    <Link
                      href={`${dashboardHref}/profile-settings`}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                        activeClass(`${dashboardHref}/profile-settings`)
                          ? "bg-rose-100/80 text-[#9F5863]"
                          : "text-stone-600 hover:bg-rose-50/80 hover:text-stone-900"
                      )}
                    >
                      <Settings className="size-4 text-[#B76E79]" />
                      Profile Settings
                    </Link>
                  </div>
                ) : null}
              </div>

              {/* Sticky Footer Action */}
              <div className="border-t border-rose-100 bg-white/60 p-4">
                {isPending ? (
                  <Skeleton className="h-11 w-full rounded-full bg-rose-100/60" />
                ) : isAuthed ? (
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="h-11 w-full justify-center gap-2 rounded-full border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <Button
                      variant="outline"
                      render={<Link href="/sign-in" />}
                      onClick={closeMobile}
                      className="h-11 w-full rounded-full border-rose-200 bg-white text-stone-700 hover:bg-rose-50"
                    >
                      Sign In
                    </Button>
                    <Button
                      render={<Link href="/sign-up" />}
                      onClick={closeMobile}
                      className="h-11 w-full gap-2 rounded-full bg-gradient-to-r from-[#B76E79] to-[#C58970] text-white shadow-md shadow-rose-900/15 hover:brightness-105"
                    >
                      <Heart className="size-4 fill-white/25" />
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}