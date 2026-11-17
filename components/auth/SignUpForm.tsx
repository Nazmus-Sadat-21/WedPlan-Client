"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, LoaderCircle, ImagePlus, Store, UserRound } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordField } from "@/components/auth/PasswordField"
import { authClient } from "@/lib/auth-client"
import { getUserInitials } from "@/lib/format"
import { uploadToImgbb } from "@/lib/imgbb"
import { dashboardPathForRole, type SignupRole } from "@/lib/roles"
import { validateEmail, validatePassword, validateRequired } from "@/lib/validation"
import { cn } from "@/lib/utils"

const ROLE_OPTIONS: {
  value: SignupRole
  label: string
  description: string
  icon: typeof Heart
}[] = [
  {
    value: "customer",
    label: "Customer",
    description: "Plan my wedding and book services",
    icon: Heart,
  },
  {
    value: "vendor",
    label: "Vendor",
    description: "Offer wedding services to couples",
    icon: Store,
  },
]

export function SignUpForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<SignupRole>("customer")
  const [businessName, setBusinessName] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string | null
    email?: string | null
    password?: string | null
  }>({})
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  // Remember the last object URL so cleanup revokes the right one.
  const previousUrl = useRef<string | null>(null)
  useEffect(() => {
    previousUrl.current = previewUrl
  }, [previewUrl])
  useEffect(() => {
    return () => {
      if (previousUrl.current) URL.revokeObjectURL(previousUrl.current)
    }
  }, [])

  const passwordHint = useMemo(() => {
    if (password === "") return "Min 6 characters with one uppercase and one lowercase letter."
    return undefined
  }, [password])

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG or WebP).")
      event.target.value = ""
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.")
      event.target.value = ""
      return
    }

    setImageFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  function clearImage() {
    setImageFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const errors = {
      fullName: validateRequired(fullName, "Full name"),
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setFieldErrors(errors)

    if (errors.fullName || errors.email || errors.password) {
      toast.error("Please fix the highlighted fields.")
      return
    }

    submittingRef.current = true
    setSubmitting(true)

    try {
      // Optional profile image → ImgBB before creating the account.
      let imageUrl: string | undefined
      if (imageFile) {
        try {
          imageUrl = await uploadToImgbb(imageFile)
        } catch (uploadError) {
          toast.error(
            uploadError instanceof Error
              ? uploadError.message
              : "Profile image upload failed."
          )
          submittingRef.current = false
          setSubmitting(false)
          return
        }
      }

      const { data, error } = await authClient.signUp.email({
        name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        ...(businessName.trim() ? { businessName: businessName.trim() } : {}),
        ...(imageUrl ? { image: imageUrl } : {}),
      })

      if (error) {
        toast.error(error.message ?? "Could not create your account.")
        return
      }

      toast.success("Account created — welcome to WedPlan!")
      router.push(dashboardPathForRole(data?.user?.role ?? role))
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Role selection */}
      <div className="space-y-1.5">
        <Label>Account type</Label>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map((option) => {
            const active = role === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "border-champagne-500 bg-champagne-500/10 ring-1 ring-champagne-500/50"
                    : "bg-card hover:border-champagne-500/40"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    active
                      ? "bg-champagne-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <option.icon className="size-4" />
                </span>
                <span className="mt-2 block text-sm font-semibold text-foreground">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.fullName)}
            className="h-10 pl-9"
          />
        </div>
        {fieldErrors.fullName ? (
          <p className="text-xs text-destructive">{fieldErrors.fullName}</p>
        ) : null}
      </div>

      {/* Business name (vendors only) */}
      {role === "vendor" ? (
        <div className="space-y-1.5">
          <Label htmlFor="businessName">
            Business name{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <div className="relative">
            <Store className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="businessName"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="e.g. Rosewood Events"
              autoComplete="organization"
              className="h-10 pl-9"
            />
          </div>
        </div>
      ) : null}

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          className="h-10"
        />
        {fieldErrors.email ? (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        ) : null}
      </div>

      {/* Password */}
      <PasswordField
        id="signup-password"
        value={password}
        onValueChange={setPassword}
        error={fieldErrors.password}
        hint={
          passwordHint ??
          "Use at least 6 characters with one uppercase and one lowercase letter."
        }
        autoComplete="new-password"
      />

      {/* Profile image (optional, uploaded to ImgBB) */}
      <div className="space-y-1.5">
        <Label htmlFor="profileImage">
          Profile image{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            {previewUrl ? <AvatarImage src={previewUrl} alt="Profile preview" /> : null}
            <AvatarFallback className="bg-champagne-500/15 text-champagne-700">
              {getUserInitials(fullName || undefined)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <label
              htmlFor="profileImage"
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ImagePlus className="size-4" />
              {imageFile ? "Change image" : "Upload photo"}
            </label>
            <input
              ref={fileInputRef}
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="sr-only"
            />
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {imageFile ? imageFile.name : "PNG, JPG or WebP — up to 5 MB"}
            </p>
          </div>
          {imageFile ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearImage}
              className="text-destructive"
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="h-10 w-full gap-2">
        {submitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : null}
        {submitting ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-champagne-700 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
