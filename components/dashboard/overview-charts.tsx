"use client"

import { useId, useState } from "react"
import { motion } from "motion/react"
import { TrendingUp } from "lucide-react"

import type { Booking } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Shared, dependency-free SVG chart kit for the dashboard overview pages
 * (vendor and customer). Pure presentation + small booking helpers.
 */

export const MONTHS_BACK = 6

export const STATUS_META = {
  accepted: { label: "Accepted", color: "#10b981" },
  pending: { label: "Pending", color: "#f59e0b" },
  rejected: { label: "Declined", color: "#B76E79" },
  cancelled: { label: "Cancelled", color: "#a8a29e" },
} as const

export type StatusKey = keyof typeof STATUS_META
export const STATUS_ORDER: StatusKey[] = ["accepted", "pending", "rejected", "cancelled"]

export const cardClassName =
  "rounded-3xl border border-rose-200/80 bg-white/95 p-5 shadow-xs sm:p-6 dark:border-input dark:bg-card/90"

export type MonthPoint = { label: string; requests: number; accepted: number }
export type BookingSummary = {
  monthly: MonthPoint[]
  status: Record<StatusKey, number>
  total: number
}

export function bookingStatusOf(booking: Booking): StatusKey {
  const raw = String(booking.status ?? "pending").toLowerCase()
  if (raw === "accepted") return "accepted"
  if (raw === "rejected") return "rejected"
  if (raw === "cancelled") return "cancelled"
  return "pending"
}

export function lastMonths(count: number) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short" })
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatter.format(date),
    }
  })
}

export function summarizeBookings(bookings: Booking[]): BookingSummary {
  const months = lastMonths(MONTHS_BACK)
  const monthly: MonthPoint[] = months.map((month) => ({
    label: month.label,
    requests: 0,
    accepted: 0,
  }))
  const status: Record<StatusKey, number> = {
    accepted: 0,
    pending: 0,
    rejected: 0,
    cancelled: 0,
  }

  for (const booking of bookings) {
    const key = bookingStatusOf(booking)
    status[key]++

    const created = new Date(booking.createdAt as string)
    if (Number.isNaN(created.getTime())) continue
    const index = months.findIndex(
      (month) => month.key === `${created.getFullYear()}-${created.getMonth()}`
    )
    if (index === -1) continue
    monthly[index].requests++
    if (key === "accepted") monthly[index].accepted++
  }

  return { monthly, status, total: bookings.length }
}

