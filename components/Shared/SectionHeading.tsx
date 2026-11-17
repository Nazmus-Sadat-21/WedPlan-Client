import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: "center" | "left"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.2em] text-champagne-600 uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 font-heading text-3xl font-semibold text-balance text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}
