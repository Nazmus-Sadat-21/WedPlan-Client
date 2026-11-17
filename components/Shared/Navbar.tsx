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
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
    <header className="sticky top-0 z-50 border-b border-rose-200/60 bg-[#FDFBF7]/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <ul className="hidden items-center gap-1.5 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all",
                    activeClass(link.href)
                      ? "bg-rose-100/80 text-[#9F5863] shadow-2xs"
                      : "text-stone-600 hover:bg-rose-50/80 hover:text-stone-900"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {isPending ? (
            <Skeleton className="h-9 w-36 rounded-full bg-rose-100/60" />
          ) : isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="gap-2 rounded-full border border-rose-200/70 bg-white/80 pr-3 pl-1.5 text-stone-700 shadow-2xs hover:border-rose-300 hover:bg-rose-50/80 hover:text-stone-900"
                  />
                }
              >
                <Avatar className="size-7 ring-1 ring-rose-200">
                  {user?.image ? (
                    <AvatarImage
                      src={user.image}
                      alt={user.name ?? "Profile"}
                    />
                  ) : null}
                  <AvatarFallback className="bg-rose-100 text-xs font-medium text-[#B76E79]">
                    {getUserInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-28 truncate text-sm font-medium">
                  {user?.name ?? "My account"}
                </span>
                <ChevronDown className="size-4 text-stone-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 rounded-2xl border-rose-200/70 bg-white/95 p-1.5 shadow-lg backdrop-blur-md"
              >
                <DropdownMenuLabel className="px-2.5 py-2">
                  <p className="truncate text-sm font-medium text-stone-800">
                    {user?.name ?? "My account"}
                  </p>
                  <p className="truncate text-xs font-normal text-stone-500">
                    {user?.email ?? ""}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-rose-100" />
                {user?.role ? (
                  <DropdownMenuItem
                    onClick={() => router.push(dashboardHref)}
                    className="cursor-pointer rounded-xl text-stone-700 focus:bg-rose-50 focus:text-[#9F5863]"
                  >
                    <LayoutDashboard className="size-4 text-[#B76E79]" />
                    Dashboard
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`${dashboardHref}/profile-settings`)
                  }
                  className="cursor-pointer rounded-xl text-stone-700 focus:bg-rose-50 focus:text-[#9F5863]"
                >
                  <Settings className="size-4 text-[#B76E79]" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-rose-100" />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleSignOut}
                  className="cursor-pointer rounded-xl focus:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                render={<Link href="/sign-in" />}
                className="rounded-full px-5 text-stone-700 hover:bg-rose-50/80 hover:text-stone-900"
              >
                Sign In
              </Button>
              <Button
                render={<Link href="/sign-up" />}
                className="gap-2 rounded-full bg-[#B76E79] px-5 text-white shadow-sm shadow-rose-900/10 transition-all hover:bg-[#a25c67] hover:shadow-md"
              >
                <Heart className="size-4 fill-white/20" />
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-stone-700 hover:bg-rose-50 hover:text-[#B76E79] lg:hidden"
                aria-label="Open navigation menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-80 border-l-rose-200/70 bg-[#FDFBF7]"
          >
            <SheetHeader className="border-b border-rose-100 pb-4">
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex flex-col gap-1.5 px-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className={cn(
                    "rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    activeClass(link.href)
                      ? "bg-rose-100/80 text-[#9F5863]"
                      : "text-stone-600 hover:bg-rose-50/80 hover:text-stone-900"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-2.5 border-t border-rose-100 p-4">
              {isPending ? (
                <Skeleton className="h-10 w-full rounded-full bg-rose-100/60" />
              ) : isAuthed ? (
                <>
                  <Button
                    variant="outline"
                    render={<Link href={dashboardHref} />}
                    onClick={closeMobile}
                    className="gap-2 rounded-full border-rose-200 bg-white text-stone-700 hover:bg-rose-50 hover:text-[#9F5863]"
                  >
                    <LayoutDashboard className="size-4 text-[#B76E79]" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    render={<Link href={`${dashboardHref}/profile-settings`} />}
                    onClick={closeMobile}
                    className="gap-2 rounded-full border-rose-200 bg-white text-stone-700 hover:bg-rose-50 hover:text-[#9F5863]"
                  >
                    <Settings className="size-4 text-[#B76E79]" />
                    Profile Settings
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="gap-2 rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    render={<Link href="/sign-in" />}
                    onClick={closeMobile}
                    className="rounded-full border-rose-200 bg-white text-stone-700 hover:bg-rose-50"
                  >
                    Sign In
                  </Button>
                  <Button
                    render={<Link href="/sign-up" />}
                    onClick={closeMobile}
                    className="gap-2 rounded-full bg-[#B76E79] text-white hover:bg-[#a25c67]"
                  >
                    <Heart className="size-4 fill-white/20" />
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}