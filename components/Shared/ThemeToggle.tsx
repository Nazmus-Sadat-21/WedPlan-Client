"use client"

import { Check, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "@wrksz/themes/client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", label: "Light", hint: "Ivory & rose", icon: Sun },
  { value: "dark", label: "Dark", hint: "Candlelit evening", icon: Moon },
  {
    value: "system",
    label: "System",
    hint: "Match your device",
    icon: Monitor,
  },
] as const

/**
 * Light / dark / system switcher. The trigger swaps its sun and moon icons
 * with CSS `dark:` variants, so it renders correctly before hydration.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Change colour theme"
            title="Change theme (press D)"
            className={cn(
              "group relative size-10 overflow-hidden rounded-full border border-rose-200/80 bg-white/80 text-[#B76E79] shadow-2xs backdrop-blur-sm transition-all duration-300 hover:border-[#B76E79]/50 hover:bg-white hover:shadow-md hover:shadow-rose-900/10 dark:border-rose-300/20 dark:bg-white/5 dark:text-amber-200 dark:hover:bg-white/10 dark:hover:shadow-amber-200/10",
              className
            )}
          />
        }
      >
        {/* Warm glow behind the icon */}
        <span
          aria-hidden="true"
          className="absolute inset-1.5 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 opacity-70 transition-opacity group-hover:opacity-100 dark:from-indigo-400/20 dark:to-rose-400/20"
        />
        <Sun className="relative size-[1.15rem] scale-100 rotate-0 transition-all duration-500 dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-[1.15rem] scale-0 rotate-90 transition-all duration-500 dark:scale-100 dark:rotate-0 dark:fill-amber-200/30" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-56 rounded-2xl border border-rose-200/80 bg-white/95 p-1.5 shadow-xl shadow-rose-950/10 backdrop-blur-xl dark:border-input dark:bg-popover/95"
      >
        {/* Base UI requires the label to live inside a group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 pt-1.5 pb-2 text-[10px] font-semibold tracking-[0.2em] text-stone-400 uppercase dark:text-muted-foreground">
            Appearance
          </DropdownMenuLabel>
          {OPTIONS.map((option) => {
            const active = theme === option.value
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "group gap-3 rounded-xl px-2.5 py-2 text-stone-700 focus:bg-rose-50/90 focus:text-[#9F5863] dark:text-foreground dark:focus:bg-input/40",
                  active && "bg-rose-50/80 text-[#9F5863] dark:bg-input/40"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors",
                    active
                      ? "bg-gradient-to-br from-[#B76E79] to-[#C58970] text-white ring-transparent"
                      : "bg-rose-50 text-[#B76E79] ring-rose-100 dark:bg-input/40 dark:ring-input"
                  )}
                >
                  <option.icon className="size-4" />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-[11px] text-stone-400 dark:text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
                {active ? <Check className="size-4 text-[#B76E79]" /> : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
