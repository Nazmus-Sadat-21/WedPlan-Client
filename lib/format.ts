import { CURRENCY, CURRENCY_LOCALE } from "@/lib/constants"

/** `$4500` → `$4,500` (adjust CURRENCY in lib/constants if needed). */
export function formatPrice(value: number): string {
  if (Number.isNaN(value)) return "—"
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(
  value: string | Date | undefined | null,
  style: "medium" | "long" = "medium"
): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, {
    dateStyle: style,
  }).format(date)
}

export function getUserInitials(name?: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join("")
  return initials || "?"
}
