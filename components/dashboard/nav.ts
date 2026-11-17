import type { LucideIcon } from "lucide-react"
import {
  CalendarHeart,
  HandCoins,
  LayoutDashboard,
  Plus,
  Settings,
  Store,
  UserRound,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

/**
 * Dashboard sidebar navigation per authenticated role, mirroring the
 * assignment's dashboard structure for Vendor, Customer and Admin.
 */
export const DASHBOARD_NAV: Record<string, NavItem[]> = {
  vendor: [
    { href: "/vendor", label: "Overview", icon: LayoutDashboard },
    { href: "/vendor/my-services", label: "My Services", icon: Store },
    { href: "/vendor/add-service", label: "Add Service", icon: Plus },
    {
      href: "/vendor/booking-requests",
      label: "Booking Requests",
      icon: CalendarHeart,
    },
    { href: "/vendor/subscription", label: "Subscription", icon: HandCoins },
    {
      href: "/vendor/profile-settings",
      label: "Profile Settings",
      icon: Settings,
    },
  ],
  customer: [
    { href: "/customer", label: "Overview", icon: LayoutDashboard },
    {
      href: "/customer/my-bookings",
      label: "My Bookings",
      icon: CalendarHeart,
    },
    {
      href: "/customer/profile-settings",
      label: "Profile Settings",
      icon: Settings,
    },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/manage-users", label: "Manage Users", icon: UserRound },
    { href: "/admin/manage-services", label: "Manage Services", icon: Store },
    { href: "/admin/transactions", label: "Transactions", icon: HandCoins },
  ],
}
