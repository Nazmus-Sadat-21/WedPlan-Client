"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Heart,
  LoaderCircle,
  ImagePlus,
  Store,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authControlClassName, authFocusRingClassName } from "@/components/auth/field-styles"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { PasswordField } from "@/components/auth/PasswordField"
import { authClient } from "@/lib/auth-client"
import { getUserInitials } from "@/lib/format"
import { uploadToImgbb } from "@/lib/imgbb"
import { dashboardPathForRole, type SignupRole } from "@/lib/roles"
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from "@/lib/validation"
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
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)
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
    if (password === "")
      return "Min 6 characters with one uppercase and one lowercase letter."
    return undefined
  }, [password])

  // Live re-enter password validation (updates when either field changes).
  const confirmError =
    confirmTouched || confirmPassword !== ""
      ? confirmPassword === ""
        ? "Please re-enter your password."
        : confirmPassword !== password
          ? "Passwords do not match."
          : null
      : null
  const passwordsMatch = confirmPassword !== "" && confirmPassword === password

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
    setConfirmTouched(true)

    if (
      errors.fullName ||
      errors.email ||
      errors.password ||
      confirmPassword === "" ||
      confirmPassword !== password
    ) {
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
        const code = String((error as { code?: unknown }).code ?? "")
        const status = Number((error as { status?: unknown }).status ?? 0)

        if (status === 503 || code === "AUTH_UNAVAILABLE") {
          toast.error(
            "Account creation is temporarily unavailable. Please try again in a moment."
          )
          return
        }

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
                  "rounded-xl border bg-white/70 p-3 text-left transition-all dark:bg-input/20",
                  authFocusRingClassName,
                  active
                    ? "border-[#B76E79] bg-rose-50/80 ring-1 ring-[#B76E79]/60 dark:bg-input/40"
                    : "border-rose-200/80 hover:border-[#B76E79]/50 dark:border-input"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-[#B76E79] text-white"
                      : "bg-rose-100/80 text-[#9c6470] dark:bg-input/40 dark:text-muted-foreground"
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
            className={cn(authControlClassName, "pl-9")}
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
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <div className="relative">
            <Store className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="businessName"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="e.g. Rosewood Events"
              autoComplete="organization"
              className={cn(authControlClassName, "pl-9")}
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
          className={authControlClassName}
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

      {/* Re-enter password */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-confirm-password">Re-enter password</Label>
        <div className="relative">
          <Input
            id="signup-confirm-password"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            onBlur={() => setConfirmTouched(true)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            aria-invalid={Boolean(confirmError)}
            className={cn(authControlClassName, "pr-10")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((value) => !value)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showConfirm ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {confirmError ? (
          <p className="text-xs text-destructive">{confirmError}</p>
        ) : passwordsMatch ? (
          <p className="text-xs text-emerald-600">Passwords match.</p>
        ) : null}
      </div>

      {/* Profile image (optional, uploaded to ImgBB) */}
      <div className="space-y-1.5">
        <Label htmlFor="profileImage">
          Profile image{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="Profile preview" />
            ) : null}
            <AvatarFallback className="bg-champagne-500/15 text-champagne-700">
              {getUserInitials(fullName || undefined)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <label
              htmlFor="profileImage"
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-rose-200/90 bg-white/70 px-3 text-sm font-medium text-foreground transition-colors hover:bg-rose-50/70 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
                authFocusRingClassName
              )}
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

      <Button
        type="submit"
        disabled={submitting}
        className="h-10 w-full gap-2 bg-[#B76E79] text-[#fffdf8] hover:bg-[#a25a64] focus-visible:border-[#B76E79] focus-visible:ring-[#B76E79]/30 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"
      >
        {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {submitting ? "Creating account…" : "Create Account"}
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-rose-200/80 dark:bg-input" />
        <span className="text-xs text-stone-500 dark:text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-rose-200/80 dark:bg-input" />
      </div>

      <GoogleSignInButton
        callbackURL="/sign-up"
        role={role}
        disabled={submitting}
        label={`Sign up with Google as ${role === "vendor" ? "a vendor" : "a customer"}`}
      />

      <p className="text-center text-sm text-stone-600 dark:text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-[#B76E79] underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}