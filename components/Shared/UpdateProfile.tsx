"use client"

import { useEffect, useRef, useState } from "react"
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Crown,
  LoaderCircle,
  Lock,
  Mail,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  User as UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/lib/auth-client"
import { formatDate } from "@/lib/format"
import { uploadToImgbb } from "@/lib/imgbb"
import { cn } from "@/lib/utils"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const controlClassName =
  "h-11 rounded-2xl border-rose-200/90 bg-white/80 text-sm transition-all focus-visible:border-[#B76E79] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:border-input dark:bg-input/20 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

const focusRingClassName =
  "outline-none focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

export type UserProfileRecord = {
  id?: string
  _id?: string
  name?: string | null
  email?: string | null
  emailVerified?: boolean | null
  image?: string | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
  role?: string | null
  isBlocked?: boolean | null
  businessName?: string | null
  subscriptionPlan?: string | null
}

type UpdateProfileProps = {
  data?:
    | {
        user?: UserProfileRecord | null
      }
    | UserProfileRecord
    | null
  onUpdated?: (updatedUser: UserProfileRecord) => void
}

function extractUser(
  propData: UpdateProfileProps["data"],
  sessionData: ReturnType<typeof useSession>["data"]
): UserProfileRecord | null {
  if (propData && typeof propData === "object") {
    if ("user" in propData && propData.user) return propData.user
    if (
      "email" in propData ||
      "name" in propData ||
      "_id" in propData ||
      "id" in propData
    ) {
      return propData as UserProfileRecord
    }
  }
  return (sessionData?.user as UserProfileRecord | undefined) ?? null
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "U"
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export function UpdateProfile({ data, onUpdated }: UpdateProfileProps) {
  const { data: sessionData, isPending: sessionLoading, refetch } = useSession()
  const profile = extractUser(data, sessionData)

  const [name, setName] = useState("")
  const [businessName, setBusinessName] = useState("")

  const [pickedFile, setPickedFile] = useState<{
    file: File
    previewUrl: string
  } | null>(null)
  const [existingImage, setExistingImage] = useState<string>("")
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)

  const [fieldError, setFieldError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submittingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const initializedIdRef = useRef<string | null>(null)

  const profileId = profile?._id ?? profile?.id ?? null
  // Only vendors have a business name (admins and customers do not)
  const isVendor = String(profile?.role ?? "").toLowerCase() === "vendor"

  useEffect(() => {
    if (!profile) return
    const currentKey = String(profile._id ?? profile.id ?? profile.email ?? "")
    if (initializedIdRef.current === currentKey && submittingRef.current) return

    initializedIdRef.current = currentKey
    setName(profile.name ?? "")
    setBusinessName(profile.businessName ?? "")
    setExistingImage(profile.image ?? "")
    setRemoveCurrentImage(false)
  }, [profile])

  useEffect(() => {
    previewUrlRef.current = pickedFile?.previewUrl ?? null
  }, [pickedFile])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error(`"${file.name}" is not a valid image file.`)
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`"${file.name}" exceeds the 5 MB limit.`)
      return
    }

    if (pickedFile?.previewUrl) {
      URL.revokeObjectURL(pickedFile.previewUrl)
    }

    setPickedFile({
      file,
      previewUrl: URL.createObjectURL(file),
    })
    setRemoveCurrentImage(false)
    setFieldError(null)
  }

  function clearPickedFile() {
    if (pickedFile?.previewUrl) {
      URL.revokeObjectURL(pickedFile.previewUrl)
    }
    setPickedFile(null)
  }

  function handleResetForm() {
    clearPickedFile()
    setName(profile?.name ?? "")
    setBusinessName(profile?.businessName ?? "")
    setExistingImage(profile?.image ?? "")
    setRemoveCurrentImage(false)
    setFieldError(null)
    toast.info("Reverted unsaved changes.")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    if (!profileId) {
      toast.error("User ID not found. Please sign in again.")
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      setFieldError("Display name is required.")
      toast.error("Please enter your name.")
      return
    }
    if (trimmedName.length < 2) {
      setFieldError("Display name must be at least 2 characters.")
      toast.error("Name must be at least 2 characters.")
      return
    }

    setFieldError(null)
    submittingRef.current = true
    setSubmitting(true)

    try {
      let finalImageUrl: string | null = removeCurrentImage
        ? null
        : existingImage || null

      if (pickedFile) {
        finalImageUrl = await uploadToImgbb(pickedFile.file)
      }

      const payload: {
        name: string
        image: string | null
        businessName?: string
      } = {
        name: trimmedName,
        image: finalImageUrl,
      }

      if (isVendor) {
        payload.businessName = businessName.trim()
      }

      const baseUrl = (process.env.NEXT_PUBLIC_SERVER_API ?? "").replace(
        /\/+$/,
        ""
      )
      const endpoint = baseUrl
        ? `${baseUrl}/users/profile/${encodeURIComponent(String(profileId))}`
        : `/users/profile/${encodeURIComponent(String(profileId))}`

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(
          errBody?.message ?? "Failed to update profile. Please try again."
        )
      }

      const responseJson = await res.json().catch(() => null)
      const serverDoc =
        responseJson?.value ??
        responseJson?.user ??
        responseJson?.data ??
        responseJson

      const updatedRecord: UserProfileRecord = {
        ...(profile ?? {}),
        ...(typeof serverDoc === "object" && serverDoc !== null
          ? serverDoc
          : {}),
        name: trimmedName,
        image: finalImageUrl,
        ...(payload.businessName !== undefined
          ? { businessName: payload.businessName }
          : {}),
        role: profile?.role,
        subscriptionPlan: profile?.subscriptionPlan,
        email: profile?.email,
      }

      setName(updatedRecord.name ?? trimmedName)
      setExistingImage(updatedRecord.image ?? "")
      setRemoveCurrentImage(false)
      clearPickedFile()
      setLastSavedAt(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      )

      if (typeof refetch === "function") {
        await refetch().catch(() => null)
      }
      onUpdated?.(updatedRecord)

      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update your profile."
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const activePreviewUrl =
    pickedFile?.previewUrl ?? (!removeCurrentImage ? existingImage : "")
  const roleLabel = profile?.role ? String(profile.role) : "member"
  const planLabel = profile?.subscriptionPlan ?? "free"
  const isPremium = String(planLabel).toLowerCase() === "premium"
  const isVerified = Boolean(profile?.emailVerified)
  const isBlocked = Boolean(profile?.isBlocked)

  const hasChanges =
    Boolean(pickedFile) ||
    removeCurrentImage ||
    name.trim() !== (profile?.name ?? "").trim() ||
    (isVendor &&
      businessName.trim() !== (profile?.businessName ?? "").trim())

  const summaryTiles = [
    {
      label: "Account role",
      value: roleLabel,
      icon: Briefcase,
      valueClass: "text-stone-900 dark:text-foreground",
    },
    {
      label: "Subscription",
      value: planLabel,
      icon: Crown,
      valueClass: "text-[#9F5863] dark:text-champagne-400",
    },
    {
      label: "Email status",
      value: isVerified ? "Verified" : "Not verified",
      icon: isVerified ? BadgeCheck : Mail,
      valueClass: isVerified
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-amber-700 dark:text-amber-300",
    },
    {
      label: "Member since",
      value: profile?.createdAt ? formatDate(String(profile.createdAt)) : "—",
      icon: Calendar,
      valueClass: "text-stone-900 dark:text-foreground",
    },
  ]

  if (sessionLoading && !profile) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-72 w-full rounded-3xl bg-rose-100/60 dark:bg-input/30" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-20 rounded-2xl bg-rose-100/60 dark:bg-input/30"
            />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-[380px] rounded-3xl bg-rose-100/60 dark:bg-input/30 lg:col-span-8" />
          <Skeleton className="h-[380px] rounded-3xl bg-rose-100/60 dark:bg-input/30 lg:col-span-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      {/* HERO: cover + overlapping identity */}
      <section className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white/95 shadow-xs dark:border-input dark:bg-card/90">
        {/* Gradient cover */}
        <div className="relative h-36 overflow-hidden bg-gradient-to-r from-[#fff8f6] via-[#fceced] to-[#f4d8dc] px-4 pt-4 dark:from-card/90 dark:via-card dark:to-input/30 sm:h-44 sm:px-8 sm:pt-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-[#B76E79]/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 left-1/4 size-56 rounded-full bg-amber-200/30 blur-3xl"
          />

          <div className="relative flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-[#B76E79] uppercase backdrop-blur-xs dark:border-input dark:bg-input/30">
              <Sparkles className="size-3 text-[#B76E79]" />
              Profile Studio
            </span>

            {lastSavedAt ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/95 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5" />
                Saved {lastSavedAt}
              </span>
            ) : null}
          </div>
        </div>

        {/* Identity row */}
        <div className="relative px-4 pb-6 sm:px-8 sm:pb-7">
          <div className="-mt-14 flex flex-col items-center gap-4 text-center sm:-mt-16 sm:flex-row sm:items-end sm:text-left">
            {/* Avatar with camera trigger */}
            <div className="group relative size-28 shrink-0 sm:size-32">
              <div className="flex size-full items-center justify-center overflow-hidden rounded-[1.75rem] border-4 border-white bg-[#FDFBF7] shadow-lg shadow-rose-950/10 ring-1 ring-rose-200/80 dark:border-card dark:bg-input/30 dark:ring-input">
                {activePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- supports local blob previews and external image URLs
                  <img
                    src={activePreviewUrl}
                    alt={name || "Profile avatar"}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="font-heading text-3xl font-semibold text-[#B76E79] sm:text-4xl dark:text-champagne-400">
                    {getInitials(name || profile?.name)}
                  </span>
                )}
              </div>

              <label
                htmlFor="profileImageInput"
                title="Upload new profile photo"
                className={cn(
                  "absolute -right-1.5 -bottom-1.5 flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#B76E79] text-[#fffdf8] shadow-md transition-transform hover:scale-105 hover:bg-[#a25c67] dark:border-card",
                  focusRingClassName,
                  submitting && "pointer-events-none opacity-60"
                )}
              >
                <Camera className="size-4" />
                <span className="sr-only">Change profile photo</span>
              </label>
            </div>

            {/* Name + email + badges */}
            <div className="min-w-0 flex-1 space-y-2 pb-0.5">
              <h1 className="font-heading text-2xl font-semibold tracking-tight break-words text-stone-900 sm:text-3xl dark:text-foreground">
                {name.trim() || profile?.name || "Your Profile"}
              </h1>

              <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-stone-500 sm:justify-start sm:text-sm dark:text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 break-all">
                  <Mail className="size-3.5 shrink-0 text-[#B76E79]" />
                  {profile?.email}
                </span>
                {isVendor && businessName.trim() ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#9F5863] dark:text-champagne-400">
                    <Building2 className="size-3.5 shrink-0" />
                    {businessName.trim()}
                  </span>
                ) : null}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge
                  variant="outline"
                  className="gap-1.5 rounded-full border-rose-200/90 bg-white/85 px-3 py-1 text-xs font-semibold text-[#9F5863] capitalize dark:border-input dark:bg-input/30 dark:text-champagne-400"
                >
                  <Briefcase className="size-3" />
                  {roleLabel}
                </Badge>
                <Badge
                  className={cn(
                    "gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                    isPremium
                      ? "border-amber-300/80 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                      : "border-rose-200 bg-rose-50 text-stone-700 dark:border-input dark:bg-input/30 dark:text-foreground"
                  )}
                >
                  <Crown className="size-3" />
                  {planLabel}
                </Badge>
                {isVerified ? (
                  <span
                    title="Verified email"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  >
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </span>
                ) : null}
              </div>
            </div>

            {/* Quick photo actions */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <label
                htmlFor="profileImageInput"
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-rose-200 bg-[#FDFBF7] px-4 text-xs font-semibold text-[#9F5863] transition-colors hover:border-[#B76E79] hover:bg-rose-50 dark:border-input dark:bg-input/20 dark:text-champagne-400",
                  focusRingClassName,
                  submitting && "pointer-events-none opacity-60"
                )}
              >
                <Camera className="size-3.5" />
                {activePreviewUrl ? "Change photo" : "Upload photo"}
              </label>

              {pickedFile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={submitting}
                  onClick={clearPickedFile}
                  className="h-10 gap-1 rounded-full px-3 text-xs text-stone-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="size-3.5" />
                  Discard
                </Button>
              ) : activePreviewUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={submitting}
                  onClick={() => {
                    setRemoveCurrentImage(true)
                    setExistingImage("")
                  }}
                  className="h-10 gap-1 rounded-full px-3 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {summaryTiles.map((tile) => (
          <div
            key={tile.label}
            className="flex items-center gap-3 rounded-2xl border border-rose-200/75 bg-white/95 p-3.5 shadow-2xs transition-shadow hover:shadow-md hover:shadow-rose-950/5 sm:p-4 dark:border-input dark:bg-card/90"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#B76E79] ring-1 ring-rose-100 dark:bg-input/40 dark:text-champagne-400 dark:ring-input">
              <tile.icon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-stone-400 uppercase dark:text-muted-foreground">
                {tile.label}
              </p>
              <p
                className={cn(
                  "truncate text-sm font-semibold capitalize sm:text-base",
                  tile.valueClass
                )}
              >
                {tile.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* WORKSPACE: form + sidebar */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-12 lg:items-start">
        {/* Editable form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={submitting || sessionLoading}
          className="space-y-5 lg:col-span-8"
        >
          <input
            ref={fileInputRef}
            id="profileImageInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            disabled={submitting}
          />

          {/* Personal & brand details */}
          <section className="rounded-3xl border border-rose-200/80 bg-white/95 p-5 shadow-xs sm:p-8 dark:border-input dark:bg-card/90">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-rose-100 pb-5 dark:border-input">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-rose-100/80 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
                  <UserIcon className="size-5" />
                </span>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-stone-900 dark:text-foreground">
                    Personal &amp; Brand Details
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Keep your public identity accurate for bookings and
                    reviews.
                  </p>
                </div>
              </div>
              {pickedFile ? (
                <span className="max-w-full truncate rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-[#9F5863] dark:bg-input/30 dark:text-champagne-400">
                  New photo ready: {pickedFile.file.name}
                </span>
              ) : null}
            </header>

            <div
              className={cn(
                "mt-6 grid gap-5",
                isVendor && "sm:grid-cols-2"
              )}
            >
              <div className="space-y-1.5">
                <Label htmlFor="profileName">Full name *</Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profileName"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      if (fieldError) setFieldError(null)
                    }}
                    placeholder="e.g. Ahmed Jobayer"
                    autoComplete="name"
                    aria-invalid={Boolean(fieldError)}
                    className={cn(controlClassName, "pl-10")}
                    disabled={submitting}
                  />
                </div>
                {fieldError ? (
                  <p className="text-xs text-destructive">{fieldError}</p>
                ) : null}
              </div>

              {isVendor ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="businessName">Business name</Label>
                    <span className="text-[11px] text-muted-foreground">
                      Storefront
                    </span>
                  </div>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="e.g. RoseWood"
                      autoComplete="organization"
                      className={cn(controlClassName, "pl-10")}
                      disabled={submitting}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Sign-in email (locked) */}
          <section className="rounded-3xl border border-rose-200/80 bg-white/95 p-5 shadow-xs sm:p-8 dark:border-input dark:bg-card/90">
            <header className="flex items-center gap-3 border-b border-rose-100 pb-5 dark:border-input">
              <span className="flex size-10 items-center justify-center rounded-xl bg-rose-100/80 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400">
                <Mail className="size-5" />
              </span>
              <div>
                <h2 className="font-heading text-xl font-semibold text-stone-900 dark:text-foreground">
                  Sign-in Email
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Used to sign in and receive booking updates.
                </p>
              </div>
            </header>

            <div className="mt-6 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="profileEmail">Email address</Label>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="size-3" />
                  Locked
                </span>
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profileEmail"
                  value={profile?.email ?? ""}
                  readOnly
                  disabled
                  className={cn(
                    controlClassName,
                    "cursor-not-allowed bg-stone-100/80 pl-10 text-stone-600 dark:bg-input/10 dark:text-muted-foreground"
                  )}
                />
              </div>
            </div>
          </section>

          {/* Sticky action bar: always reachable, even on small phones */}
          <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-2xl border border-rose-200/80 bg-white/90 p-3 shadow-xl shadow-rose-950/10 backdrop-blur-xl sm:p-3.5 dark:border-input dark:bg-card/90">
            <p
              className="flex min-w-0 items-center gap-2 text-xs font-medium text-stone-600 dark:text-muted-foreground"
              aria-live="polite"
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  hasChanges ? "animate-pulse bg-amber-400" : "bg-emerald-400"
                )}
              />
              <span className="truncate">
                {hasChanges ? "Unsaved changes" : "All changes saved"}
              </span>
            </p>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting || !hasChanges}
                onClick={handleResetForm}
                className={cn(
                  "h-10 gap-1.5 rounded-full border-rose-200 px-3.5 text-xs font-semibold text-stone-700 hover:bg-rose-50 disabled:opacity-45 sm:px-5 dark:border-input dark:text-foreground",
                  focusRingClassName
                )}
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Reset changes</span>
                <span className="sm:hidden">Reset</span>
              </Button>

              <Button
                type="submit"
                disabled={submitting}
                className={cn(
                  "h-10 gap-2 rounded-full bg-[#B76E79] px-5 text-xs font-semibold text-[#fffdf8] shadow-sm transition-all hover:bg-[#a25c67] sm:px-7",
                  focusRingClassName
                )}
              >
                {submitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {submitting ? "Saving…" : "Save Profile"}
              </Button>
            </div>
          </div>
        </form>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:col-span-4">
          {/* Account standing */}
          <div className="rounded-3xl border border-rose-200/80 bg-white/95 p-5 shadow-xs sm:p-6 dark:border-input dark:bg-card/90">
            <div className="flex items-center gap-2.5 border-b border-rose-100 pb-4 dark:border-input">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  isBlocked
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
                    : "bg-rose-100/80 text-[#B76E79] dark:bg-input/40 dark:text-champagne-400"
                )}
              >
                {isBlocked ? (
                  <ShieldAlert className="size-4.5" />
                ) : (
                  <ShieldCheck className="size-4.5" />
                )}
              </span>
              <div>
                <h2 className="font-heading text-base font-semibold text-stone-900 dark:text-foreground">
                  Account standing
                </h2>
                <p className="text-xs text-muted-foreground">
                  Read-only system attributes
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-[#FDFBF7] px-3.5 py-3 dark:border-input dark:bg-input/15">
                <dt className="text-stone-500 dark:text-muted-foreground">
                  Status
                </dt>
                <dd
                  className={cn(
                    "inline-flex items-center gap-1.5 font-semibold",
                    isBlocked
                      ? "text-rose-700 dark:text-rose-300"
                      : "text-emerald-700 dark:text-emerald-300"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isBlocked ? "bg-rose-500" : "bg-emerald-500"
                    )}
                  />
                  {isBlocked ? "Blocked" : "Active"}
                </dd>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-[#FDFBF7] px-3.5 py-3 dark:border-input dark:bg-input/15">
                <dt className="text-stone-500 dark:text-muted-foreground">
                  Verification
                </dt>
                <dd className="inline-flex items-center gap-1 font-medium text-stone-700 dark:text-foreground">
                  {isVerified ? (
                    <>
                      <BadgeCheck className="size-3.5 text-emerald-600" />
                      Verified
                    </>
                  ) : (
                    "Pending"
                  )}
                </dd>
              </div>

              {profile?.updatedAt ? (
                <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-[#FDFBF7] px-3.5 py-3 dark:border-input dark:bg-input/15">
                  <dt className="text-stone-500 dark:text-muted-foreground">
                    Last updated
                  </dt>
                  <dd className="font-medium text-stone-700 dark:text-foreground">
                    {formatDate(String(profile.updatedAt))}
                  </dd>
                </div>
              ) : null}
            </dl>

            <p className="mt-4 rounded-2xl bg-rose-50/70 p-3 text-[11px] leading-relaxed text-stone-600 dark:bg-input/20 dark:text-muted-foreground">
              For security, role and subscription tiers cannot be changed from
              self-service profile settings.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default UpdateProfile