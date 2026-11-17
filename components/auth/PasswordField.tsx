"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

/** Password input with a show/hide toggle and inline validation message. */
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
          className={cn("h-10 pr-10", error && "border-destructive")}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
