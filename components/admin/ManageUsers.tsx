"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Ban,
  CalendarDays,
  Crown,
  Eye,
  Filter,
  LoaderCircle,
  Mail,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Store,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { authFetch } from "@/lib/auth-fetch"
import { API_ENDPOINTS } from "@/lib/constants"
import { formatDate, getUserInitials } from "@/lib/format"
import type { AdminUser } from "@/lib/types"
import { cn } from "@/lib/utils"

type RoleFilter = "all" | "customer" | "vendor" | "admin"
type StatusFilter = "all" | "active" | "blocked"

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "customer", label: "Customers" },
  { value: "vendor", label: "Vendors" },
  { value: "admin", label: "Admins" },
] as const

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active only" },
  { value: "blocked", label: "Blocked only" },
] as const

const controlClassName =
  "h-10 border-rose-200/90 bg-white/85 text-sm focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:border-input dark:bg-input/20 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

const focusRingClassName =
  "outline-none focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

function normalizeRole(user: AdminUser): "customer" | "vendor" | "admin" {
  const role = (user.role ?? "customer").toLowerCase()
  if (role === "vendor") return "vendor"
  if (role === "admin") return "admin"
  return "customer"
}

function RoleBadge({ role }: { role: "customer" | "vendor" | "admin" }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        <Crown className="size-3.5" />
        Admin
      </span>
    )
  }
  if (role === "vendor") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
        <Store className="size-3.5" />
        Vendor
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
      <UserRound className="size-3.5" />
      Customer
    </span>
  )
}

