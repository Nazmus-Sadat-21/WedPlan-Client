"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronDown,
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

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data, isPending } = useSession()
  const user = data?.user
  const isAuthed = Boolean(user)
  const dashboardHref = dashboardPathForRole(user?.role)

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
    <header className="sticky top-0 z-50 border-b border-rose-200/60 bg-[#FDFBF7]/90 shadow-2xs backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-18 lg:px-8">
        {/* Left: Brand & Navigation Links */}
        <div className="flex items-center gap-8 lg:gap-10">
          <Logo />
          <ul className="hidden items-center gap-1.5 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = activeClass(link.href)
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-rose-100/90 text-[#9F5863] shadow-2xs ring-1 ring-rose-200/70"
                        : "text-stone-600 hover:bg-rose-50/90 hover:text-stone-900"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Right: Desktop & Tablet Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <Skeleton className="h-10 w-40 rounded-full bg-rose-100/60" />
          ) : isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="group h-10 gap-2.5 rounded-full border border-rose-200/80 bg-white/90 pr-3.5 pl-1.5 text-stone-700 shadow-2xs transition-all duration-200 hover:border-[#B76E79]/50 hover:bg-rose-50/70 hover:text-stone-900 hover:shadow-sm"
                  />
                }
              >
                <Avatar className="size-7.5 ring-2 ring-rose-100 transition-transform duration-200 group-hover:scale-105 group-hover:ring-rose-200">
                  {user?.image ? (
                    <AvatarImage
                      src={user.image}
                      alt={user.name ?? "Profile"}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-rose-100 to-rose-200/70 text-xs font-semibold text-[#9F5863]">
                    {getUserInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="max-w-28 truncate text-sm leading-none font-medium text-stone-800">
                    {user?.name ?? "My account"}
                  </span>
                </div>
                <ChevronDown className="size-4 text-stone-400 transition-transform duration-200 group-data-[state=open]:rotate-180 group-hover:text-[#B76E79]" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-72 rounded-2xl border border-rose-200/80 bg-white/95 p-2 shadow-xl shadow-rose-950/10 backdrop-blur-xl"
              >
                {/* Editorial User Profile Header Card */}
                <div className="relative mb-1.5 overflow-hidden rounded-xl border border-rose-200/60 bg-gradient-to-br from-rose-50/90 via-[#FDFBF7] to-amber-50/40 p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 shrink-0 ring-2 ring-white shadow-xs">
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
                      <p className="truncate font-heading text-base leading-tight font-semibold text-stone-900">
                        {user?.name ?? "My account"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-stone-500">
                        {user?.email ?? ""}
                      </p>
                      {user?.role ? (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-rose-200/80 bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#9F5863] uppercase shadow-2xs">
                          <Sparkles className="size-2.5 text-[#B76E79]" />
                          {user.role}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1.5 bg-rose-100/80" />

                {/* Menu Navigation Actions */}
                <div className="space-y-1">
                  {user?.role ? (
                    <DropdownMenuItem
                      onClick={() => router.push(dashboardHref)}
                      className="group cursor-pointer gap-3 rounded-xl px-2.5 py-2 text-stone-700 transition-colors focus:bg-rose-50/90 focus:text-[#9F5863]"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#B76E79] transition-colors group-focus:bg-[#B76E79] group-focus:text-white">
                        <LayoutDashboard className="size-4" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Dashboard</span>
                        <span className="text-[11px] text-stone-400 group-focus:text-[#9F5863]/80">
                          Manage bookings & overview
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`${dashboardHref}/profile-settings`)
                    }
                    className="group cursor-pointer gap-3 rounded-xl px-2.5 py-2 text-stone-700 transition-colors focus:bg-rose-50/90 focus:text-[#9F5863]"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#B76E79] transition-colors group-focus:bg-[#B76E79] group-focus:text-white">
                      <Settings className="size-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        Profile Settings
                      </span>
                      <span className="text-[11px] text-stone-400 group-focus:text-[#9F5863]/80">
                        Account details & preferences
                      </span>
                    </div>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-1.5 bg-rose-100/80" />

                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleSignOut}
                  className="group cursor-pointer gap-3 rounded-xl px-2.5 py-2 text-rose-600 transition-colors focus:bg-rose-50 focus:text-rose-700"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50/80 text-rose-600 transition-colors group-focus:bg-rose-600 group-focus:text-white">
                    <LogOut className="size-4" />
                  </span>
                  <span className="text-sm font-medium">Sign Out</span>
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
                className="gap-2 rounded-full bg-[#B76E79] px-5 text-sm font-medium text-white shadow-sm shadow-rose-900/10 transition-all hover:bg-[#a25c67] hover:shadow-md"
              >
                <Heart className="size-4 fill-white/20" />
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
              className="rounded-full p-0.5 ring-1 ring-rose-200 transition-transform active:scale-95"
            >
              <Avatar className="size-8">
                {user?.image ? (
                  <AvatarImage
                    src={user.image}
                    alt={user.name ?? "Profile"}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-rose-100 text-xs font-semibold text-[#9F5863]">
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
                  className="rounded-full text-stone-700 hover:bg-rose-50 hover:text-[#B76E79]"
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
                  <div className="mb-6 rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/90 via-white to-amber-50/30 p-4 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                      <Avatar className="size-12 shrink-0 ring-2 ring-rose-200/80">
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
                        <p className="truncate font-heading text-base font-semibold text-stone-900">
                          {user?.name ?? "My account"}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {user?.email ?? ""}
                        </p>
                        {user?.role ? (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#B76E79]/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#9F5863] uppercase">
                            <Sparkles className="size-2.5 text-[#B76E79]" />
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
                        className={cn(
                          "flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                          isActive
                            ? "bg-rose-100/80 text-[#9F5863] shadow-2xs"
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
                      className="h-11 w-full gap-2 rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
                    >
                      <Heart className="size-4 fill-white/20" />
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