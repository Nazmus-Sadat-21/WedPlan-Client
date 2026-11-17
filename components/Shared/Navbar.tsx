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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    activeClass(link.href)
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {isPending ? (
            <Skeleton className="h-9 w-36 rounded-full" />
          ) : isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="gap-2 rounded-full pr-2 pl-1"
                  />
                }
              >
                <Avatar className="size-8">
                  {user?.image ? (
                    <AvatarImage
                      src={user.image}
                      alt={user.name ?? "Profile"}
                    />
                  ) : null}
                  <AvatarFallback className="bg-champagne-500/15 text-xs text-champagne-700">
                    {getUserInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-28 truncate font-medium">
                  {user?.name ?? "My account"}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <p className="truncate text-sm font-medium text-foreground">
                    {user?.name ?? "My account"}
                  </p>
                  <p className="truncate text-xs font-normal">
                    {user?.email ?? ""}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role ? (
                  <DropdownMenuItem onClick={() => router.push(dashboardHref)}>
                    <LayoutDashboard />
                    Dashboard
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`${dashboardHref}/profile-settings`)
                  }
                >
                  <Settings />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" render={<Link href="/sign-in" />}>
                Sign In
              </Button>
              <Button
                render={<Link href="/sign-up" />}
                className="gap-2 rounded-full"
              >
                <Heart className="size-4" />
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
                className="lg:hidden"
                aria-label="Open navigation menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeClass(link.href)
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-2 p-4">
              {isPending ? (
                <Skeleton className="h-10 w-full rounded-lg" />
              ) : isAuthed ? (
                <>
                  <Button
                    variant="outline"
                    render={<Link href={dashboardHref} />}
                    onClick={closeMobile}
                  >
                    <LayoutDashboard />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="text-destructive"
                  >
                    <LogOut />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" render={<Link href="/sign-in" />}>
                    Sign In
                  </Button>
                  <Button render={<Link href="/sign-up" />}>Sign Up</Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