function StatusBadge({ blocked }: { blocked: boolean }) {
  return blocked ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
      <ShieldOff className="size-3.5" />
      Blocked
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  )
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: number | string
  hint: string
  icon: typeof UsersRound
  tone: "plum" | "emerald" | "sky" | "amber" | "rose"
}) {
  const tones: Record<typeof tone, string> = {
    plum: "from-[#B76E79]/15 via-white to-white text-[#9F5863]",
    emerald: "from-emerald-100/70 via-white to-white text-emerald-700",
    sky: "from-sky-100/70 via-white to-white text-sky-700",
    amber: "from-amber-100/70 via-white to-white text-amber-700",
    rose: "from-rose-100/80 via-white to-white text-rose-700",
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-200/70 bg-gradient-to-br p-4 shadow-2xs transition-shadow hover:shadow-md hover:shadow-rose-950/5 sm:p-5 dark:border-input dark:from-input/20 dark:via-card dark:to-card",
        tones[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-500 uppercase dark:text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-stone-900 sm:text-3xl dark:text-foreground">
            {value}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/80 shadow-2xs dark:border-input dark:bg-input/40">
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-2 text-[11px] text-stone-500 dark:text-muted-foreground">
        {hint}
      </p>
    </div>
  )
}

export function ManageUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const [viewUserId, setViewUserId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{
    user: AdminUser
    block: boolean
  } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function loadUsers() {
      try {
        const res = await authFetch(API_ENDPOINTS.users, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.message ?? "Could not load registered users.")
        }

        const json = await res.json()
        const list: AdminUser[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : []

        if (!active) return
        setUsers(list)
        setError(null)
      } catch (err) {
        if (!active || controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : "Failed to load users."
        setError(message)
        toast.error(message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUsers()

    return () => {
      active = false
      controller.abort()
    }
  }, [reloadKey])

  const stats = useMemo(() => {
    let vendors = 0
    let customers = 0
    let admins = 0
    let blocked = 0

    for (const user of users) {
      const role = normalizeRole(user)
      if (role === "vendor") vendors++
      else if (role === "admin") admins++
      else customers++
      if (user.isBlocked) blocked++
    }

    return { total: users.length, vendors, customers, admins, blocked }
  }, [users])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return users.filter((user) => {
      const role = normalizeRole(user)
      if (roleFilter !== "all" && role !== roleFilter) return false

      if (statusFilter === "blocked" && !user.isBlocked) return false
      if (statusFilter === "active" && user.isBlocked) return false

      if (query) {
        const name = (user.name ?? "").toLowerCase()
        const email = (user.email ?? "").toLowerCase()
        if (!name.includes(query) && !email.includes(query)) return false
      }

      return true
    })
  }, [users, roleFilter, statusFilter, searchQuery])

  const viewUser = users.find((user) => user._id === viewUserId) ?? null

  function reload() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  async function applyBlock(user: AdminUser, block: boolean) {
    setBusyId(user._id)
    try {
      const res = await authFetch(
        block
          ? API_ENDPOINTS.blockUser(user._id)
          : API_ENDPOINTS.unblockUser(user._id),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      )

      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(
          body?.message ?? `Could not ${block ? "block" : "unblock"} this user.`
        )
      }

      setUsers((prev) =>
        prev.map((item) =>
          item._id === user._id ? { ...item, isBlocked: block } : item
        )
      )
      toast.success(
        block
          ? `${user.name ?? "User"} has been blocked from the platform.`
          : `${user.name ?? "User"} can access the platform again.`
      )
      setConfirmTarget(null)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Failed to ${block ? "block" : "unblock"} user.`
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Editorial header */}
      <header className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-br from-[#2c1a1f] via-[#4a2b32] to-[#9F5863] px-6 py-7 text-white shadow-xl shadow-rose-950/15 sm:px-8 sm:py-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-rose-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-amber-200/15 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-rose-200/90 uppercase">
              <Sparkles className="size-3.5" />
              Admin console
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Manage{" "}
              <span className="text-rose-200 italic">registered users</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-100/80">
              Search the community, review account details and instantly block
              or restore access. Blocked members cannot reach protected platform
              features.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
              <UsersRound className="size-3.5 text-rose-200" />
              {loading ? "—" : stats.total} members
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-400/15 px-3.5 py-1.5 text-xs font-semibold text-rose-100 backdrop-blur-md">
              <ShieldOff className="size-3.5" />
              {loading ? "—" : stats.blocked} blocked
            </span>
          </div>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-5">
        <Metric
          label="All users"
          value={loading ? "—" : stats.total}
          hint="Every registered account"
          icon={UsersRound}
          tone="plum"
        />
        <Metric
          label="Customers"
          value={loading ? "—" : stats.customers}
          hint="Couples browsing services"
          icon={UserRound}
          tone="sky"
        />
        <Metric
          label="Vendors"
          value={loading ? "—" : stats.vendors}
          hint="Wedding service partners"
          icon={Store}
          tone="amber"
        />
        <Metric
          label="Admins"
          value={loading ? "—" : stats.admins}
          hint="Platform moderators"
          icon={Crown}
          tone="emerald"
        />
        <Metric
          label="Blocked"
          value={loading ? "—" : stats.blocked}
          hint="Access currently suspended"
          icon={ShieldOff}
          tone="rose"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-rose-200/75 bg-white/90 p-4 shadow-2xs sm:flex-row sm:items-center dark:border-input dark:bg-card/90">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search users by name or email"
            className={cn(controlClassName, "pr-9 pl-10")}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs font-medium text-stone-500 sm:flex dark:text-muted-foreground">
            <Filter className="size-3.5" />
            Filter
          </span>

          <Select
            value={roleFilter}
            items={ROLE_OPTIONS}
            onValueChange={(value) =>
              setRoleFilter(String(value) as RoleFilter)
            }
          >
            <SelectTrigger
              aria-label="Filter users by role"
              className={cn(controlClassName, "w-[10.5rem] justify-between")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            items={STATUS_OPTIONS}
            onValueChange={(value) =>
              setStatusFilter(String(value) as StatusFilter)
            }
          >
            <SelectTrigger
              aria-label="Filter users by status"
              className={cn(controlClassName, "w-[10.5rem] justify-between")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-[4.5rem] w-full rounded-2xl bg-rose-100/60 dark:bg-input/30"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-200/80 bg-white/90 px-6 py-16 text-center shadow-2xs dark:border-input dark:bg-card/90">
          <AlertCircle className="size-10 text-rose-500" />
          <h2 className="mt-3 font-heading text-xl font-semibold text-stone-900 dark:text-foreground">
            Unable to load users
          </h2>
          <p className="mt-1 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            {error}
          </p>
          <Button
            onClick={reload}
            variant="outline"
            className="mt-5 gap-2 rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
          >
            <RotateCcw className="size-4" />
            Retry
          </Button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-rose-300/80 bg-white/80 px-6 py-16 text-center dark:border-input dark:bg-card/50">
          <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
            <UsersRound className="size-6" />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
            No users match your filters
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-stone-600 dark:text-muted-foreground">
            Try a different name or email, or reset the role and status filters.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchQuery("")
              setRoleFilter("all")
              setStatusFilter("all")
            }}
            className="mt-5 rounded-full border-rose-200 hover:bg-rose-50 dark:border-input dark:hover:bg-input/50"
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white/90 shadow-xs dark:border-input dark:bg-card/90">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-gradient-to-r from-[#332025] via-[#543138] to-[#332025] text-[10px] font-semibold tracking-[0.16em] text-rose-100 uppercase">
                <tr>
                  <th className="py-4 pr-4 pl-6">Member</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Plan</th>
                  <th className="px-4 py-4">Joined</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="py-4 pr-6 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/70 dark:divide-input">
                {filteredUsers.map((user) => {
                  const role = normalizeRole(user)
                  const blocked = Boolean(user.isBlocked)
                  const isBusy = busyId === user._id
                  const isAdmin = role === "admin"

                  return (
                    <tr
                      key={user._id}
                      className={cn(
                        "group transition-colors hover:bg-rose-50/40 dark:hover:bg-input/10",
                        blocked && "bg-rose-50/30 dark:bg-rose-500/5"
                      )}
                    >
                      <td className="py-3.5 pr-4 pl-6">
                        <div className="flex items-center gap-3.5">
                          <Avatar className="size-10 ring-2 ring-rose-100 dark:ring-input">
                            {user.image ? (
                              <AvatarImage
                                src={user.image}
                                alt={user.name ?? ""}
                              />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-rose-100 to-rose-200/70 text-xs font-semibold text-[#9F5863]">
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-heading font-semibold text-stone-900 dark:text-foreground">
                              {user.name ?? "Unnamed user"}
                              {user.emailVerified ? (
                                <ShieldCheck
                                  className="size-3.5 shrink-0 text-emerald-500"
                                  aria-label="Email verified"
                                />
                              ) : null}
                            </p>
                            <p className="flex items-center gap-1 truncate text-xs text-stone-500 dark:text-muted-foreground">
                              <Mail className="size-3 shrink-0 text-[#B76E79]" />
                              {user.email ?? "No email on file"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <RoleBadge role={role} />
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-rose-200/80 bg-white px-2.5 py-0.5 text-[11px] font-medium capitalize dark:border-input dark:bg-input/30",
                            user.subscriptionPlan === "premium"
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-stone-600 dark:text-muted-foreground"
                          )}
                        >
                          {user.subscriptionPlan === "premium" ? (
                            <Crown className="size-3 text-amber-500" />
                          ) : null}
                          {user.subscriptionPlan ?? "free"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 text-xs whitespace-nowrap text-stone-600 dark:text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 text-stone-400" />
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge blocked={blocked} />
                      </td>

                      <td className="py-3.5 pr-6 pl-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setViewUserId(user._id)}
                            className="h-8 gap-1 rounded-lg border-rose-200/80 bg-white text-xs text-stone-700 hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:text-foreground dark:hover:bg-input/50"
                          >
                            <Eye className="size-3.5 text-[#B76E79]" />
                            View
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy || isAdmin}
                            title={
                              isAdmin
                                ? "Admin accounts cannot be blocked"
                                : undefined
                            }
                            onClick={() =>
                              setConfirmTarget({ user, block: !blocked })
                            }
                            className={cn(
                              "h-8 gap-1 rounded-lg border-rose-200/80 bg-white text-xs dark:border-input dark:bg-input/20",
                              blocked
                                ? "text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                : "text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10",
                              "disabled:opacity-40"
                            )}
                          >
                            {isBusy ? (
                              <LoaderCircle className="size-3.5 animate-spin" />
                            ) : blocked ? (
                              <ShieldCheck className="size-3.5" />
                            ) : (
                              <Ban className="size-3.5" />
                            )}
                            {blocked ? "Unblock" : "Block"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-1 border-t border-rose-100 bg-rose-50/40 px-6 py-3 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between dark:border-input dark:bg-input/20 dark:text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-semibold text-stone-700 dark:text-foreground">
                {filteredUsers.length}
              </span>{" "}
              of {users.length} registered users
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldOff className="size-3.5 text-[#B76E79]" />
              Blocked accounts lose access to dashboards and protected actions.
            </span>
          </div>
        </div>
      )}

      {/* User details dialog */}
      <Dialog
        open={Boolean(viewUser)}
        onOpenChange={(open) => !open && setViewUserId(null)}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl border-rose-200/80 bg-[#FDFBF7] p-0 sm:max-w-lg dark:border-input dark:bg-card">
          {viewUser ? (
            <>
              <div className="relative overflow-hidden bg-gradient-to-br from-[#332025] via-[#543138] to-[#9F5863] px-6 pt-7 pb-8 text-white">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-rose-300/20 blur-3xl"
                />
                <div className="relative flex items-center gap-4">
                  <Avatar className="size-16 ring-4 ring-white/20">
                    {viewUser.image ? (
                      <AvatarImage
                        src={viewUser.image}
                        alt={viewUser.name ?? ""}
                      />
                    ) : null}
                    <AvatarFallback className="bg-white/15 text-lg font-semibold text-white">
                      {getUserInitials(viewUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle className="truncate font-heading text-2xl font-semibold text-white">
                      {viewUser.name ?? "Unnamed user"}
                    </DialogTitle>
                    <DialogDescription className="truncate text-sm text-rose-100/80">
                      {viewUser.email ?? "No email on file"}
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge role={normalizeRole(viewUser)} />
                  <StatusBadge blocked={Boolean(viewUser.isBlocked)} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-rose-200/80 bg-white px-2.5 py-1 text-[11px] font-medium capitalize dark:border-input dark:bg-input/30",
                      viewUser.subscriptionPlan === "premium"
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-stone-600 dark:text-muted-foreground"
                    )}
                  >
                    {viewUser.subscriptionPlan === "premium" ? (
                      <Crown className="size-3 text-amber-500" />
                    ) : null}
                    {viewUser.subscriptionPlan ?? "free"} plan
                  </Badge>
                </div>

                <dl className="grid gap-3 rounded-2xl border border-rose-200/75 bg-white p-4 text-sm dark:border-input dark:bg-input/20">
                  {[
                    { label: "User ID", value: viewUser._id },
                    { label: "Email", value: viewUser.email ?? "—" },
                    {
                      label: "Email verified",
                      value: viewUser.emailVerified
                        ? "Verified"
                        : "Not verified",
                    },
                    {
                      label: "Member since",
                      value: formatDate(viewUser.createdAt, "long"),
                    },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="flex items-start justify-between gap-4 border-b border-rose-100/70 pb-2.5 last:border-0 last:pb-0 dark:border-input"
                    >
                      <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-muted-foreground">
                        {field.label}
                      </dt>
                      <dd className="max-w-[60%] truncate text-right font-medium text-stone-800 dark:text-foreground">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <DialogFooter className="gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewUserId(null)}
                    className={cn(
                      "rounded-full border-rose-200 dark:border-input",
                      focusRingClassName
                    )}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      busyId === viewUser._id ||
                      normalizeRole(viewUser) === "admin"
                    }
                    onClick={() =>
                      setConfirmTarget({
                        user: viewUser,
                        block: !viewUser.isBlocked,
                      })
                    }
                    className={cn(
                      "gap-1.5 rounded-full",
                      viewUser.isBlocked
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-rose-600 text-white hover:bg-rose-700",
                      focusRingClassName
                    )}
                  >
                    {viewUser.isBlocked ? (
                      <ShieldCheck className="size-4" />
                    ) : (
                      <Ban className="size-4" />
                    )}
                    {viewUser.isBlocked ? "Unblock user" : "Block user"}
                  </Button>
                </DialogFooter>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Block / unblock confirmation */}
      <Dialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent className="rounded-3xl border-rose-200/80 bg-[#FDFBF7] sm:max-w-md dark:border-input dark:bg-card">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-semibold text-stone-900 dark:text-foreground">
              {confirmTarget?.block ? "Block this account?" : "Restore access?"}
            </DialogTitle>
            <DialogDescription className="text-stone-600 dark:text-muted-foreground">
              {confirmTarget?.block ? (
                <>
                  <span className="font-semibold text-stone-900 dark:text-foreground">
                    {confirmTarget.user.name ?? "This user"}
                  </span>{" "}
                  will be signed out of protected areas and can no longer use
                  dashboards, bookings or vendor tools until unblocked.
                </>
              ) : (
                <>
                  <span className="font-semibold text-stone-900 dark:text-foreground">
                    {confirmTarget?.user.name ?? "This user"}
                  </span>{" "}
                  will regain access to their dashboard and protected platform
                  features.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(busyId)}
              onClick={() => setConfirmTarget(null)}
              className={cn(
                "rounded-full border-rose-200 dark:border-input",
                focusRingClassName
              )}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={Boolean(busyId)}
              onClick={() =>
                confirmTarget &&
                applyBlock(confirmTarget.user, confirmTarget.block)
              }
              className={cn(
                "gap-2 rounded-full text-white",
                confirmTarget?.block
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700",
                focusRingClassName
              )}
            >
              {busyId ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : confirmTarget?.block ? (
                <Ban className="size-4" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {confirmTarget?.block ? "Block account" : "Unblock account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManageUsers
