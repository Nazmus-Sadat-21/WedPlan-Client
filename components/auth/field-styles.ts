/**
 * Shared focus treatment for auth form controls. The focus colour follows the
 * WedPlan theme: rose gold in light mode and champagne in dark mode.
 */
export const authControlClassName =
  "h-10 border-rose-200/90 bg-white/70 focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:border-input dark:bg-input/30 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"

/** Same palette for focusable surfaces that are not native inputs. */
export const authFocusRingClassName =
  "outline-none focus-visible:border-[#B76E79] focus-visible:ring-[3px] focus-visible:ring-[#B76E79]/25 dark:focus-visible:border-champagne-400 dark:focus-visible:ring-champagne-400/30"