export function smoothPath(points: { x: number; y: number }[], top: number, bottom: number) {
  if (points.length === 0) return ""
  if (points.length === 1) return `M${points[0].x},${points[0].y}`
  const clampY = (y: number) => Math.min(Math.max(y, top), bottom)
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = clampY(p1.y + (p2.y - p0.y) / 6)
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = clampY(p2.y - (p3.y - p1.y) / 6)
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

export function TrendChart({
  data,
  primaryLabel = "Requests",
  secondaryLabel = "Accepted",
}: {
  data: MonthPoint[]
  primaryLabel?: string
  secondaryLabel?: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  const W = 640
  const H = 280
  const pad = { top: 20, right: 16, bottom: 32, left: 36 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  const peak = Math.max(...data.map((d) => d.requests), 0)
  const maxValue = Math.max(4, Math.ceil(peak / 4) * 4)
  const ticks = [0, 1, 2, 3, 4].map((i) => (maxValue / 4) * i)

  const x = (index: number) =>
    pad.left + (data.length === 1 ? innerW / 2 : (index / (data.length - 1)) * innerW)
  const y = (value: number) => pad.top + innerH - (value / maxValue) * innerH

  const requestPoints = data.map((d, i) => ({ x: x(i), y: y(d.requests) }))
  const acceptedPoints = data.map((d, i) => ({ x: x(i), y: y(d.accepted) }))
  const bottom = pad.top + innerH

  const requestLine = smoothPath(requestPoints, pad.top, bottom)
  const acceptedLine = smoothPath(acceptedPoints, pad.top, bottom)
  const requestArea = `${requestLine} L${requestPoints.at(-1)?.x},${bottom} L${requestPoints[0]?.x},${bottom} Z`
  const acceptedArea = `${acceptedLine} L${acceptedPoints.at(-1)?.x},${bottom} L${acceptedPoints[0]?.x},${bottom} Z`

  const hoveredPoint = hovered !== null ? data[hovered] : null
  const tooltipLeft =
    hovered !== null
      ? Math.min(Math.max((x(hovered) / W) * 100, 14), 86)
      : 0

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${primaryLabel} and ${secondaryLabel} over the last six months`}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B76E79" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#B76E79" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="acceptedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid + y axis */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              strokeDasharray="4 6"
              className="stroke-rose-100 dark:stroke-input"
            />
            <text
              x={pad.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-stone-400 text-[11px] dark:fill-muted-foreground"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {/* Areas */}
        <motion.path
          d={requestArea}
          fill="url(#requestsFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
        />
        <motion.path
          d={acceptedArea}
          fill="url(#acceptedFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.35 }}
        />

        {/* Lines */}
        <motion.path
          d={requestLine}
          fill="none"
          stroke="#B76E79"
          strokeWidth={3}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        <motion.path
          d={acceptedLine}
          fill="none"
          stroke="#10b981"
          strokeWidth={3}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
        />

        {/* Hover guide + markers */}
        {hovered !== null ? (
          <g>
            <line
              x1={x(hovered)}
              x2={x(hovered)}
              y1={pad.top}
              y2={bottom}
              className="stroke-[#B76E79]/40"
              strokeWidth={1.5}
            />
            <circle
              cx={x(hovered)}
              cy={y(data[hovered].requests)}
              r={5.5}
              fill="#fff"
              stroke="#B76E79"
              strokeWidth={3}
            />
            <circle
              cx={x(hovered)}
              cy={y(data[hovered].accepted)}
              r={5.5}
              fill="#fff"
              stroke="#10b981"
              strokeWidth={3}
            />
          </g>
        ) : null}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={d.label + i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className={cn(
              "text-[11px] font-medium",
              hovered === i
                ? "fill-[#9F5863]"
                : "fill-stone-400 dark:fill-muted-foreground"
            )}
          >
            {d.label}
          </text>
        ))}

        {/* Invisible hit areas */}
        {data.map((d, i) => {
          const step = innerW / Math.max(data.length - 1, 1)
          return (
            <rect
              key={`hit-${d.label}-${i}`}
              x={x(i) - step / 2}
              y={pad.top}
              width={step}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onTouchStart={() => setHovered(i)}
            />
          )
        })}
      </svg>

      {hoveredPoint ? (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-2xl border border-rose-200/80 bg-white/95 px-3.5 py-2.5 text-xs shadow-lg shadow-rose-950/10 backdrop-blur-md dark:border-input dark:bg-card/95"
          style={{ left: `${tooltipLeft}%` }}
        >
          <p className="font-heading text-sm font-semibold text-stone-900 dark:text-foreground">
            {hoveredPoint.label}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-stone-600 dark:text-muted-foreground">
            <span className="size-2 rounded-full bg-[#B76E79]" />
            {primaryLabel}
            <span className="ml-auto pl-3 font-semibold text-stone-900 dark:text-foreground">
              {hoveredPoint.requests}
            </span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-stone-600 dark:text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            {secondaryLabel}
            <span className="ml-auto pl-3 font-semibold text-stone-900 dark:text-foreground">
              {hoveredPoint.accepted}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  )
}

export type DonutItem = {
  key: string
  label: string
  value: number
  color: string
}

export function DonutChart({
  items,
  total,
  centerLabel = "Total",
}: {
  items: DonutItem[]
  total: number
  centerLabel?: string
}) {
  const [active, setActive] = useState<string | null>(null)

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const visible = items.filter((item) => item.value > 0)
  const gap = visible.length > 1 ? 5 : 0

  let offset = 0
  const segments = items.map((item) => {
    const length = total > 0 ? (item.value / total) * circumference : 0
    const segment = {
      ...item,
      length: Math.max(length - gap, 0),
      offset,
    }
    offset += length
    return segment
  })

  const focus = items.find((item) => item.key === active) ?? null
  const centerValue = focus ? focus.value : total
  const centerText = focus ? focus.label : centerLabel

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative size-48 sm:size-52">
        <svg viewBox="0 0 180 180" className="size-full -rotate-90">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            strokeWidth="22"
            className="stroke-rose-100 dark:stroke-input"
          />
          {total > 0
            ? segments.map((segment) =>
                segment.value > 0 ? (
                  <motion.circle
                    key={segment.key}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    strokeWidth={active === segment.key ? 27 : 22}
                    strokeLinecap="butt"
                    stroke={segment.color}
                    strokeDasharray={`${segment.length} ${circumference}`}
                    strokeDashoffset={-segment.offset}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: active && active !== segment.key ? 0.35 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    onMouseEnter={() => setActive(segment.key)}
                    onMouseLeave={() => setActive(null)}
                    className="cursor-pointer transition-[stroke-width] duration-200"
                  />
                ) : null
              )
            : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="font-heading text-4xl font-bold text-stone-900 dark:text-foreground">
            {centerValue}
          </span>
          <span className="mt-0.5 text-[11px] font-medium tracking-wide text-stone-500 uppercase dark:text-muted-foreground">
            {centerText}
          </span>
        </div>
      </div>

      <ul className="grid w-full grid-cols-2 gap-2">
        {items.map((item) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
          return (
            <li
              key={item.key}
              onMouseEnter={() => setActive(item.key)}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors",
                active === item.key
                  ? "border-[#B76E79]/40 bg-rose-50/70 dark:bg-input/30"
                  : "border-rose-100 bg-[#FDFBF7] dark:border-input dark:bg-input/15"
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-stone-600 dark:text-muted-foreground">
                {item.label}
              </span>
              <span className="ml-auto font-semibold text-stone-900 dark:text-foreground">
                {item.value}
                <span className="ml-1 font-normal text-stone-400">
                  {percent}%
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function StatusDonut({
  status,
  total,
}: {
  status: Record<StatusKey, number>
  total: number
}) {
  return (
    <DonutChart
      total={total}
      centerLabel="Total requests"
      items={STATUS_ORDER.map((key) => ({
        key,
        label: STATUS_META[key].label,
        value: status[key],
        color: STATUS_META[key].color,
      }))}
    />
  )
}

export type StackedPart = {
  key: string
  label: string
  value: number
  /** Tailwind background class, e.g. "bg-emerald-500" */
  color: string
}

export function StackedBar({
  parts,
  total,
}: {
  parts: StackedPart[]
  total: number
}) {
  return (
    <div>
      <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-rose-100/70 dark:bg-input/40">
        {total > 0
          ? parts.map((part, index) =>
              part.value > 0 ? (
                <motion.div
                  key={part.key}
                  className={cn("h-full", part.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${(part.value / total) * 100}%` }}
                  transition={{
                    duration: 0.8,
                    delay: 0.1 * index,
                    ease: "easeOut",
                  }}
                />
              ) : null
            )
          : null}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {parts.map((part) => (
          <li
            key={part.key}
            className="flex items-center gap-2 rounded-xl border border-rose-100 bg-[#FDFBF7] px-3 py-2 text-xs dark:border-input dark:bg-input/15"
          >
            <span className={cn("size-2.5 shrink-0 rounded-full", part.color)} />
            <span className="text-stone-600 dark:text-muted-foreground">
              {part.label}
            </span>
            <span className="ml-auto font-semibold text-stone-900 dark:text-foreground">
              {part.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export type SeriesPoint = { label: string; value: number }

/**
 * Single-series monthly chart. `variant="area"` draws a smooth filled line,
 * `variant="bar"` draws rounded bars. Hover shows a tooltip.
 */
export function MonthlySeriesChart({
  data,
  color,
  variant = "area",
  formatValue = (value: number) => String(value),
  seriesLabel,
}: {
  data: SeriesPoint[]
  color: string
  variant?: "area" | "bar"
  formatValue?: (value: number) => string
  seriesLabel: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const gradientId = `series-${useId().replace(/:/g, "")}`

  const W = 640
  const H = 280
  const pad = { top: 20, right: 16, bottom: 32, left: 52 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom
  const bottom = pad.top + innerH

  const peak = Math.max(...data.map((d) => d.value), 0)
  const maxValue = Math.max(4, Math.ceil(peak / 4) * 4)
  const ticks = [0, 1, 2, 3, 4].map((i) => (maxValue / 4) * i)

  const step = innerW / Math.max(data.length, 1)
  const x = (index: number) => pad.left + step * (index + 0.5)
  const y = (value: number) => pad.top + innerH - (value / maxValue) * innerH
  const barWidth = Math.min(46, step * 0.56)

  const points = data.map((d, i) => ({ x: x(i), y: y(d.value) }))
  const line = smoothPath(points, pad.top, bottom)
  const area = `${line} L${points.at(-1)?.x},${bottom} L${points[0]?.x},${bottom} Z`

  const hoveredPoint = hovered !== null ? data[hovered] : null
  const tooltipLeft =
    hovered !== null ? Math.min(Math.max((x(hovered) / W) * 100, 14), 86) : 0

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${seriesLabel} over the last six months`}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={variant === "bar" ? 0.95 : 0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={variant === "bar" ? 0.55 : 0} />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              strokeDasharray="4 6"
              className="stroke-rose-100 dark:stroke-input"
            />
            <text
              x={pad.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-stone-400 text-[11px] dark:fill-muted-foreground"
            >
              {formatValue(Math.round(tick))}
            </text>
          </g>
        ))}

        {variant === "bar" ? (
          data.map((d, i) => {
            const height = Math.max(bottom - y(d.value), d.value > 0 ? 4 : 0)
            return (
              <motion.rect
                key={`bar-${d.label}-${i}`}
                x={x(i) - barWidth / 2}
                width={barWidth}
                rx={8}
                fill={`url(#${gradientId})`}
                initial={{ height: 0, y: bottom }}
                animate={{ height, y: bottom - height }}
                transition={{ duration: 0.7, delay: 0.06 * i, ease: "easeOut" }}
                opacity={hovered === null || hovered === i ? 1 : 0.55}
              />
            )
          })
        ) : (
          <>
            <motion.path
              d={area}
              fill={`url(#${gradientId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            />
            <motion.path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          </>
        )}

        {variant === "area" && hovered !== null ? (
          <g>
            <line
              x1={x(hovered)}
              x2={x(hovered)}
              y1={pad.top}
              y2={bottom}
              stroke={color}
              strokeOpacity={0.35}
              strokeWidth={1.5}
            />
            <circle
              cx={x(hovered)}
              cy={y(data[hovered].value)}
              r={5.5}
              fill="#fff"
              stroke={color}
              strokeWidth={3}
            />
          </g>
        ) : null}

        {data.map((d, i) => (
          <text
            key={`label-${d.label}-${i}`}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className={cn(
              "text-[11px] font-medium",
              hovered === i
                ? "fill-[#9F5863]"
                : "fill-stone-400 dark:fill-muted-foreground"
            )}
          >
            {d.label}
          </text>
        ))}

        {data.map((d, i) => (
          <rect
            key={`hit-${d.label}-${i}`}
            x={x(i) - step / 2}
            y={pad.top}
            width={step}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
            onTouchStart={() => setHovered(i)}
          />
        ))}
      </svg>

      {hoveredPoint ? (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-2xl border border-rose-200/80 bg-white/95 px-3.5 py-2.5 text-xs shadow-lg shadow-rose-950/10 backdrop-blur-md dark:border-input dark:bg-card/95"
          style={{ left: `${tooltipLeft}%` }}
        >
          <p className="font-heading text-sm font-semibold text-stone-900 dark:text-foreground">
            {hoveredPoint.label}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-stone-600 dark:text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {seriesLabel}
            <span className="ml-auto pl-3 font-semibold text-stone-900 dark:text-foreground">
              {formatValue(hoveredPoint.value)}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  )
}


export function CategoryBars({
  categories,
}: {
  categories: { name: string; count: number }[]
}) {
  const max = Math.max(...categories.map((c) => c.count), 1)

  return (
    <ul className="space-y-4">
      {categories.map((category, index) => (
        <li key={category.name}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-stone-700 dark:text-foreground">
              {category.name}
            </span>
            <span className="shrink-0 font-heading text-sm font-semibold text-stone-900 dark:text-foreground">
              {category.count}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-rose-100/70 dark:bg-input/40">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#B76E79] to-[#C58970]"
              initial={{ width: 0 }}
              animate={{ width: `${(category.count / max) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.1 * index, ease: "easeOut" }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ChartCard({
  title,
  description,
  action,
  className,
  children,
  delay = 0,
}: {
  title: string
  description: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(cardClassName, className)}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-stone-900 dark:text-foreground">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </motion.section>
  )
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200/80 bg-[#FDFBF7] px-4 py-8 text-center dark:border-input dark:bg-input/10">
      <TrendingUp className="size-6 text-[#B76E79]" />
      <p className="mt-2 max-w-xs text-xs text-stone-500 dark:text-muted-foreground">
        {message}
      </p>
    </div>
  )
}