import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"

import { Logo } from "@/components/Shared/Logo"
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed"

const AUTH_IMAGE_URL =
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <RedirectIfAuthed />
      <div className="relative grid min-h-svh bg-[#FDFBF7] lg:grid-cols-2 dark:bg-background">
        {/* Soft rose glow accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -left-24 -z-0 size-80 rounded-full bg-rose-100/60 blur-3xl dark:bg-rose-950/30"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-amber-100/50 blur-3xl dark:bg-rose-900/20"
        />

        {/* Image panel */}
        <div className="relative isolate hidden overflow-hidden lg:block">
          <Image
            src={AUTH_IMAGE_URL}
            alt="Bride and groom sharing a romantic moment beneath a veil"
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          {/* Warm rose gradient for depth and readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#43101f]/90 via-[#8c3a4b]/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#43101f] to-transparent" />

          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="w-fit rounded-2xl bg-white/10 p-2 shadow-lg ring-1 ring-white/20 backdrop-blur-md [&_span]:text-white">
              <Logo />
            </div>

            <div className="max-w-md space-y-6">
              <div className="flex items-center gap-3 text-rose-100/90">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-rose-200/70" />
                <Heart className="size-4 fill-rose-200/80 text-rose-200/80" />
                <span className="text-xs font-medium tracking-[0.25em] uppercase">
                  Real couples, real love
                </span>
              </div>
              <blockquote>
                <p className="font-heading text-3xl leading-snug font-medium text-balance">
                  &ldquo;We found our venue, photographer and caterer in one
                  weekend — everything else just fell into place.&rdquo;
                </p>
                <footer className="mt-4 text-sm text-rose-100/80">
                  Aisha &amp; Rahim — married June 2025
                </footer>
              </blockquote>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="relative flex flex-col px-4 py-8 sm:px-8">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="rounded-2xl bg-white/70 p-2 shadow-sm ring-1 ring-rose-100 backdrop-blur-sm">
                <Logo />
              </div>
            </div>
            {children}
          </div>
          <div className="mx-auto w-full max-w-md">
            <p className="text-center text-xs text-stone-500 dark:text-muted-foreground">
              <Link
                href="/"
                className="underline-offset-4 transition-colors hover:text-[#B76E79] hover:underline"
              >
                ← Back to WedPlan home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
