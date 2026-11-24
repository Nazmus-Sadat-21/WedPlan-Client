"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Heart,
  ImagePlus,
  LoaderCircle,
  Store,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  authControlClassName,
  authFocusRingClassName,
} from "@/components/auth/field-styles"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"
import { PasswordField } from "@/components/auth/PasswordField"
import { authClient } from "@/lib/auth-client"
import { getUserInitials } from "@/lib/format"
import { uploadToImgbb } from "@/lib/imgbb"
import { EASE_OUT, fadeUp, springSoft, staggerContainer } from "@/lib/motion"
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

const STRENGTH_META = [
  { label: "Too short", color: "bg-rose-400", text: "text-rose-500" },
  { label: "Weak", color: "bg-rose-400", text: "text-rose-500" },
  { label: "Fair", color: "bg-amber-400", text: "text-amber-600" },
  { label: "Good", color: "bg-sky-400", text: "text-sky-600" },
  { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
] as const

export function SignUpForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reduceMotion = useReducedMotion()

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

  const strength = useMemo(() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 6) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return Math.min(score, 4)
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

  const stagger = staggerContainer(0.06, 0.06)
  const strengthMeta = STRENGTH_META[strength]

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={reduceMotion ? undefined : stagger}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      className="space-y-4"
      noValidate
    >
      {/* Role selection */}
      <motion.div variants={reduceMotion ? undefined : fadeUp} className="space-y-1.5">
        <Label>I&apos;m joining as</Label>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map((option) => {
            const active = role === option.value
            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={active}
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                transition={springSoft}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-3 text-left transition-colors dark:bg-input/20",
                  authFocusRingClassName,
                  active
                    ? "border-[#B76E79]/70 bg-rose-50/80 dark:bg-input/40"
                    : "border-rose-200/80 bg-white/60 hover:border-[#B76E79]/50 dark:border-input"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="signup-role-active"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="pointer-events-none absolute inset-0 -z-0 rounded-2xl ring-1 ring-[#B76E79]/60"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-[#B76E79] text-white"
                      : "bg-rose-100/80 text-[#9c6470] dark:bg-input/40 dark:text-muted-foreground"
                  )}
                >
                  <option.icon className="size-4" />
                </span>
                <span className="relative mt-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {option.label}
                  <AnimatePresence>
                    {active ? (
                      <motion.span
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
                        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.5 }}
                        className="flex size-4 items-center justify-center rounded-full bg-[#B76E79] text-white"
                      >
                        <Check className="size-2.5" strokeWidth={3} />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
                <span className="relative mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Full name */}
      <motion.div variants={reduceMotion ? undefined : fadeUp} className="space-y-1.5">
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
            className={cn(authControlClassName, "h-11 rounded-xl pl-9")}
          />
        </div>
        {fieldErrors.fullName ? (
          <p className="text-xs text-destructive">{fieldErrors.fullName}</p>
        ) : null}
      </motion.div>

      {/* Business name (vendors only) */}
      <AnimatePresence initial={false}>
        {role === "vendor" ? (
          <motion.div
            key="business-name"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="overflow-hidden"
          >
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
                  className={cn(authControlClassName, "h-11 rounded-xl pl-9")}
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Email */}
      <motion.div variants={reduceMotion ? undefined : fadeUp} className="space-y-1.5">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          className={cn(authControlClassName, "h-11 rounded-xl")}
        />
        {fieldErrors.email ? (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        ) : null}
      </motion.div>

      {/* Password */}
      <motion.div variants={reduceMotion ? undefined : fadeUp}>
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

        {/* Strength meter */}
        <AnimatePresence initial={false}>
          {password ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={reduceMotion ? undefined : { opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((index) => (
                    <motion.span
                      key={index}
                      initial={false}
                      animate={{
                        opacity: index < strength ? 1 : 0.25,
                        scaleX: index < strength ? 1 : 0.9,
                      }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className={cn(
                        "h-1.5 flex-1 origin-left rounded-full",
                        index < strength ? strengthMeta.color : "bg-stone-200 dark:bg-input"
                      )}
                    />
                  ))}
                </div>
                <span
                  className={cn(
                    "w-16 text-right text-[11px] font-semibold",
                    strengthMeta.text
                  )}
                >
                  {strengthMeta.label}
                </span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* Re-enter password */}
      <motion.div variants={reduceMotion ? undefined : fadeUp} className="space-y-1.5">
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
            className={cn(authControlClassName, "h-11 rounded-xl pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((value) => !value)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-[#B76E79] dark:hover:text-champagne-400"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={showConfirm ? "hide" : "show"}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18 }}
                className="flex"
              >
                {showConfirm ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {confirmError ? (
            <motion.p
              key="error"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              className="text-xs text-destructive"
            >
              {confirmError}
            </motion.p>
          ) : passwordsMatch ? (
            <motion.p
              key="match"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600"
            >
              <Check className="size-3.5" strokeWidth={3} />
              Passwords match
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* Profile image (optional, uploaded to ImgBB) */}
      <motion.div variants={reduceMotion ? undefined : fadeUp} className="space-y-1.5">
        <Label htmlFor="profileImage">
          Profile image{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-rose-200/80 bg-white/50 p-3 dark:border-input dark:bg-input/20">
          <Avatar className="size-11 ring-2 ring-rose-100 dark:ring-input">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="Profile preview" />
            ) : null}
            <AvatarFallback className="bg-champagne-500/15 text-champagne-700 dark:text-champagne-300">
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
      </motion.div>

      <motion.div variants={reduceMotion ? undefined : fadeUp}>
        <motion.div
          whileHover={reduceMotion || submitting ? undefined : { y: -2 }}
          whileTap={reduceMotion || submitting ? undefined : { scale: 0.99 }}
          transition={springSoft}
        >
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-[#B76E79] to-[#C58970] text-sm font-semibold text-[#fffdf8] shadow-md shadow-rose-900/15 transition-shadow hover:shadow-lg hover:shadow-rose-900/20 focus-visible:border-[#B76E79] focus-visible:ring-[#B76E79]/30 dark:from-champagne-500 dark:to-champagne-400 dark:text-stone-950 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"
          >
            {submitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            {submitting ? "Creating account…" : "Create Account"}
            {!submitting ? <ArrowRight className="size-4" /> : null}
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : fadeUp}
        className="flex items-center gap-3"
      >
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-200 dark:to-input" />
        <span className="text-[11px] font-medium tracking-wider text-stone-400 uppercase dark:text-muted-foreground">
          or continue with
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-200 dark:to-input" />
      </motion.div>

      <motion.div variants={reduceMotion ? undefined : fadeUp}>
        <GoogleSignInButton
          callbackURL="/sign-up"
          role={role}
          disabled={submitting}
          label={`Sign up with Google as ${role === "vendor" ? "a vendor" : "a customer"}`}
        />
      </motion.div>

      <motion.p
        variants={reduceMotion ? undefined : fadeUp}
        className="text-center text-sm text-stone-600 dark:text-muted-foreground"
      >
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-[#B76E79] underline-offset-4 hover:underline dark:text-champagne-400"
        >
          Sign in
        </Link>
      </motion.p>
    </motion.form>
  )
}
