"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authControlClassName } from "@/components/auth/field-styles"
import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

type PasswordFieldProps = {
  label?: string
  value: string
  onValueChange: (value: string) => void
  error?: string | null
  hint?: string
  placeholder?: string
  autoComplete?: string
  id?: string
}

/** Password input with a show/hide toggle and animated inline validation. */
export function PasswordField({
  label = "Password",
  value,
  onValueChange,
  error,
  hint,
  placeholder = "••••••••",
  autoComplete,
  id = "password",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const reduceMotion = useReducedMotion()

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={cn(
            authControlClassName,
            "pr-11",
            error && "border-destructive focus-visible:border-destructive"
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-[#B76E79] focus-visible:text-[#B76E79] focus-visible:ring-2 focus-visible:ring-[#B76E79]/30 focus-visible:ring-inset dark:hover:text-champagne-400 dark:focus-visible:text-champagne-400 dark:focus-visible:ring-champagne-400/30"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={visible ? "hide" : "show"}
              initial={reduceMotion ? false : { opacity: 0, rotate: -35, scale: 0.8 }}
              animate={reduceMotion ? undefined : { opacity: 1, rotate: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, rotate: 35, scale: 0.8 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="flex"
            >
              {visible ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.p
            key="error"
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="text-xs text-destructive"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="text-xs text-muted-foreground"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
