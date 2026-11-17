const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | null {
  if (value.trim() === "") return "Email is required."
  if (!EMAIL_PATTERN.test(value.trim())) {
    return "Please enter a valid email address."
  }
  return null
}

/** Rules: minimum 6 characters, at least one uppercase and one lowercase. */
export function validatePassword(value: string): string | null {
  const messages: string[] = []
  if (value.length < 6) messages.push("at least 6 characters")
  if (!/[A-Z]/.test(value)) messages.push("one uppercase letter")
  if (!/[a-z]/.test(value)) messages.push("one lowercase letter")

  if (messages.length === 0) return null
  if (messages.length === 1) return `Password must contain ${messages[0]}.`
  const last = messages.pop()
  return `Password must contain ${messages.join(", ")} and ${last}.`
}

export function validateRequired(value: string, label: string): string | null {
  if (value.trim() === "") return `${label} is required.`
  return null
}
